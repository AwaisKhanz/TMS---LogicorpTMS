import { Router } from "express";
import busboy from "busboy";
import {
  DocumentController,
  uploadDocumentSchema,
} from "../controllers/document.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";

const router: Router = Router();
const documentController = new DocumentController();

// Busboy middleware for file uploads
const uploadMiddleware = (req: any, _res: any, next: any) => {
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const bb = busboy({
    headers: req.headers,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  const fields: Record<string, string> = {};
  const files: Array<{
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }> = [];

  bb.on("field", (fieldname: string, val: string) => {
    fields[fieldname] = val;
  });

  bb.on(
    "file",
    (
      fieldname: string,
      file: any,
      filename: string,
      encoding: string,
      mimetype: string
    ) => {
      console.log("File upload debug:", { filename, mimetype, allowedMimes });

      const chunks: Buffer[] = [];
      file.on("data", (data: Buffer) => {
        chunks.push(data);
      });

      file.on("end", () => {
        const buffer = Buffer.concat(chunks);

        // Enhanced MIME type detection
        let detectedMimeType = mimetype;

        // Handle filename - it might be an object or string
        let actualFilename: string;
        if (typeof filename === "string") {
          actualFilename = filename;
        } else if (filename && typeof filename === "object") {
          actualFilename =
            (filename as any).filename || (filename as any).originalname || "";
          // Check if filename object has a mimeType property
          if (
            (filename as any).mimeType &&
            allowedMimes.includes((filename as any).mimeType)
          ) {
            detectedMimeType = (filename as any).mimeType;
          }
        } else {
          actualFilename = "";
        }

        // If MIME type is undefined or not in allowed list, try to detect it
        if (!detectedMimeType || !allowedMimes.includes(detectedMimeType)) {
          // Try to detect MIME type from file extension
          const extension = actualFilename.toLowerCase().split(".").pop();
          const extensionMimeMap: Record<string, string> = {
            pdf: "application/pdf",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          };

          if (extension && extensionMimeMap[extension]) {
            detectedMimeType = extensionMimeMap[extension];
          }

          // Try to detect from magic bytes (file signature)
          if (!detectedMimeType || !allowedMimes.includes(detectedMimeType)) {
            const magicBytes = buffer.slice(0, 10);

            // PDF magic bytes: %PDF
            if (magicBytes.toString("ascii", 0, 4) === "%PDF") {
              detectedMimeType = "application/pdf";
            }
            // JPEG magic bytes: FF D8 FF
            else if (
              magicBytes[0] === 0xff &&
              magicBytes[1] === 0xd8 &&
              magicBytes[2] === 0xff
            ) {
              detectedMimeType = "image/jpeg";
            }
            // PNG magic bytes: 89 50 4E 47
            else if (
              magicBytes[0] === 0x89 &&
              magicBytes[1] === 0x50 &&
              magicBytes[2] === 0x4e &&
              magicBytes[3] === 0x47
            ) {
              detectedMimeType = "image/png";
            }
            // DOC magic bytes: D0 CF 11 E0 (OLE2 format)
            else if (
              magicBytes[0] === 0xd0 &&
              magicBytes[1] === 0xcf &&
              magicBytes[2] === 0x11 &&
              magicBytes[3] === 0xe0
            ) {
              detectedMimeType = "application/msword";
            }
            // DOCX magic bytes: 50 4B (ZIP format)
            else if (magicBytes[0] === 0x50 && magicBytes[1] === 0x4b) {
              detectedMimeType =
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }
          }
        }

        console.log("Enhanced MIME type detection:", {
          original: mimetype,
          detected: detectedMimeType,
          filename: actualFilename,
          allowedMimes,
        });

        if (!allowedMimes.includes(detectedMimeType)) {
          return next(
            new Error(
              `Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX are allowed. Detected: ${detectedMimeType || "unknown"}`
            )
          );
        }

        files.push({
          fieldname,
          originalname: actualFilename,
          encoding,
          mimetype: detectedMimeType,
          buffer,
          size: buffer.length,
        });
      });
    }
  );

  bb.on("finish", () => {
    req.body = fields;
    req.files = files;
    next();
  });

  bb.on("error", (err: Error) => {
    next(err);
  });

  req.pipe(bb);
};

// All document routes require authentication, tenant validation, and email verification
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// Routes
router.get("/", documentController.getDocuments);
router.post(
  "/upload",
  uploadMiddleware,
  validateRequest(uploadDocumentSchema),
  documentController.uploadDocument
);
router.post("/generate", documentController.generateDocument);
// Specific routes must come before generic parameterized routes
router.get("/:id/download", documentController.downloadDocument);
router.get("/:id", documentController.getDocument);
router.delete("/:id", documentController.deleteDocument);
router.get("/:entityType/:entityId", documentController.getEntityDocuments);

// Load-specific document generation routes
router.post(
  "/loads/:loadId/rate-confirmation",
  documentController.generateRateConfirmation
);
router.post("/loads/:loadId/bol", documentController.generateBOL);
router.post("/loads/:loadId/invoice", documentController.generateInvoice);
router.post("/loads/:loadId/pod", documentController.generatePOD);

// Document delivery routes
router.post("/:id/send", documentController.sendDocument);
router.post("/send-multiple", documentController.sendMultipleDocuments);

// Load-specific document delivery routes
router.post(
  "/loads/:loadId/send-rate-confirmation",
  documentController.sendRateConfirmation
);
router.post("/loads/:loadId/send-bol", documentController.sendBOL);
router.post("/loads/:loadId/send-invoice", documentController.sendInvoice);
router.post("/loads/:loadId/send-pod", documentController.sendPOD);

// Document expiration management routes
router.get("/expiring", documentController.getExpiringDocuments);
router.post("/cleanup-expired", documentController.cleanupExpiredDocuments);
router.post(
  "/send-expiration-notifications",
  documentController.sendExpirationNotifications
);

export default router;
