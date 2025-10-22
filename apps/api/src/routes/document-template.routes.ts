import { Router } from "express";
import {
  DocumentTemplateController,
  createDocumentTemplateSchema,
  updateDocumentTemplateSchema,
} from "../controllers/document-template.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";

const router = Router();
const documentTemplateController = new DocumentTemplateController();

// All template routes require authentication, tenant validation, and email verification
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// Routes
router.get("/", documentTemplateController.getTemplates);
router.get("/default/:type", documentTemplateController.getDefaultTemplate);
router.get("/:id", documentTemplateController.getTemplate);
router.post(
  "/",
  validateRequest(createDocumentTemplateSchema),
  documentTemplateController.createTemplate
);
router.put(
  "/:id",
  validateRequest(updateDocumentTemplateSchema),
  documentTemplateController.updateTemplate
);
router.delete("/:id", documentTemplateController.deleteTemplate);
router.post("/:id/set-default", documentTemplateController.setDefaultTemplate);

export default router;