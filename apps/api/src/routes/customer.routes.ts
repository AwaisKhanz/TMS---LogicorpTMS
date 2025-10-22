import { Router } from "express";
import { z } from "zod";
import { CustomerController } from "../controllers/customer.controller.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";

const router = Router();
const customerController = new CustomerController();

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

const createCustomerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  dba: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  ein: z.string().optional(),
  billingAddress: addressSchema,
  billingEmail: z.string().email("Valid billing email is required"),
  billingPhone: z.string().min(1, "Billing phone is required"),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  preferredCarriers: z.array(z.any()).optional(),
  equipmentTypes: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateCustomerSchema = z.object({
  companyName: z.string().optional(),
  dba: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  ein: z.string().optional(),
  billingAddress: addressSchema.optional(),
  billingEmail: z.string().email().optional(),
  billingPhone: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  preferredCarriers: z.array(z.any()).optional(),
  equipmentTypes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

const customerContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  isPrimary: z.boolean().optional(),
});

// Routes
router.get(
  "/",
  authorize(PERMISSIONS.CUSTOMER_VIEW),
  customerController.getCustomers
);
router.get(
  "/statistics",
  authorize(PERMISSIONS.CUSTOMER_VIEW),
  customerController.getCustomerStatistics
);
router.get(
  "/top",
  authorize(PERMISSIONS.CUSTOMER_VIEW),
  customerController.getTopCustomers
);
router.get(
  "/:id",
  authorize(PERMISSIONS.CUSTOMER_VIEW),
  customerController.getCustomerById
);
router.post(
  "/",
  authorize(PERMISSIONS.CUSTOMER_CREATE),
  validateRequest({ body: createCustomerSchema }),
  customerController.createCustomer
);
router.put(
  "/:id",
  authorize(PERMISSIONS.CUSTOMER_EDIT),
  validateRequest({ body: updateCustomerSchema }),
  customerController.updateCustomer
);
router.delete(
  "/:id",
  authorize(PERMISSIONS.CUSTOMER_DELETE),
  customerController.deleteCustomer
);

// Contact management
router.post(
  "/:id/contacts",
  authorize(PERMISSIONS.CUSTOMER_EDIT),
  validateRequest({ body: customerContactSchema }),
  customerController.addCustomerContact
);
router.put(
  "/contacts/:contactId",
  authorize(PERMISSIONS.CUSTOMER_EDIT),
  validateRequest({ body: customerContactSchema }),
  customerController.updateCustomerContact
);
router.delete(
  "/contacts/:contactId",
  authorize(PERMISSIONS.CUSTOMER_EDIT),
  customerController.deleteCustomerContact
);

export default router;
