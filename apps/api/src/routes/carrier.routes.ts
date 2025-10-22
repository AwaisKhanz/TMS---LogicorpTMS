import { Router } from "express";
import { z } from "zod";
import { CarrierController } from "../controllers/carrier.controller.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";

const router = Router();
const carrierController = new CarrierController();

// Apply authentication, tenant validation, and email verification to all routes
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// Validation schemas
const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().optional(),
});

const createCarrierSchema = z.object({
  mcNumber: z.string().min(1, "MC Number is required"),
  dotNumber: z.string().optional(),
  scac: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  dba: z.string().optional(),
  ein: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  fax: z.string().optional(),
  address: addressSchema,
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.string().email("Valid contact email is required"),
  authorityStatus: z.string().optional(),
  insuranceExpiry: z.string().datetime().optional(),
  insuranceAmount: z.number().min(0).optional(),
  cargoInsurance: z.number().min(0).optional(),
  liabilityInsurance: z.number().min(0).optional(),
  safetyRating: z.string().optional(),
  csa: z.any().optional(),
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  w9OnFile: z.boolean().optional(),
  factoring: z.boolean().optional(),
  factoringCompany: z.string().optional(),
  preferredLanes: z.array(z.any()).optional(),
  equipment: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateCarrierSchema = z.object({
  mcNumber: z.string().optional(),
  dotNumber: z.string().optional(),
  scac: z.string().optional(),
  companyName: z.string().optional(),
  dba: z.string().optional(),
  ein: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  address: addressSchema.optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  authorityStatus: z.string().optional(),
  insuranceExpiry: z.string().datetime().optional(),
  insuranceAmount: z.number().min(0).optional(),
  cargoInsurance: z.number().min(0).optional(),
  liabilityInsurance: z.number().min(0).optional(),
  safetyRating: z.string().optional(),
  csa: z.any().optional(),
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  w9OnFile: z.boolean().optional(),
  factoring: z.boolean().optional(),
  factoringCompany: z.string().optional(),
  preferredLanes: z.array(z.any()).optional(),
  equipment: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

// Validation schemas for contacts
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  title: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const updateContactSchema = contactSchema.partial();

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  loadId: z.string().optional(),
});

// Routes
router.get(
  "/",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getCarriers
);
router.get(
  "/statistics",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getCarrierStatistics
);
router.get(
  "/insurance-alerts",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getInsuranceAlerts
);
router.get(
  "/export",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.exportCarriers
);
router.get(
  "/search/lane",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.searchCarriersByLane
);
router.post(
  "/verify-fmcsa",
  authorize(PERMISSIONS.CARRIER_CREATE),
  carrierController.verifyFMCSA
);
router.post(
  "/bulk-approve",
  authorize(PERMISSIONS.CARRIER_EDIT),
  carrierController.bulkApprove
);
router.post(
  "/bulk-delete",
  authorize(PERMISSIONS.CARRIER_DELETE),
  carrierController.bulkDelete
);
router.get(
  "/:id",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getCarrierById
);
router.get(
  "/:id/contacts",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getCarrierContacts
);
router.get(
  "/:id/documents",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getCarrierDocuments
);
router.get(
  "/:id/performance",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getCarrierPerformance
);
router.get(
  "/:id/loads",
  authorize(PERMISSIONS.CARRIER_VIEW),
  carrierController.getCarrierLoads
);
router.post(
  "/",
  authorize(PERMISSIONS.CARRIER_CREATE),
  validateRequest({ body: createCarrierSchema }),
  carrierController.createCarrier
);
router.post(
  "/:id/contacts",
  authorize(PERMISSIONS.CARRIER_EDIT),
  validateRequest({ body: contactSchema }),
  carrierController.addCarrierContact
);
router.post(
  "/:id/rating",
  authorize(PERMISSIONS.CARRIER_EDIT),
  validateRequest({ body: ratingSchema }),
  carrierController.submitRating
);
router.put(
  "/:id",
  authorize(PERMISSIONS.CARRIER_EDIT),
  validateRequest({ body: updateCarrierSchema }),
  carrierController.updateCarrier
);
router.put(
  "/:id/contacts/:contactId",
  authorize(PERMISSIONS.CARRIER_EDIT),
  validateRequest({ body: updateContactSchema }),
  carrierController.updateCarrierContact
);
router.delete(
  "/:id",
  authorize(PERMISSIONS.CARRIER_DELETE),
  carrierController.deleteCarrier
);
router.delete(
  "/:id/contacts/:contactId",
  authorize(PERMISSIONS.CARRIER_EDIT),
  carrierController.deleteCarrierContact
);
router.patch(
  "/:id/approve",
  authorize(PERMISSIONS.CARRIER_EDIT),
  carrierController.approveCarrier
);

export default router;
