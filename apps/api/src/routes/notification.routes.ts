import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

const router: Router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// ==================== NOTIFICATION ROUTES ====================

// GET /api/notifications - Get notifications for current user
router.get("/", (req, res, next) =>
  notificationController.getNotifications(
    req as AuthenticatedRequest,
    res,
    next
  )
);

// POST /api/notifications - Create new notification
router.post("/", (req, res, next) =>
  notificationController.createNotification(
    req as AuthenticatedRequest,
    res,
    next
  )
);

// GET /api/notifications/unread-count - Get unread count (MUST be before /:id)
router.get("/unread-count", (req, res, next) =>
  notificationController.getUnreadCount(req as AuthenticatedRequest, res, next)
);

// PATCH /api/notifications/read-all - Mark all notifications as read (MUST be before /:id)
router.patch("/read-all", (req, res, next) =>
  notificationController.markAllAsRead(req as AuthenticatedRequest, res, next)
);

// GET /api/notifications/:id - Get specific notification
router.get("/:id", (req, res, next) =>
  notificationController.getNotification(req as AuthenticatedRequest, res, next)
);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", (req, res, next) =>
  notificationController.markAsRead(req as AuthenticatedRequest, res, next)
);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", (req, res, next) =>
  notificationController.deleteNotification(
    req as AuthenticatedRequest,
    res,
    next
  )
);

export default router;
