import type { User, Organization } from "@prisma/client";
import prisma from "../config/database.js";
import {
  UserRepository,
  UserWithRelations,
} from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/hash.util.js";
import { generateAccessToken } from "../utils/jwt.util.js";
import { AuthenticationError, ConflictError } from "../utils/errors.util.js";
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
        where: { name: "ADMIN" },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: "ADMIN",
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

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(
        result.user.email,
        result.user.firstName,
        result.organization.name
      );
    } catch (error) {
      // Log error but don't fail the registration
      console.error("Failed to send welcome email:", error);
    }

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

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = result.user;

    return {
      user: {
        ...userWithoutPassword,
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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!data.twoFactorToken) {
        // Return response indicating 2FA is required
        const { passwordHash, ...userWithoutPassword } = user;
        return {
          user: {
            ...userWithoutPassword,
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

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
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

    // Extract roles and permissions
    const roles =
      userWithRoles?.roles.map((userRole) => userRole.role.name) || [];
    const permissions = new Set<string>();
    userWithRoles?.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((permission) => {
        permissions.add(permission.name);
      });
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      roles,
      permissions: Array.from(permissions),
      createdAt: userWithoutPassword.createdAt.toISOString(),
      updatedAt: userWithoutPassword.updatedAt.toISOString(),
    };
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
    const primaryRole = userWithRoles?.roles[0]?.role?.name || "USER";

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
      role: "USER",
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

    // Audit log - Email verified
    await auditService.logAuthentication(
      user.id,
      user.organizationId,
      "EMAIL_VERIFIED"
    );

    return { message: "Email verified successfully", user };
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
}
