import { PrismaClient } from "@prisma/client";
import { emailService } from "./email.service.js";
import { notificationService } from "./notification.service.js";
import { logger } from "../config/logger.js";

const prisma = new PrismaClient();

export class PermissionUpdateService {
  /**
   * Invalidates all active sessions for a user when their permissions change
   * This forces them to get a new token with updated permissions
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    try {
      // Delete all active sessions for the user
      await prisma.session.deleteMany({
        where: {
          userId,
        },
      });

      logger.info(
        `Invalidated sessions for user ${userId} due to permission changes`
      );
    } catch (error) {
      logger.error(`Failed to invalidate sessions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Notifies user about permission changes via email and in-app notification
   */
  async notifyPermissionChanges(
    userId: string,
    organizationId: string,
    changes: {
      addedPermissions: string[];
      removedPermissions: string[];
      roleChanges: string[];
    }
  ): Promise<void> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organization: true,
        },
      });

      if (!user) {
        logger.warn(
          `User ${userId} not found for permission change notification`
        );
        return;
      }

      // Send email notification
      if (
        changes.addedPermissions.length > 0 ||
        changes.removedPermissions.length > 0
      ) {
        await emailService.sendPermissionChangeNotification(
          user.email,
          user.firstName,
          user.organization.name,
          changes
        );
      }

      // Create in-app notification
      await notificationService.createNotification({
        recipientId: userId,
        organizationId,
        type: "SYSTEM_ALERT",
        title: "Your permissions have been updated",
        message: this.formatPermissionChangeMessage(changes),
        entityType: "ORGANIZATION",
        entityId: organizationId,
        sendEmail: false,
      });

      logger.info(`Sent permission change notifications to user ${userId}`);
    } catch (error) {
      logger.error(
        `Failed to notify user ${userId} about permission changes:`,
        error
      );
    }
  }

  /**
   * Handles role assignment changes for a user
   */
  async handleRoleChanges(
    userId: string,
    organizationId: string,
    oldRoleIds: string[],
    newRoleIds: string[]
  ): Promise<void> {
    try {
      // Get old and new permissions
      const [oldPermissions, newPermissions] = await Promise.all([
        this.getUserPermissions(oldRoleIds),
        this.getUserPermissions(newRoleIds),
      ]);

      // Calculate permission changes
      const addedPermissions = newPermissions.filter(
        (p) => !oldPermissions.includes(p)
      );
      const removedPermissions = oldPermissions.filter(
        (p) => !newPermissions.includes(p)
      );

      // Get role names for notification
      const [oldRoles, newRoles] = await Promise.all([
        this.getRoleNames(oldRoleIds),
        this.getRoleNames(newRoleIds),
      ]);

      // Invalidate user sessions to force token refresh
      await this.invalidateUserSessions(userId);

      // Notify user about changes
      if (
        addedPermissions.length > 0 ||
        removedPermissions.length > 0 ||
        oldRoles.length > 0 ||
        newRoles.length > 0
      ) {
        await this.notifyPermissionChanges(userId, organizationId, {
          addedPermissions,
          removedPermissions,
          roleChanges: [...oldRoles, ...newRoles],
        });
      }

      logger.info(
        `Handled role changes for user ${userId}: ${addedPermissions.length} added, ${removedPermissions.length} removed`
      );
    } catch (error) {
      logger.error(`Failed to handle role changes for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handles bulk role changes for multiple users
   */
  async handleBulkRoleChanges(
    userIds: string[],
    organizationId: string,
    roleChanges: Array<{
      userId: string;
      oldRoleIds: string[];
      newRoleIds: string[];
    }>
  ): Promise<void> {
    try {
      const promises = roleChanges.map((change) =>
        this.handleRoleChanges(
          change.userId,
          organizationId,
          change.oldRoleIds,
          change.newRoleIds
        )
      );

      await Promise.all(promises);
      logger.info(`Handled bulk role changes for ${userIds.length} users`);
    } catch (error) {
      logger.error(`Failed to handle bulk role changes:`, error);
      throw error;
    }
  }

  /**
   * Gets all permissions for given role IDs
   */
  private async getUserPermissions(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];

    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      include: { permissions: true },
    });

    const permissions = new Set<string>();
    roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        permissions.add(permission.name);
      });
    });

    return Array.from(permissions);
  }

  /**
   * Gets role names for given role IDs
   */
  private async getRoleNames(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];

    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { name: true },
    });

    return roles.map((role) => role.name);
  }

  /**
   * Formats permission change message for notifications
   */
  private formatPermissionChangeMessage(changes: {
    addedPermissions: string[];
    removedPermissions: string[];
    roleChanges: string[];
  }): string {
    let message = "Your account permissions have been updated:\n\n";

    if (changes.addedPermissions.length > 0) {
      message += `✅ New permissions: ${changes.addedPermissions.join(", ")}\n`;
    }

    if (changes.removedPermissions.length > 0) {
      message += `❌ Removed permissions: ${changes.removedPermissions.join(", ")}\n`;
    }

    if (changes.roleChanges.length > 0) {
      message += `🔄 Role changes: ${changes.roleChanges.join(" → ")}\n`;
    }

    message +=
      "\nYou may need to refresh the page to see the updated permissions.";
    return message;
  }
}

export const permissionUpdateService = new PermissionUpdateService();
