import { comparePassword, hashPassword } from "../utils/hash.util.js";
import { twoFactorService } from "./two-factor.service.js";
import { emailService } from "./email.service.js";
import { generateAccessToken } from "../utils/jwt.util.js";
import prisma from "../config/database.js";
import { NotFoundError, ConflictError } from "../utils/errors.util.js";
import { permissionUpdateService } from "./permission-update.service.js";
import {
  UserRepository,
  UserCustomerWithCustomer,
} from "../repositories/user.repository.js";
import type {
  ProfileSettings,
  UpdateProfileRequest,
  SecuritySettings,
  ChangePasswordRequest,
  EnableTwoFactorRequest,
  DisableTwoFactorRequest,
  ActiveSession,
  OrganizationSettings,
  UpdateOrganizationRequest,
  UpdateBusinessSettingsRequest,
  UpdateDocumentNumberingRequest,
  TeamMember,
  InviteTeamMemberRequest,
  UpdateTeamMemberRequest,
  BillingSettings,
  TwoFactorSetupResponse,
} from "@tms/shared-types";

export class SettingsService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  // ==================== PROFILE SETTINGS ====================

  async getProfile(
    userId: string,
    organizationId: string
  ): Promise<ProfileSettings> {
    const user = await this.userRepo.findById(userId, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      timezone: "America/New_York",
      language: "en",
    };
  }

  async updateProfile(
    userId: string,
    organizationId: string,
    updateData: UpdateProfileRequest
  ): Promise<ProfileSettings> {
    const user = await this.userRepo.findById(userId, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    await this.userRepo.update(
      userId,
      {
        ...(updateData.firstName && { firstName: updateData.firstName }),
        ...(updateData.lastName && { lastName: updateData.lastName }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
        ...(updateData.avatar !== undefined && { avatar: updateData.avatar }),
      },
      organizationId
    );

    return this.getProfile(userId, organizationId);
  }

  // Notification settings removed - using simplified notification system

  // ==================== SECURITY SETTINGS ====================

  async getSecuritySettings(
    userId: string,
    organizationId: string
  ): Promise<SecuritySettings> {
    const user = await this.userRepo.findById(userId, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    // Get sessions separately since we're not including them in the user query
    const sessions = await this.getActiveSessions(userId);

    return {
      twoFactorEnabled: user.twoFactorEnabled,
      lastPasswordChange: user.updatedAt.toISOString(), // Simplified
      activeSessions: sessions,
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
    };
  }

  async changePassword(
    userId: string,
    organizationId: string,
    changeData: ChangePasswordRequest
  ): Promise<void> {
    const user = await this.userRepo.findById(userId, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    // Verify current password
    const isValidPassword = await comparePassword(
      changeData.currentPassword,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new ConflictError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await hashPassword(changeData.newPassword);

    await this.userRepo.update(
      userId,
      {
        passwordHash: hashedPassword,
      },
      organizationId
    );
  }

  async setupTwoFactor(
    userId: string,
    organizationId: string
  ): Promise<TwoFactorSetupResponse> {
    const user = await this.userRepo.findById(userId, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.twoFactorEnabled) {
      throw new ConflictError("Two-factor authentication is already enabled");
    }

    const setup = await twoFactorService.generateSecret(userId, user.email);

    return {
      secret: setup.secret,
      qrCode: setup.qrCode,
      otpauthUrl: setup.otpauthUrl || "",
    };
  }

  async enableTwoFactor(
    userId: string,
    organizationId: string,
    enableData: EnableTwoFactorRequest
  ): Promise<{ backupCodes: string[] }> {
    const user = await this.userRepo.findById(userId, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    // Enable 2FA using the service
    await twoFactorService.enable2FA(userId, enableData.token);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    await this.userRepo.update(
      userId,
      {
        twoFactorEnabled: true,
        twoFactorSecret: enableData.secret,
        // Note: In a real implementation, you'd need to store backup codes
        // Since we don't have a settings field, we'll skip this for now
      },
      ""
    );

    return { backupCodes };
  }

  async disableTwoFactor(
    userId: string,
    organizationId: string,
    disableData: DisableTwoFactorRequest
  ): Promise<void> {
    const user = await this.userRepo.findById(userId, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ConflictError("Two-factor authentication is not enabled");
    }

    // Disable 2FA using the service
    await twoFactorService.disable2FA(userId, disableData.token);

    await this.userRepo.update(
      userId,
      {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        // Note: In a real implementation, you'd need to clear backup codes
        // Since we don't have a settings field, we'll skip this for now
      },
      ""
    );
  }

  async getActiveSessions(userId: string): Promise<ActiveSession[]> {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceName: this.parseDeviceName(session.userAgent || ""),
      ipAddress: session.ipAddress || "Unknown",
      location: "Unknown", // Could integrate with IP geolocation service
      userAgent: session.userAgent || "",
      lastActive: session.createdAt.toISOString(),
      isCurrent: false, // Set based on current session
    }));
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundError("Session");
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async terminateAllSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId,
        ...(currentSessionId && { id: { not: currentSessionId } }),
      },
    });
  }

  // ==================== ORGANIZATION SETTINGS ====================

  async getOrganizationSettings(
    organizationId: string
  ): Promise<OrganizationSettings> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    const settings = (organization as any).settings || {};
    const documentNumbering = (organization as any).documentNumbering || {};

    const teamMembers: TeamMember[] = organization.users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles.map((ur) => ur.role.name),
      isActive: user.isActive,
      lastLogin: user.lastLoginAt?.toISOString() || null,
      invitedAt: null, // Could track invitation date
      joinedAt: user.createdAt.toISOString(),
    }));

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      website: organization.website,
      mcNumber: organization.mcNumber,
      dotNumber: organization.dotNumber,
      address: organization.address as any,
      billingEmail: organization.billingEmail,
      plan: organization.plan,
      planExpiresAt: organization.planExpiresAt?.toISOString() || null,
      documentNumbering: {
        loadNumberPrefix: documentNumbering.loadNumberPrefix || "LD",
        loadNumberStart: documentNumbering.loadNumberStart || 1000,
        invoiceNumberPrefix: documentNumbering.invoiceNumberPrefix || "INV",
        invoiceNumberStart: documentNumbering.invoiceNumberStart || 1000,
        autoIncrement: documentNumbering.autoIncrement !== false,
      },
      businessSettings: {
        timezone: settings.timezone || "America/New_York",
        currency: settings.currency || "USD",
        dateFormat: settings.dateFormat || "MM/DD/YYYY",
        fuelSurchargeRate: settings.fuelSurchargeRate || 0,
        defaultLoadMargin: settings.defaultLoadMargin || 15,
        requireApprovalForLoads: settings.requireApprovalForLoads || false,
        allowCarrierSelfDispatch: settings.allowCarrierSelfDispatch || false,
      },
      teamMembers,
    };
  }

  async updateOrganization(
    organizationId: string,
    updateData: UpdateOrganizationRequest
  ): Promise<OrganizationSettings> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    // Check for MC number uniqueness if being updated
    if (updateData.mcNumber) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          mcNumber: updateData.mcNumber,
          id: { not: organizationId },
        },
      });

      if (existingOrg) {
        throw new ConflictError("MC number already exists");
      }
    }

    const currentAddress = organization.address as any;

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.logo !== undefined && { logo: updateData.logo }),
        ...(updateData.website !== undefined && {
          website: updateData.website,
        }),
        ...(updateData.mcNumber && { mcNumber: updateData.mcNumber }),
        ...(updateData.dotNumber && { dotNumber: updateData.dotNumber }),
        ...(updateData.billingEmail !== undefined && {
          billingEmail: updateData.billingEmail,
        }),
        ...(updateData.address && {
          address: {
            ...currentAddress,
            ...updateData.address,
          },
        }),
      },
    });

    return this.getOrganizationSettings(organizationId);
  }

  async updateBusinessSettings(
    organizationId: string,
    updateData: UpdateBusinessSettingsRequest
  ): Promise<OrganizationSettings> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    const currentSettings = (organization as any).settings || {};

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          ...currentSettings,
          ...updateData,
        },
      },
    });

    return this.getOrganizationSettings(organizationId);
  }

  async updateDocumentNumbering(
    organizationId: string,
    updateData: UpdateDocumentNumberingRequest
  ): Promise<OrganizationSettings> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    const currentNumbering = (organization as any).documentNumbering || {};

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        documentNumbering: {
          ...currentNumbering,
          ...updateData,
        },
      },
    });

    return this.getOrganizationSettings(organizationId);
  }

  // ==================== TEAM MANAGEMENT ====================

  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    const users = await prisma.user.findMany({
      where: { organizationId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles.map((ur) => ur.role.name),
      isActive: user.isActive,
      lastLogin: user.lastLoginAt?.toISOString() || null,
      invitedAt: null, // Could track invitation date
      joinedAt: user.createdAt.toISOString(),
    }));
  }

  async inviteTeamMember(
    organizationId: string,
    _inviterId: string,
    inviteData: InviteTeamMemberRequest
  ): Promise<TeamMember> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: inviteData.email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Create user with temporary password (they'll need to set it via email verification)
    const tempPassword = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await hashPassword(tempPassword);

    // Create user using repository
    const user = await this.userRepo.create({
      email: inviteData.email,
      firstName: inviteData.firstName,
      lastName: inviteData.lastName,
      passwordHash: hashedPassword,
      organizationId,
      emailVerified: false, // They need to verify email and set password
    });

    // Assign roles
    if (inviteData.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: inviteData.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    // Assign customers
    if (inviteData.customerIds && inviteData.customerIds.length > 0) {
      await this.userRepo.assignCustomers(user.id, inviteData.customerIds);
    }

    // Send invitation email
    try {
      // Get inviter details
      const inviter = await this.userRepo.findById(_inviterId, organizationId);
      if (!inviter) {
        throw new NotFoundError("Inviter not found");
      }

      // Get organization details
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      });

      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      // Get role names
      const roles = await prisma.role.findMany({
        where: { id: { in: inviteData.roleIds } },
        select: { name: true },
      });

      // Generate invitation token (valid for 7 days)
      const invitationToken = generateAccessToken({
        sub: user.id,
        org: organizationId,
        email: inviteData.email,
        role: roles[0]?.name || "VIEWER",
        permissions: [], // Will be set when user accepts invitation
      });

      // Send invitation email
      await emailService.sendTeamInvitation(inviteData.email, {
        userName: `${inviteData.firstName} ${inviteData.lastName}`,
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        organizationName: organization.name,
        roles: roles.map((r) => r.name),
        invitationToken,
      });

      console.log(
        `Team invitation sent to ${inviteData.email} for organization ${organization.name}`
      );
    } catch (error) {
      console.error("Failed to send team invitation email:", error);
      // Don't throw error - user was created successfully, email failure shouldn't break the flow
    }

    // Get user with relations for response
    const userWithRelations = await this.userRepo.findByIdWithRelations(
      user.id,
      organizationId
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: userWithRelations?.roles.map((ur) => ur.role.name) || [],
      isActive: user.isActive,
      lastLogin: null,
      invitedAt: user.createdAt.toISOString(),
      joinedAt: null,
    };
  }

  async updateTeamMember(
    organizationId: string,
    memberId: string,
    updateData: UpdateTeamMemberRequest
  ): Promise<TeamMember> {
    // Check if user exists using repository
    const user = await this.userRepo.findById(memberId, organizationId);
    if (!user) {
      throw new NotFoundError("Team member");
    }

    // Update user basic info using repository
    await this.userRepo.update(
      memberId,
      {
        ...(updateData.firstName && { firstName: updateData.firstName }),
        ...(updateData.lastName && { lastName: updateData.lastName }),
        ...(updateData.isActive !== undefined && {
          isActive: updateData.isActive,
        }),
      },
      organizationId
    );

    // Update roles if provided
    if (updateData.roleIds) {
      // Get current roles before updating
      const currentRoles = await prisma.userRole.findMany({
        where: { userId: memberId },
        select: { roleId: true },
      });
      const oldRoleIds = currentRoles.map((ur) => ur.roleId);

      // Update roles
      await prisma.userRole.deleteMany({
        where: { userId: memberId },
      });

      await prisma.userRole.createMany({
        data: updateData.roleIds.map((roleId) => ({
          userId: memberId,
          roleId,
        })),
      });

      // Handle permission changes if roles changed
      if (
        JSON.stringify(oldRoleIds.sort()) !==
        JSON.stringify(updateData.roleIds.sort())
      ) {
        await permissionUpdateService.handleRoleChanges(
          memberId,
          organizationId,
          oldRoleIds,
          updateData.roleIds
        );
      }
    }

    // Fetch updated user with roles using repository
    const userWithRoles = await this.userRepo.findByIdWithRelations(
      memberId,
      organizationId
    );

    return {
      id: userWithRoles!.id,
      firstName: userWithRoles!.firstName,
      lastName: userWithRoles!.lastName,
      email: userWithRoles!.email,
      roles: userWithRoles!.roles.map((ur) => ur.role.name),
      isActive: userWithRoles!.isActive,
      lastLogin: userWithRoles!.lastLoginAt?.toISOString() || null,
      invitedAt: null,
      joinedAt: userWithRoles!.createdAt.toISOString(),
    };
  }

  async removeTeamMember(
    organizationId: string,
    memberId: string
  ): Promise<void> {
    // Check if user exists using repository
    const user = await this.userRepo.findById(memberId, organizationId);
    if (!user) {
      throw new NotFoundError("Team member");
    }

    // Soft delete by deactivating using repository
    await this.userRepo.update(memberId, { isActive: false }, organizationId);
  }

  async getMemberCustomers(
    organizationId: string,
    memberId: string
  ): Promise<UserCustomerWithCustomer["customer"][]> {
    // Check if member exists
    const member = await this.userRepo.findById(memberId, organizationId);
    if (!member) {
      throw new NotFoundError("Team member");
    }

    // Use repository method
    return await this.userRepo.getUserCustomers(memberId);
  }

  async assignCustomers(
    organizationId: string,
    memberId: string,
    customerIds: string[]
  ): Promise<void> {
    // Check if member exists
    const member = await this.userRepo.findById(memberId, organizationId);
    if (!member) {
      throw new NotFoundError("Team member");
    }

    // Verify all customers exist and belong to the organization
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        organizationId,
        deletedAt: null,
      },
    });

    if (customers.length !== customerIds.length) {
      throw new NotFoundError("One or more customers not found");
    }

    // Use repository method
    await this.userRepo.assignCustomers(memberId, customerIds);
  }

  async removeCustomerAssignment(
    organizationId: string,
    memberId: string,
    customerId: string
  ): Promise<void> {
    // Check if member exists
    const member = await this.userRepo.findById(memberId, organizationId);
    if (!member) {
      throw new NotFoundError("Team member");
    }

    // Use repository method
    await this.userRepo.removeCustomerAssignment(memberId, customerId);
  }

  // ==================== BILLING SETTINGS ====================

  async getBillingSettings(organizationId: string): Promise<BillingSettings> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    // This is a simplified implementation
    // In a real app, you'd integrate with a payment provider like Stripe
    return {
      plan: organization.plan,
      planDisplayName: this.getPlanDisplayName(organization.plan),
      planExpiresAt: organization.planExpiresAt?.toISOString() || null,
      billingCycle: "monthly",
      nextBillingDate: null,
      paymentMethods: [],
      billingHistory: [],
      usage: {
        loadsThisMonth: 0, // Would calculate from actual data
        loadsLimit: this.getPlanLimits(organization.plan).loads,
        usersCount: 0, // Would calculate from actual data
        usersLimit: this.getPlanLimits(organization.plan).users,
        storageUsed: 0,
        storageLimit: this.getPlanLimits(organization.plan).storage,
      },
    };
  }

  async getBillingHistory(_organizationId: string): Promise<unknown[]> {
    // This would integrate with your payment provider's API
    return [];
  }

  // ==================== HELPER METHODS ====================

  private parseDeviceName(userAgent: string): string {
    if (userAgent.includes("Chrome")) return "Chrome Browser";
    if (userAgent.includes("Firefox")) return "Firefox Browser";
    if (userAgent.includes("Safari")) return "Safari Browser";
    if (userAgent.includes("Edge")) return "Edge Browser";
    return "Unknown Device";
  }

  private getPlanDisplayName(plan: string): string {
    const planNames: Record<string, string> = {
      trial: "Free Trial",
      basic: "Basic Plan",
      professional: "Professional Plan",
      enterprise: "Enterprise Plan",
    };
    return planNames[plan] || plan;
  }

  private getPlanLimits(plan: string) {
    const limits: Record<
      string,
      { loads: number; users: number; storage: number }
    > = {
      trial: { loads: 10, users: 2, storage: 1024 },
      basic: { loads: 100, users: 5, storage: 5120 },
      professional: { loads: 500, users: 15, storage: 10240 },
      enterprise: { loads: -1, users: -1, storage: -1 },
    };
    return limits[plan] || limits.trial;
  }
}
