import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";
import { z } from "zod";

const router: Router = Router();
const settingsController = new SettingsController();

// Apply authentication, tenant validation, and email verification to all settings routes
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || val === "" || (val.length >= 10 && val.length <= 20),
      { message: "Phone must be between 10 and 20 characters" }
    ),
  avatar: z.string().url().nullable().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

// Notification settings schema removed - using simplified notification system

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const enableTwoFactorSchema = z.object({
  secret: z.string().min(1),
  token: z.string().length(6),
});

const disableTwoFactorSchema = z.object({
  token: z.string().length(6),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logo: z.string().url().nullable().optional(),
  website: z.string().url().nullable().optional(),
  mcNumber: z.string().min(1).max(20).optional(),
  dotNumber: z.string().min(1).max(20).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  billingEmail: z.string().email().nullable().optional(),
});

const updateBusinessSettingsSchema = z.object({
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
  dateFormat: z.string().optional(),
  fuelSurchargeRate: z.number().min(0).max(100).optional(),
  defaultLoadMargin: z.number().min(0).max(100).optional(),
  requireApprovalForLoads: z.boolean().optional(),
  allowCarrierSelfDispatch: z.boolean().optional(),
});

const updateDocumentNumberingSchema = z.object({
  loadNumberPrefix: z.string().max(10).optional(),
  loadNumberStart: z.number().min(1).optional(),
  invoiceNumberPrefix: z.string().max(10).optional(),
  invoiceNumberStart: z.number().min(1).optional(),
  autoIncrement: z.boolean().optional(),
});

const updateDocumentTermsSchema = z.object({
  bolTerms: z.string().optional(),
  rateConfirmationTerms: z.string().optional(),
  invoiceTerms: z.string().optional(),
});

const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  roleIds: z.array(z.string()).min(1),
  customerIds: z.array(z.string()).optional(),
});

const updateTeamMemberSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  roleIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// ==================== PROFILE SETTINGS ====================
router.get(
  "/profile",
  authorize(PERMISSIONS.SETTINGS_VIEW),
  settingsController.getProfile
);
router.put(
  "/profile",
  authorize(PERMISSIONS.SETTINGS_EDIT),
  validateRequest(updateProfileSchema),
  settingsController.updateProfile
);
router.patch(
  "/profile",
  authorize(PERMISSIONS.SETTINGS_EDIT),
  validateRequest(updateProfileSchema),
  settingsController.updateProfile
);

// ==================== SECURITY SETTINGS ====================
router.get(
  "/security",
  authorize(PERMISSIONS.SETTINGS_VIEW),
  settingsController.getSecuritySettings
);
router.post(
  "/security/change-password",
  authorize(PERMISSIONS.SETTINGS_EDIT),
  validateRequest(changePasswordSchema),
  settingsController.changePassword
);

// Two-Factor Authentication
router.post("/security/2fa/setup", settingsController.setupTwoFactor);
router.post(
  "/security/2fa/enable",
  validateRequest(enableTwoFactorSchema),
  settingsController.enableTwoFactor
);
router.post(
  "/security/2fa/disable",
  validateRequest(disableTwoFactorSchema),
  settingsController.disableTwoFactor
);

// Session Management
router.get("/security/sessions", settingsController.getActiveSessions);
router.delete(
  "/security/sessions/:sessionId",
  settingsController.terminateSession
);
router.delete("/security/sessions", settingsController.terminateAllSessions);

// ==================== ORGANIZATION SETTINGS ====================
router.get(
  "/organization",
  authorize(PERMISSIONS.SETTINGS_VIEW),
  settingsController.getOrganizationSettings
);
router.put(
  "/organization",
  authorize(PERMISSIONS.SETTINGS_EDIT),
  validateRequest(updateOrganizationSchema),
  settingsController.updateOrganization
);
router.put(
  "/organization/business",
  authorize(PERMISSIONS.SETTINGS_EDIT),
  validateRequest(updateBusinessSettingsSchema),
  settingsController.updateBusinessSettings
);
router.put(
  "/organization/document-numbering",
  authorize(PERMISSIONS.SETTINGS_EDIT),
  validateRequest(updateDocumentNumberingSchema),
  settingsController.updateDocumentNumbering
);
router.put(
  "/organization/document-terms",
  authorize(PERMISSIONS.SETTINGS_EDIT),
  validateRequest(updateDocumentTermsSchema),
  settingsController.updateDocumentTerms
);

// ==================== TEAM MANAGEMENT ====================
router.get(
  "/team",
  authorize(PERMISSIONS.USER_VIEW),
  settingsController.getTeamMembers
);
router.post(
  "/team/invite",
  authorize(PERMISSIONS.USER_CREATE),
  validateRequest(inviteTeamMemberSchema),
  settingsController.inviteTeamMember
);
router.put(
  "/team/:memberId",
  authorize(PERMISSIONS.USER_EDIT),
  validateRequest(updateTeamMemberSchema),
  settingsController.updateTeamMember
);
router.delete(
  "/team/:memberId",
  authorize(PERMISSIONS.USER_DELETE),
  settingsController.removeTeamMember
);

// Customer assignment routes
router.get(
  "/team/:memberId/customers",
  authorize(PERMISSIONS.USER_VIEW),
  settingsController.getMemberCustomers
);
router.post(
  "/team/:memberId/customers",
  authorize(PERMISSIONS.USER_EDIT),
  settingsController.assignCustomers
);
router.delete(
  "/team/:memberId/customers/:customerId",
  authorize(PERMISSIONS.USER_EDIT),
  settingsController.removeCustomerAssignment
);

// ==================== BILLING SETTINGS ====================
router.get("/billing", settingsController.getBillingSettings);
router.get("/billing/history", settingsController.getBillingHistory);

export default router;
