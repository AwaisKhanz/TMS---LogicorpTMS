import { Router } from "express";
import {
  LoadController,
  createLoadSchema,
  updateLoadSchema,
} from "../controllers/load.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";
import { z } from "zod";

const router: Router = Router();
const loadController = new LoadController();

// Validation schemas are imported from the controller

export const updateStatusSchema = z.object({
  status: z.enum([
    "QUOTE",
    "BOOKED",
    "DISPATCHED",
    "IN_TRANSIT",
    "DELIVERED",
    "POD_RECEIVED",
    "COMPLETED",
    "PAID",
    "CANCELLED",
  ]),
});

// All load routes require authentication, tenant validation, and email verification
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// Routes
router.get(
  "/",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.getLoads
);
router.get(
  "/completed",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.getCompletedLoads
);
router.get(
  "/statistics",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.getLoadStatistics
);
router.get(
  "/dashboard-stats",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.getDashboardStats
);
router.get(
  "/export",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.exportLoads
);
router.get(
  "/:id",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.getLoadById
);
router.get(
  "/:id/events",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.getLoadEvents
);
router.get(
  "/:id/documents",
  authorize(PERMISSIONS.LOAD_VIEW_ALL, PERMISSIONS.LOAD_VIEW_OWN),
  loadController.getLoadDocuments
);
router.post(
  "/",
  authorize(PERMISSIONS.LOAD_CREATE),
  validateRequest(createLoadSchema),
  loadController.createLoad
);
router.post(
  "/bulk-delete",
  authorize(PERMISSIONS.LOAD_DELETE),
  loadController.bulkDelete
);
router.post(
  "/bulk-status",
  authorize(PERMISSIONS.LOAD_EDIT),
  loadController.bulkUpdateStatus
);
router.post(
  "/:id/duplicate",
  authorize(PERMISSIONS.LOAD_CREATE),
  loadController.duplicateLoad
);
router.post(
  "/:id/assign",
  authorize(PERMISSIONS.LOAD_EDIT),
  loadController.assignCarrier
);
router.put(
  "/:id",
  authorize(PERMISSIONS.LOAD_EDIT),
  validateRequest(updateLoadSchema),
  loadController.updateLoad
);
router.put(
  "/:id/status",
  authorize(PERMISSIONS.LOAD_EDIT),
  loadController.updateLoadStatus
);
router.patch(
  "/:id/status",
  authorize(PERMISSIONS.LOAD_EDIT),
  validateRequest(updateStatusSchema),
  loadController.updateLoadStatus
);
router.delete(
  "/:id",
  authorize(PERMISSIONS.LOAD_DELETE),
  loadController.deleteLoad
);

export default router;
