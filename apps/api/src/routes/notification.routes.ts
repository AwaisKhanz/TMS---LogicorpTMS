import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";
import type { AuthenticatedRequest } from "../types/auth.types.js";

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// ==================== NOTIFICATION ROUTES ====================

// GET /api/notifications - Get notifications for current user
router.get("/", authorize(PERMISSIONS.NOTIFICATIONS_READ), (req, res, next) =>
  notificationController.getNotifications(
    req as AuthenticatedRequest,
    res,
    next
  )
);

// POST /api/notifications - Create new notification
router.post(
  "/",
  authorize(PERMISSIONS.NOTIFICATIONS_CREATE),
  (req, res, next) =>
    notificationController.createNotification(
      req as AuthenticatedRequest,
      res,
      next
    )
);

// GET /api/notifications/:id - Get specific notification
router.get(
  "/:id",
  authorize(PERMISSIONS.NOTIFICATIONS_READ),
  (req, res, next) =>
    notificationController.getNotification(
      req as AuthenticatedRequest,
      res,
      next
    )
);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch(
  "/:id/read",
  authorize(PERMISSIONS.NOTIFICATIONS_UPDATE),
  (req, res, next) =>
    notificationController.markAsRead(req as AuthenticatedRequest, res, next)
);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch(
  "/read-all",
  authorize(PERMISSIONS.NOTIFICATIONS_UPDATE),
  (req, res, next) =>
    notificationController.markAllAsRead(req as AuthenticatedRequest, res, next)
);

// GET /api/notifications/unread-count - Get unread count
router.get(
  "/unread-count",
  authorize(PERMISSIONS.NOTIFICATIONS_READ),
  (req, res, next) =>
    notificationController.getUnreadCount(
      req as AuthenticatedRequest,
      res,
      next
    )
);

// DELETE /api/notifications/:id - Delete notification
router.delete(
  "/:id",
  authorize(PERMISSIONS.NOTIFICATIONS_DELETE),
  (req, res, next) =>
    notificationController.deleteNotification(
      req as AuthenticatedRequest,
      res,
      next
    )
);

export default router;
