import { Request, Response, NextFunction } from "express";
import { DocumentTemplateService } from "../services/document-template.service.js";
import { z } from "zod";
import type { DocumentType } from "../types/document.types.js";

const documentTemplateService = new DocumentTemplateService();

export const createDocumentTemplateSchema = z.object({
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
  name: z.string().min(1, "Template name is required"),
  template: z.string().min(1, "Template content is required"),
  isDefault: z.boolean().optional(),
});

export const updateDocumentTemplateSchema =
  createDocumentTemplateSchema.partial();

export class DocumentTemplateController {
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { type, isDefault } = req.query;

      const templates = await documentTemplateService.getTemplates(
        req.auth.organizationId,
        {
          type: type as DocumentType,
          isDefault: isDefault === "true" ? true : undefined,
        }
      );

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;

      const template = await documentTemplateService.getTemplateById(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const template = await documentTemplateService.createTemplate(
        req.body,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;

      const template = await documentTemplateService.updateTemplate(
        id,
        req.body,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;

      await documentTemplateService.deleteTemplate(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: {
          message: "Template deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;

      const template = await documentTemplateService.setDefaultTemplate(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDefaultTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { type } = req.params;

      const template = await documentTemplateService.getDefaultTemplate(
        type as DocumentType,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }
}
