import type { User, Organization } from "@prisma/client";
import prisma from "../config/database.js";
import {
  UserRepository,
  UserWithRelations,
} from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/hash.util.js";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt.util.js";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.util.js";
import { emailService } from "./email.service.js";
import { emailVerificationService } from "./email-verification.service.js";
import { auditService } from "./audit.service.js";
import { twoFactorService } from "./two-factor.service.js";
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../types/auth.types.js";
import type { Address } from "../types/common.types.js";
import type { Role, Permission } from "@tms/shared-types";

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async register(
    data: RegisterDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Check if MC# already exists
    const existingMC = await prisma.organization.findUnique({
      where: { mcNumber: data.mcNumber },
    });
    if (existingMC) {
      throw new ConflictError("An organization with this MC# already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: this.generateSlug(data.organizationName),
          mcNumber: data.mcNumber,
          dotNumber: data.dotNumber,
          address: data.companyAddress,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          organizationId: organization.id,
          emailVerified: false,
          isActive: true,
        },
      });

      // Find or create admin role
      let adminRole = await tx.role.findUnique({
        where: { name: "ADMINISTRATOR" },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: "ADMINISTRATOR",
            description: "System Administrator",
            isSystem: true,
          },
        });
      }

      // Assign admin role to user
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      return { user, organization };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user, result.organization);

    // Send email verification
    try {
      await emailVerificationService.sendVerificationEmail(
        result.user.id,
        result.user.email,
        result.user.firstName
      );
    } catch (error) {
      // Log error but don't fail the registration
      console.error("Failed to send verification email:", error);
    }

    // Audit log - User registration
    await auditService.logAuthentication(
      result.user.id,
      result.organization.id,
      "REGISTER",
      ipAddress,
      userAgent
    );

    // Get user's roles and permissions
    const userWithRoles = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    // Extract roles and permissions with proper typing
    const roles: Role[] =
      userWithRoles?.roles.map((userRole) => userRole.role.name as Role) || [];
    const permissions = new Set<Permission>();
    userWithRoles?.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((permission) => {
        permissions.add(permission.name as Permission);
      });
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = result.user;

    return {
      user: {
        ...userWithoutPassword,
        roles,
        permissions: Array.from(permissions),
        createdAt: userWithoutPassword.createdAt.toISOString(),
        updatedAt: userWithoutPassword.updatedAt.toISOString(),
      },
      organization: {
        ...result.organization,
        createdAt: result.organization.createdAt.toISOString(),
        updatedAt: result.organization.updatedAt.toISOString(),
        address: (result.organization.address as Address) || null,
      },
      tokens,
    };
  }

  async login(
    data: LoginDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepo.findByEmail(data.email);

    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError("Account is inactive");
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check if organization is active
    if (!user.organization.isActive) {
      throw new AuthenticationError("Organization is inactive");
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AuthenticationError(
        "Please verify your email address before logging in"
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!data.twoFactorToken) {
        // Return response indicating 2FA is required
        const { passwordHash, ...userWithoutPassword } = user;
        return {
          user: {
            ...userWithoutPassword,
            roles: [],
            permissions: [],
            createdAt: userWithoutPassword.createdAt.toISOString(),
            updatedAt: userWithoutPassword.updatedAt.toISOString(),
          },
          organization: {
            ...user.organization,
            createdAt: user.organization.createdAt.toISOString(),
            updatedAt: user.organization.updatedAt.toISOString(),
            address: (user.organization.address as Address) || null,
          },
          tokens: {
            accessToken: "",
            expiresIn: 0,
          },
          requires2FA: true,
        };
      }

      // Verify 2FA token
      const is2FAValid = await twoFactorService.verifyUserToken(
        user.id,
        data.twoFactorToken
      );

      if (!is2FAValid) {
        throw new AuthenticationError("Invalid 2FA token");
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, user.organization);

    // Create session in database
    await this.createSession(
      user.id,
      tokens.accessToken,
      tokens.accessToken,
      ipAddress,
      userAgent
    );

    // Update last login
    await this.userRepo.updateLastLogin(user.id);

    // Audit log - User login
    await auditService.logAuthentication(
      user.id,
      user.organization.id,
      "LOGIN",
      ipAddress,
      userAgent
    );

    // Get user's roles and permissions
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    // Extract roles and permissions with proper typing
    const roles: Role[] =
      userWithRoles?.roles.map((userRole) => userRole.role.name as Role) || [];
    const permissions = new Set<Permission>();
    userWithRoles?.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((permission) => {
        permissions.add(permission.name as Permission);
      });
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        roles,
        permissions: Array.from(permissions),
        createdAt: userWithoutPassword.createdAt.toISOString(),
        updatedAt: userWithoutPassword.updatedAt.toISOString(),
      },
      organization: {
        ...user.organization,
        createdAt: user.organization.createdAt.toISOString(),
        updatedAt: user.organization.updatedAt.toISOString(),
        address: (user.organization.address as Address) || null,
      },
      tokens,
    };
  }

  async logout(userId: string, organizationId: string): Promise<void> {
    // Delete all sessions for the user
    await this.deleteUserSessions(userId);

    // Audit log - User logout
    await auditService.logAuthentication(userId, organizationId, "LOGOUT");
  }

  async getCurrentUser(userId: string, organizationId: string) {
    const user = await this.userRepo.findByIdWithRelations(
      userId,
      organizationId
    );

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Get user's roles and permissions
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    // Extract roles and permissions with proper typing
    const roles: Role[] =
      userWithRoles?.roles.map((userRole) => userRole.role.name as Role) || [];
    const permissions = new Set<Permission>();
    userWithRoles?.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((permission) => {
        permissions.add(permission.name as Permission);
      });
    });

    const { passwordHash, ...userWithoutPassword } = user;
    const result = {
      ...userWithoutPassword,
      roles,
      permissions: Array.from(permissions),
      createdAt: userWithoutPassword.createdAt.toISOString(),
      updatedAt: userWithoutPassword.updatedAt.toISOString(),
    };
    console.log("getCurrentUser returning:", {
      avatar: result.avatar,
      id: result.id,
    });
    return result;
  }

  private async generateTokens(
    user: User | UserWithRelations,
    organization: Organization
  ) {
    // Get user's roles and permissions
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    // Extract primary role (first role or ADMIN)
    const primaryRole = userWithRoles?.roles[0]?.role?.name || "VIEWER";

    // Extract all permissions from all roles
    const permissions = new Set<string>();
    userWithRoles?.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((permission) => {
        permissions.add(permission.name);
      });
    });

    const payload = {
      sub: user.id,
      org: organization.id,
      email: user.email,
      role: primaryRole,
      permissions: Array.from(permissions),
    };

    const accessToken = generateAccessToken(payload);

    return {
      accessToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async forgotPassword(data: ForgotPasswordDto) {
    // Find user by email
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message:
          "If an account with that email exists, we've sent a password reset link.",
      };
    }

    // Generate reset token
    const resetToken = generateAccessToken({
      sub: user.id,
      org: user.organizationId,
      email: user.email,
      role: "VIEWER",
      permissions: [],
    });

    // Store reset token in database (expires in 1 hour)
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName
      );
    } catch (error) {
      // Log error but don't fail the request
      console.error("Failed to send password reset email:", error);
    }

    return {
      message:
        "If an account with that email exists, we've sent a password reset link.",
    };
  }

  async resetPassword(data: ResetPasswordDto) {
    // Find valid reset token
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token: data.token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetRecord) {
      throw new AuthenticationError("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.password);

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: hashedPassword },
    });

    // Delete all reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: resetRecord.userId },
    });

    // Audit log - Password reset
    await auditService.logAuthentication(
      resetRecord.userId,
      resetRecord.user.organizationId,
      "PASSWORD_RESET"
    );

    return { message: "Password reset successfully" };
  }

  async verifyEmail(token: string) {
    const user = await emailVerificationService.verifyEmail(token);

    // Get user with organization for token generation
    const userWithOrg = await this.userRepo.findByEmail(user.email);
    if (!userWithOrg) {
      throw new Error("User not found after verification");
    }

    // Generate authentication tokens
    const tokens = await this.generateTokens(
      userWithOrg,
      userWithOrg.organization
    );

    // Get user's roles and permissions (same as login method)
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    // Extract roles and permissions with proper typing
    const roles: Role[] =
      userWithRoles?.roles.map((userRole) => userRole.role.name as Role) || [];
    const permissions = new Set<Permission>();
    userWithRoles?.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((permission) => {
        permissions.add(permission.name as Permission);
      });
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = userWithOrg;

    // Audit log - Email verified
    await auditService.logAuthentication(
      user.id,
      user.organizationId,
      "EMAIL_VERIFIED"
    );

    return {
      message: "Email verified successfully",
      user: {
        ...userWithoutPassword,
        roles,
        permissions: Array.from(permissions),
        createdAt: userWithoutPassword.createdAt.toISOString(),
        updatedAt: userWithoutPassword.updatedAt.toISOString(),
      },
      organization: {
        ...userWithOrg.organization,
        createdAt: userWithOrg.organization.createdAt.toISOString(),
        updatedAt: userWithOrg.organization.updatedAt.toISOString(),
        address: (userWithOrg.organization.address as Address) || null,
      },
      tokens,
    };
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message:
          "If an account with that email exists, we've sent a verification link.",
      };
    }

    await emailVerificationService.sendVerificationEmail(
      user.id,
      user.email,
      user.firstName
    );

    return {
      message:
        "If an account with that email exists, we've sent a verification link.",
    };
  }

  /**
   * Creates a new session in the database
   */
  private async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.session.create({
        data: {
          userId,
          token: accessToken,
          refreshToken,
          ipAddress,
          userAgent,
          expiresAt,
        },
      });
    } catch (error) {
      // Log error but don't throw - session creation failure shouldn't break login
      console.error("Failed to create session:", error);
    }
  }

  /**
   * Deletes all sessions for a user
   */
  private async deleteUserSessions(userId: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      // Log error but don't throw - session deletion failure shouldn't break logout
      console.error("Failed to delete user sessions:", error);
    }
  }

  /**
   * Cleans up expired sessions (should be called periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired sessions`);
      }
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
    }
  }

  async acceptInvitation(token: string, password: string) {
    try {
      // Verify the invitation token
      const decoded = verifyAccessToken(token);

      if (!decoded || !decoded.sub || !decoded.email) {
        throw new AuthenticationError("Invalid or expired invitation token");
      }

      // Check if user exists and is not yet verified
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          organization: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (user.emailVerified) {
        throw new ConflictError("User has already accepted the invitation");
      }

      // Validate user is active and organization is active
      if (!user.isActive) {
        throw new AuthenticationError("User account is not active");
      }

      if (!user.organization.isActive) {
        throw new AuthenticationError("Organization is not active");
      }

      // Validate user has at least one role
      if (!user.roles || user.roles.length === 0) {
        throw new AuthenticationError("User has no assigned roles");
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update user with new password and mark as verified
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
        include: {
          organization: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Generate session token
      const sessionToken = generateAccessToken({
        sub: updatedUser.id,
        org: updatedUser.organizationId,
        email: updatedUser.email,
        role: updatedUser.roles[0]?.role?.name || "VIEWER",
        permissions: [], // Will be populated by middleware
      });

      // Create session
      await prisma.session.create({
        data: {
          userId: updatedUser.id,
          token: sessionToken,
          refreshToken: "", // Not needed for invitation acceptance
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          userAgent: "Invitation Acceptance",
          ipAddress: "127.0.0.1", // Will be updated on next login
        },
      });

      // Get user permissions
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: updatedUser.id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });

      const permissions = new Set<string>();
      userWithPermissions?.roles.forEach((userRole) => {
        userRole.role.permissions.forEach((permission) => {
          permissions.add(permission.name);
        });
      });

      // Log invitation acceptance
      await auditService.log({
        userId: updatedUser.id,
        organizationId: updatedUser.organizationId,
        action: "INVITATION_ACCEPTED",
        entityType: "USER",
        entityId: updatedUser.id,
        changes: {
          email: updatedUser.email,
          roles: updatedUser.roles.map((ur) => ur.role.name),
          organizationName: updatedUser.organization.name,
        },
        ipAddress: "127.0.0.1", // Will be updated with actual IP
        userAgent: "Invitation Acceptance",
      });

      return {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          avatar: updatedUser.avatar,
          emailVerified: updatedUser.emailVerified,
          emailVerifiedAt: updatedUser.emailVerifiedAt,
          twoFactorEnabled: updatedUser.twoFactorEnabled,
          isActive: updatedUser.isActive,
          lastLoginAt: updatedUser.lastLoginAt,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          organization: updatedUser.organization,
          roles: updatedUser.roles.map((ur) => ur.role.name),
          permissions: Array.from(permissions),
        },
        token: sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      throw error;
    }
  }

  async validateInvitation(token: string) {
    try {
      // Verify the invitation token
      const decoded = verifyAccessToken(token);

      if (!decoded || !decoded.sub || !decoded.email) {
        throw new AuthenticationError("Invalid or expired invitation token");
      }

      // Get user details with organization and roles
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          organization: {
            select: { name: true },
          },
          roles: {
            include: {
              role: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Get inviter details (the user who sent the invitation)
      // For now, we'll use a generic name since we don't store inviter info
      const inviterName = "Team Administrator";

      return {
        organizationName: user.organization.name,
        inviterName,
        roles: user.roles.map((ur) => ur.role.name),
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
      };
    } catch (error) {
      console.error("Failed to validate invitation:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
