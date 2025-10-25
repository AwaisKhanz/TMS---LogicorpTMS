import { Router } from "express";
import { LoadController } from "../controllers/load.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";
import { z } from "zod";

const router: Router = Router();
const loadController = new LoadController();

// Validation schemas
const locationSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const accessorialSchema = z.object({
  type: z.string().min(1, "Type is required"),
  amount: z.number().min(0, "Amount must be positive"),
  description: z.string().min(1, "Description is required"),
});

const dimensionsSchema = z.object({
  length: z.number().min(0, "Length must be positive"),
  width: z.number().min(0, "Width must be positive"),
  height: z.number().min(0, "Height must be positive"),
});

export const createLoadSchema = z.object({
  customerId: z.string().cuid("Invalid customer ID"),
  carrierId: z.string().cuid("Invalid carrier ID").optional(),

  // Shipper information
  shipperName: z.string().min(1, "Shipper name is required"),
  shipperAddress: locationSchema,
  shipperPhone: z.string().min(1, "Shipper phone is required"),
  shipperEmail: z.string().email("Invalid shipper email").optional(),
  pickupDate: z.string().transform((str) => new Date(str)),
  pickupStart: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  pickupEnd: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),

  // Consignee information
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeAddress: locationSchema,
  consigneePhone: z.string().min(1, "Consignee phone is required"),
  consigneeEmail: z.string().email("Invalid consignee email").optional(),
  deliveryDate: z.string().transform((str) => new Date(str)),
  deliveryStart: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  deliveryEnd: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),

  // Load details
  commodity: z.string().min(1, "Commodity is required"),
  weight: z.number().min(1, "Weight must be greater than 0"),
  pieces: z.number().min(1, "Pieces must be greater than 0").optional(),
  dimensions: dimensionsSchema.optional(),
  equipmentType: z.enum([
    "DRY_VAN",
    "REEFER",
    "FLATBED",
    "STEP_DECK",
    "RGN",
    "POWER_ONLY",
    "HOTSHOT",
    "BOX_TRUCK",
    "STRAIGHT_TRUCK",
    "OTHER",
  ]),
  loadType: z.enum(["FULL_TRUCK", "LTL", "PARTIAL", "EXPEDITED"]).optional(),

  // Rates
  customerRate: z.number().min(0, "Customer rate must be positive"),
  carrierRate: z.number().min(0, "Carrier rate must be positive").optional(),

  // Additional costs
  accessorials: z.array(accessorialSchema).optional(),

  // Instructions
  pickupNotes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  internalNotes: z.string().optional(),

  // Reference
  referenceNumber: z.string().optional(),

  // Assignment
  assignedTo: z.string().cuid("Invalid user ID").optional(),
});

export const updateLoadSchema = createLoadSchema.partial();

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
