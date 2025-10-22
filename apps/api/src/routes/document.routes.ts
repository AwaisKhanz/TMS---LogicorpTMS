import { Router } from "express";
import multer from "multer";
import {
  DocumentController,
  uploadDocumentSchema,
} from "../controllers/document.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";

const router = Router();
const documentController = new DocumentController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        "Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX are allowed."
      );
      cb(error);
    }
  },
});

// All document routes require authentication, tenant validation, and email verification
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// Routes
router.get("/", documentController.getDocuments);
router.post(
  "/upload",
  upload.single("file"),
  validateRequest(uploadDocumentSchema),
  documentController.uploadDocument
);
router.post("/generate", documentController.generateDocument);
router.get("/:entityType/:entityId", documentController.getEntityDocuments);
router.get("/:id", documentController.getDocument);
router.get("/:id/download", documentController.downloadDocument);
router.delete("/:id", documentController.deleteDocument);

// Load-specific document generation routes
router.post(
  "/loads/:loadId/rate-confirmation",
  documentController.generateRateConfirmation
);
router.post("/loads/:loadId/bol", documentController.generateBOL);

// Document expiration management routes
router.get("/expiring", documentController.getExpiringDocuments);
router.post("/cleanup-expired", documentController.cleanupExpiredDocuments);
router.post(
  "/send-expiration-notifications",
  documentController.sendExpirationNotifications
);

export default router;
