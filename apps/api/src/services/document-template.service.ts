import { DocumentType } from "@prisma/client";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.util.js";
import type {
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
  DocumentTemplateFiltersDto,
} from "../types/document.types.js";

export class DocumentTemplateService {
  async getTemplates(
    organizationId: string,
    filters: DocumentTemplateFiltersDto = {}
  ) {
    const { type, isDefault } = filters;

    const where = {
      organizationId,
      ...(type && { type }),
      ...(isDefault !== undefined && { isDefault }),
    };

    const templates = await prisma.documentTemplate.findMany({
      where,
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return templates;
  }

  async getTemplateById(id: string, organizationId: string) {
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError("Document template");
    }

    return template;
  }

  async createTemplate(
    data: CreateDocumentTemplateDto,
    userId: string,
    organizationId: string
  ) {
    // Check if this template name already exists for this type
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        organizationId,
        type: data.type,
        name: data.name,
      },
    });

    if (existingTemplate) {
      throw new Error("A template with this name already exists for this document type");
    }

    // If this is set as default, unset other default templates for this type
    if (data.isDefault) {
      await prisma.documentTemplate.updateMany({
        where: {
          organizationId,
          type: data.type,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.documentTemplate.create({
      data: {
        ...data,
        organizationId,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return template;
  }

  async updateTemplate(
    id: string,
    data: UpdateDocumentTemplateDto,
    organizationId: string
  ) {
    const existingTemplate = await this.getTemplateById(id, organizationId);

    // Check if name is being changed and conflicts with existing
    if (data.name && data.name !== existingTemplate.name) {
      const conflictingTemplate = await prisma.documentTemplate.findFirst({
        where: {
          organizationId,
          type: existingTemplate.type,
          name: data.name,
          id: { not: id },
        },
      });

      if (conflictingTemplate) {
        throw new Error("A template with this name already exists for this document type");
      }
    }

    // If this is being set as default, unset other defaults for this type
    if (data.isDefault) {
      await prisma.documentTemplate.updateMany({
        where: {
          organizationId,
          type: existingTemplate.type,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.documentTemplate.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return template;
  }

  async deleteTemplate(id: string, organizationId: string) {
    const template = await this.getTemplateById(id, organizationId);

    if (template.isDefault) {
      throw new Error("Cannot delete the default template. Set another template as default first.");
    }

    await prisma.documentTemplate.delete({
      where: { id },
    });
  }

  async setDefaultTemplate(id: string, organizationId: string) {
    const template = await this.getTemplateById(id, organizationId);

    // Unset other default templates for this type
    await prisma.documentTemplate.updateMany({
      where: {
        organizationId,
        type: template.type,
        isDefault: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this template as default
    const updatedTemplate = await prisma.documentTemplate.update({
      where: { id },
      data: { isDefault: true },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedTemplate;
  }

  async getDefaultTemplate(type: DocumentType, organizationId: string) {
    const template = await prisma.documentTemplate.findFirst({
      where: {
        organizationId,
        type,
        isDefault: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError(`Default template for ${type}`);
    }

    return template;
  }

  async getTemplatesByType(type: DocumentType, organizationId: string) {
    const templates = await prisma.documentTemplate.findMany({
      where: {
        organizationId,
        type,
      },
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return templates;
  }
}