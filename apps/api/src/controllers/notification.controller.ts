import { Response, NextFunction } from "express";
import { z } from "zod";
import { NotificationService } from "../services/notification.service.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

const notificationService = new NotificationService();

// Validation schemas
const createNotificationSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  type: z.enum([
    "LOAD_STATUS_CHANGE",
    "LOAD_ASSIGNED",
    "DOCUMENT_GENERATED",
    "INVOICE_CREATED",
    "PAYMENT_RECEIVED",
    "CARRIER_APPROVED",
    "CARRIER_SUSPENDED",
    "CUSTOMER_CREATED",
    "CUSTOMER_UPDATED",
    "SYSTEM_ALERT",
  ]),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  message: z.string().min(1, "Message is required"),
  entityType: z
    .enum([
      "LOAD",
      "CARRIER",
      "CUSTOMER",
      "DOCUMENT",
      "INVOICE",
      "PAYMENT",
      "USER",
      "ORGANIZATION",
    ])
    .optional(),
  entityId: z.string().optional(),
  sendEmail: z.boolean().optional().default(false),
});

const notificationFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export class NotificationController {
  // Get notifications for the current user
  async getNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { organizationId, userId } = req.auth!;
      const filters = notificationFiltersSchema.parse(req.query);

      const result = await notificationService.getByUser(
        userId,
        organizationId,
        filters.page,
        filters.limit
      );

      res.json({
        success: true,
        data: result,
        meta: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Create a new notification
  async createNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { organizationId } = req.auth!;
      const data = createNotificationSchema.parse(req.body);

      const notification = await notificationService.create({
        ...data,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a specific notification
  async getNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.auth!;
      const { id } = req.params;

      const notification = await notificationService.getById(id, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Notification not found",
          },
        });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark notification as read
  async markAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.auth!;
      const { id } = req.params;

      const success = await notificationService.markAsRead(id, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Notification not found",
          },
        });
      }

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { organizationId, userId } = req.auth!;

      const count = await notificationService.markAllAsRead(
        userId,
        organizationId
      );

      res.json({
        success: true,
        data: { count },
        message: `Marked ${count} notifications as read`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get unread count
  async getUnreadCount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { organizationId, userId } = req.auth!;

      const count = await notificationService.getUnreadCount(
        userId,
        organizationId
      );

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a notification
  async deleteNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.auth!;
      const { id } = req.params;

      const success = await notificationService.delete(id, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Notification not found",
          },
        });
      }

      res.json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
