import { Response, NextFunction, Request } from "express";
import { DocumentService } from "../services/document.service.js";
import { DocumentGenerationService } from "../services/document-generation.service.js";
import { z } from "zod";
import type { EntityType, DocumentType } from "../types/document.types.js";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const documentService = new DocumentService();
const documentGenService = new DocumentGenerationService();

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
        data: document,
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
        data: document,
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
        data: document,
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

      // For now, redirect to the file URL
      // In production, you might want to stream the file or add additional security
      res.redirect(document.fileUrl);
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
        data: document,
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
        data: document,
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
}
