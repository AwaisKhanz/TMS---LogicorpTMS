import type {
  Notification,
  NotificationType,
  EntityType,
} from "@tms/shared-types";
import { PrismaClient } from "@prisma/client";
import { webSocketService } from "./websocket.service.js";
import { smtpService } from "./smtp.service.js";
import { logger } from "../config/logger.js";

const prisma = new PrismaClient();

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
  sendEmail?: boolean;
  organizationId: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export class NotificationService {
  /**
   * Create a new notification (IN_APP always, optional email)
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    try {
      // Handle "all" recipientId by sending to all users in organization
      if (input.recipientId === "all") {
        return await this.createForAllUsers(input);
      }

      // 1. Create in-app notification
      const notification = await prisma.notification.create({
        data: {
          organizationId: input.organizationId,
          recipientId: input.recipientId,
          type: input.type,
          title: input.title,
          message: input.message,
          entityType: input.entityType,
          entityId: input.entityId,
        },
      });

      // 2. Send via WebSocket for real-time delivery
      webSocketService.sendNotificationToUser(input.recipientId, notification);

      // 3. Optionally send email
      if (input.sendEmail) {
        try {
          // Get recipient email
          const user = await prisma.user.findUnique({
            where: { id: input.recipientId },
            select: { email: true, firstName: true, lastName: true },
          });

          if (user?.email) {
            await smtpService.sendEmail(
              user.email,
              input.title,
              input.message,
              input.message
            );
            logger.info(`Email sent for notification ${notification.id}`);
          }
        } catch (error) {
          logger.error(
            `Failed to send email for notification ${notification.id}:`,
            error
          );
          // Don't fail the notification creation if email fails
        }
      }

      logger.info(`Notification created: ${notification.id}`);
      return notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for all users in an organization
   */
  private async createForAllUsers(
    input: CreateNotificationInput
  ): Promise<Notification> {
    try {
      // Get all users in the organization
      const users = await prisma.user.findMany({
        where: { organizationId: input.organizationId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (users.length === 0) {
        throw new Error("No users found in organization");
      }

      // Create notifications for all users
      const notifications = await Promise.all(
        users.map((user) =>
          prisma.notification.create({
            data: {
              organizationId: input.organizationId,
              recipientId: user.id,
              type: input.type,
              title: input.title,
              message: input.message,
              entityType: input.entityType,
              entityId: input.entityId,
            },
          })
        )
      );

      // Send WebSocket notification to organization
      webSocketService.sendNotificationToOrganization(
        input.organizationId,
        notifications[0] // Use first notification as template
      );

      // Optionally send emails to all users
      if (input.sendEmail) {
        await Promise.all(
          users.map(async (user) => {
            if (user.email) {
              try {
                await smtpService.sendEmail(
                  user.email,
                  input.title,
                  input.message,
                  input.message
                );
                logger.info(`Email sent to ${user.email} for notification`);
              } catch (error) {
                logger.error(`Failed to send email to ${user.email}:`, error);
              }
            }
          })
        );
      }

      logger.info(
        `Notifications created for ${users.length} users in organization ${input.organizationId}`
      );
      return notifications[0]; // Return first notification as representative
    } catch (error) {
      logger.error("Error creating notifications for all users:", error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getByUser(
    userId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<NotificationListResponse> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          recipientId: userId,
          organizationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          recipientId: userId,
          organizationId,
        },
      }),
    ]);

    return {
      notifications,
      total,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error(
        `Error marking notification ${notificationId} as read:`,
        error
      );
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, organizationId: string): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          organizationId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info(
        `Marked ${result.count} notifications as read for user ${userId}`
      );
      return result.count;
    } catch (error) {
      logger.error(
        `Error marking all notifications as read for user ${userId}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(
    userId: string,
    organizationId: string
  ): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          recipientId: userId,
          organizationId,
          isRead: false,
        },
      });
    } catch (error) {
      logger.error(`Error getting unread count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          recipientId: userId,
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error(`Error deleting notification ${notificationId}:`, error);
      return false;
    }
  }

  /**
   * Get notification by ID
   */
  async getById(
    notificationId: string,
    userId: string
  ): Promise<Notification | null> {
    try {
      return await prisma.notification.findFirst({
        where: {
          id: notificationId,
          recipientId: userId,
        },
      });
    } catch (error) {
      logger.error(`Error getting notification ${notificationId}:`, error);
      return null;
    }
  }

  // Legacy method for backward compatibility
  async createNotification(
    input: CreateNotificationInput
  ): Promise<Notification> {
    return this.create(input);
  }

  async getNotifications(
    organizationId: string,
    userId?: string,
    page: number = 1,
    limit: number = 50
  ) {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return this.getByUser(userId, organizationId, page, limit);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
