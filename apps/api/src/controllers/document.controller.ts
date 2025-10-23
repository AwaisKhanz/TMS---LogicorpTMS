import { Response, NextFunction, Request } from "express";
import { DocumentService } from "../services/document.service.js";
import { DocumentGenerationService } from "../services/document-generation.service.js";
import { DocumentDeliveryService } from "../services/document-delivery.service.js";
import { z } from "zod";
import type { EntityType, DocumentType, Document } from "@tms/shared-types";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const documentService = new DocumentService();
const documentGenService = new DocumentGenerationService();
const documentDeliveryService = new DocumentDeliveryService();

// Transform Prisma document to shared-types Document
function transformDocument(prismaDoc: any): Document {
  return {
    id: prismaDoc.id,
    organizationId: prismaDoc.organizationId,
    entityType: prismaDoc.entityType as EntityType,
    entityId: prismaDoc.entityId,
    type: prismaDoc.type as DocumentType,
    name: prismaDoc.name,
    fileUrl: prismaDoc.fileUrl,
    fileSize: prismaDoc.fileSize,
    mimeType: prismaDoc.mimeType,
    uploadedAt: prismaDoc.uploadedAt.toISOString(),
    uploadedBy: prismaDoc.uploadedBy,
    expiresAt: prismaDoc.expiresAt?.toISOString(),
  };
}

export const uploadDocumentSchema = z.object({
  entityType: z.enum(["LOAD", "CARRIER", "CUSTOMER", "INVOICE", "USER"]),
  entityId: z.string().min(1, "Entity ID is required"),
  type: z.enum([
    "RATE_CONFIRMATION",
    "BOL",
    "POD",
    "INVOICE",
    "W9",
    "INSURANCE",
    "AUTHORITY",
    "CONTRACT",
    "OTHER",
  ]),
  name: z.string().min(1, "Document name is required"),
});

export class DocumentController {
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters = {
        entityType: req.query.entityType as EntityType,
        entityId: req.query.entityId as string,
        type: req.query.type as DocumentType,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await documentService.getDocuments(
        req.auth.organizationId,
        filters
      );

      res.status(200).json({
        success: true,
        documents: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req: MulterRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      if (!req.file) {
        throw new Error("No file uploaded");
      }

      const { entityType, entityId, type, name } = req.body;

      const document = await documentService.uploadDocument(
        req.file,
        {
          entityType: entityType as EntityType,
          entityId,
          type: type as DocumentType,
          name: name || req.file.originalname,
        },
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: document as any,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEntityDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { entityType, entityId } = req.params;

      const documents = await documentService.getDocumentsByEntity(
        entityType as EntityType,
        entityId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;

      const document = await documentService.getDocumentById(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: document as any,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;

      await documentService.deleteDocument(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: {
          message: "Document deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async generateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId, documentType } = req.body;

      if (!loadId || !documentType) {
        throw new Error("Load ID and document type are required");
      }

      // Use document generation service based on type
      let document;

      if (documentType === "RATE_CONFIRMATION") {
        document = await documentGenService.generateRateConfirmation(
          loadId,
          req.auth.organizationId,
          req.auth.userId
        );
      } else if (documentType === "BOL") {
        document = await documentGenService.generateBOL(
          loadId,
          req.auth.organizationId,
          req.auth.userId
        );
      } else {
        throw new Error("Unsupported document type for generation");
      }

      res.status(201).json({
        success: true,
        data: document as any,
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;

      const document = await documentService.getDocumentById(
        id,
        req.auth.organizationId
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          error: "Document not found",
        });
      }

      // Set appropriate headers for file download
      let contentType = document.mimeType || "application/octet-stream";

      // Force PDF content type for PDF files
      if (
        document.name.toLowerCase().endsWith(".pdf") ||
        contentType === "application/pdf"
      ) {
        contentType = "application/pdf";
      }

      // For local storage (both uploaded and generated files), serve the file directly
      if (document.fileUrl.includes("/uploads/")) {
        const fs = await import("fs");
        const path = await import("path");
        const { config } = await import("../config/env.js");

        // Extract the relative path from the URL (works for both localhost and relative URLs)
        const relativePath = document.fileUrl.split("/uploads/")[1];
        const filePath = path.resolve(
          config.storage.local.uploadDir,
          relativePath
        );

        // Check if file exists
        try {
          await fs.promises.access(filePath);

          // Ensure filename has .pdf extension for PDF files
          let filename = document.name;
          if (
            contentType === "application/pdf" &&
            !filename.toLowerCase().endsWith(".pdf")
          ) {
            filename = `${filename}.pdf`;
          }

          // Send file with options to preserve headers
          return res.sendFile(filePath, {
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Content-Length": document.fileSize?.toString() || "0",
            },
          });
        } catch (error) {
          return res.status(404).json({
            success: false,
            error: "File not found on server",
          });
        }
      }

      // For S3 or other cloud storage, generate signed URL for secure access
      if (document.fileUrl.includes("amazonaws.com/")) {
        const { storageService } = await import(
          "../services/storage.service.js"
        );

        // Extract file key more robustly
        const urlParts = document.fileUrl.split("amazonaws.com/");
        if (urlParts.length < 2) {
          return res.status(400).json({
            success: false,
            error: "Invalid S3 URL format",
          });
        }

        // Get the file key and decode it properly
        const encodedFileKey = urlParts[1];
        const fileKey = decodeURIComponent(encodedFileKey);

        try {
          // Verify file exists in S3 before generating signed URL
          const fileExists = await storageService.exists(fileKey);
          if (!fileExists) {
            console.error("File does not exist in S3:", fileKey);
            return res.status(404).json({
              success: false,
              error: "File not found in storage",
            });
          }

          // Generate signed URL (valid for 1 hour)
          const signedUrl = storageService.getSignedUrl(fileKey, 3600);

          // Return the signed URL as JSON instead of redirecting
          res.json({
            success: true,
            downloadUrl: signedUrl,
            filename: document.name,
            mimeType: document.mimeType,
            fileSize: document.fileSize,
          });
        } catch (error) {
          console.error("Error generating signed URL:", error);
          return res.status(500).json({
            success: false,
            error: "Failed to generate download URL",
          });
        }
      } else {
        // For other cloud storage, redirect to the URL
        res.redirect(document.fileUrl);
      }
    } catch (error) {
      next(error);
    }
  }

  async generateRateConfirmation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;

      const document = await documentGenService.generateRateConfirmation(
        loadId,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(201).json({
        success: true,
        data: document as any,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateBOL(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;

      const document = await documentGenService.generateBOL(
        loadId,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(201).json({
        success: true,
        data: document as any,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;

      const document = await documentGenService.generateInvoice(
        loadId,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(201).json({
        success: true,
        data: document as any,
      });
    } catch (error) {
      next(error);
    }
  }

  async generatePOD(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;

      const document = await documentGenService.generatePOD(
        loadId,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(201).json({
        success: true,
        data: document as any,
      });
    } catch (error) {
      next(error);
    }
  }

  async getExpiringDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const days = parseInt(req.query.days as string) || 30;

      const documents = await documentService.getExpiringDocuments(
        req.auth.organizationId,
        days
      );

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  async cleanupExpiredDocuments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const deletedCount = await documentService.cleanupExpiredDocuments(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: {
          deletedCount,
          message: `${deletedCount} expired documents cleaned up`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendExpirationNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const result = await documentService.sendExpirationNotifications(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const { recipients, subject, message } = req.body;

      if (
        !recipients ||
        !Array.isArray(recipients) ||
        recipients.length === 0
      ) {
        throw new Error("Recipients are required");
      }

      const document = await documentService.getDocumentById(
        id,
        req.auth.organizationId
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          error: "Document not found",
        });
      }

      // Get organization name
      const { default: prisma } = await import("../config/database.js");
      const org = await prisma.organization.findUnique({
        where: { id: req.auth.organizationId },
        select: { name: true },
      });

      const result = await documentDeliveryService.sendDocument({
        document: transformDocument(document),
        recipients,
        subject,
        message,
        organizationName: org?.name || "TMS",
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMultipleDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { documentIds, recipients, subject, message } = req.body;

      if (
        !documentIds ||
        !Array.isArray(documentIds) ||
        documentIds.length === 0
      ) {
        throw new Error("Document IDs are required");
      }

      if (
        !recipients ||
        !Array.isArray(recipients) ||
        recipients.length === 0
      ) {
        throw new Error("Recipients are required");
      }

      // Get documents
      const documents = await Promise.all(
        documentIds.map((id: string) =>
          documentService.getDocumentById(id, req.auth!.organizationId)
        )
      );

      const validDocuments = documents.filter(
        (doc): doc is NonNullable<typeof doc> => doc !== null
      );

      if (validDocuments.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No valid documents found",
        });
      }

      // Get organization name
      const { default: prisma } = await import("../config/database.js");
      const org = await prisma.organization.findUnique({
        where: { id: req.auth.organizationId },
        select: { name: true },
      });

      const result = await documentDeliveryService.sendMultipleDocuments(
        validDocuments.map(transformDocument),
        recipients,
        org?.name || "TMS",
        subject,
        message
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendRateConfirmation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;
      const { carrierEmail, carrierName } = req.body;

      if (!carrierEmail || !carrierName) {
        throw new Error("Carrier email and name are required");
      }

      // Get load and organization info
      const { default: prisma } = await import("../config/database.js");
      const load = await prisma.load.findFirst({
        where: {
          id: loadId,
          organizationId: req.auth.organizationId,
        },
        include: {
          organization: { select: { name: true } },
        },
      });

      if (!load) {
        return res.status(404).json({
          success: false,
          error: "Load not found",
        });
      }

      // Generate rate confirmation if not exists
      let document;
      try {
        document = await documentGenService.generateRateConfirmation(
          loadId,
          req.auth.organizationId,
          req.auth.userId
        );
      } catch (error) {
        // Document might already exist, try to find it
        const existingDocs = await documentService.getDocumentsByEntity(
          "LOAD",
          loadId,
          req.auth.organizationId
        );
        document = existingDocs.find((doc) => doc.type === "RATE_CONFIRMATION");

        if (!document) {
          throw new Error("Failed to generate or find rate confirmation");
        }
      }

      const result = await documentDeliveryService.sendRateConfirmation(
        transformDocument(document),
        carrierEmail,
        carrierName,
        load.loadNumber,
        load.organization.name
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendBOL(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;
      const { carrierEmail, carrierName } = req.body;

      if (!carrierEmail || !carrierName) {
        throw new Error("Carrier email and name are required");
      }

      // Get load and organization info
      const { default: prisma } = await import("../config/database.js");
      const load = await prisma.load.findFirst({
        where: {
          id: loadId,
          organizationId: req.auth.organizationId,
        },
        include: {
          organization: { select: { name: true } },
        },
      });

      if (!load) {
        return res.status(404).json({
          success: false,
          error: "Load not found",
        });
      }

      // Generate BOL if not exists
      let document;
      try {
        document = await documentGenService.generateBOL(
          loadId,
          req.auth.organizationId,
          req.auth.userId
        );
      } catch (error) {
        // Document might already exist, try to find it
        const existingDocs = await documentService.getDocumentsByEntity(
          "LOAD",
          loadId,
          req.auth.organizationId
        );
        document = existingDocs.find((doc) => doc.type === "BOL");

        if (!document) {
          throw new Error("Failed to generate or find BOL");
        }
      }

      const result = await documentDeliveryService.sendBOL(
        transformDocument(document),
        carrierEmail,
        carrierName,
        load.loadNumber,
        load.organization.name
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;
      const { customerEmail, customerName } = req.body;

      if (!customerEmail || !customerName) {
        throw new Error("Customer email and name are required");
      }

      // Get load and organization info
      const { default: prisma } = await import("../config/database.js");
      const load = await prisma.load.findFirst({
        where: {
          id: loadId,
          organizationId: req.auth.organizationId,
        },
        include: {
          organization: { select: { name: true } },
        },
      });

      if (!load) {
        return res.status(404).json({
          success: false,
          error: "Load not found",
        });
      }

      // Generate invoice if not exists
      let document;
      try {
        document = await documentGenService.generateInvoice(
          loadId,
          req.auth.organizationId,
          req.auth.userId
        );
      } catch (error) {
        // Document might already exist, try to find it
        const existingDocs = await documentService.getDocumentsByEntity(
          "LOAD",
          loadId,
          req.auth.organizationId
        );
        document = existingDocs.find((doc) => doc.type === "INVOICE");

        if (!document) {
          throw new Error("Failed to generate or find invoice");
        }
      }

      const result = await documentDeliveryService.sendInvoice(
        transformDocument(document),
        customerEmail,
        customerName,
        load.loadNumber,
        load.organization.name
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendPOD(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadId } = req.params;
      const { recipients, subject, message } = req.body;

      if (
        !recipients ||
        !Array.isArray(recipients) ||
        recipients.length === 0
      ) {
        throw new Error("Recipients are required");
      }

      // Get load data
      const { default: prisma } = await import("../config/database.js");
      const load = await prisma.load.findFirst({
        where: {
          id: loadId,
          organizationId: req.auth.organizationId,
          deletedAt: null,
        },
        include: {
          customer: true,
          carrier: true,
          organization: true,
        },
      });

      if (!load) {
        return res.status(404).json({
          success: false,
          error: "Load not found",
        });
      }

      // Check if POD document exists, generate if not
      let documents = await documentService.getDocumentsByEntity(
        "LOAD",
        loadId,
        req.auth.organizationId
      );

      // Find POD document
      let document = documents.find((doc) => doc.type === "POD");

      if (!document) {
        // Generate POD document
        const { DocumentGenerationService } = await import(
          "../services/document-generation.service.js"
        );
        const documentGenService = new DocumentGenerationService();

        document = await documentGenService.generatePOD(
          loadId,
          req.auth.organizationId,
          req.auth.userId
        );

        if (!document) {
          throw new Error("Failed to generate or find POD");
        }
      }

      const result = await documentDeliveryService.sendDocument({
        document: transformDocument(document),
        recipients,
        subject: subject || `Proof of Delivery - ${document.name}`,
        message:
          message || `Please find attached the Proof of Delivery document.`,
        organizationName: load.organization.name,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
