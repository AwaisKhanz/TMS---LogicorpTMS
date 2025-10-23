import { EntityType, DocumentType } from "@prisma/client";
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFiltersDto,
  UploadedFile,
} from "../types/document.types.js";
import { WhereClause } from "../types/common.types.js";
import prisma from "../config/database.js";
import fs from "fs/promises";
import { storageService, generateFileKey } from "./storage.service.js";
import { logger } from "../config/logger.js";
import type { FileInput } from "../types/storage.types.js";
import {
  EmailNotificationService,
  type DocumentExpirationData,
} from "./email-notification.service.js";
// Notification rule imports removed - using simplified notification system

export class DocumentService {
  private uploadsDir = process.env.UPLOADS_DIR || "uploads";
  private emailService: EmailNotificationService;

  constructor() {
    this.ensureUploadsDirectory();
    this.emailService = new EmailNotificationService();
  }

  private async ensureUploadsDirectory() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async getDocuments(organizationId: string, filters: DocumentFiltersDto) {
    const {
      page = 1,
      limit = 50,
      entityType,
      entityId,
      type,
      search,
    } = filters;
    const skip = (page - 1) * limit;

    const where: WhereClause = {
      organizationId,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: {
          uploadedAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getDocumentById(id: string, organizationId: string) {
    return prisma.document.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async uploadDocument(
    file: UploadedFile,
    documentData: Omit<CreateDocumentDto, "fileUrl" | "fileSize" | "mimeType">,
    userId: string,
    organizationId: string
  ) {
    try {
      // Generate unique file key for storage
      const fileKey = generateFileKey(
        organizationId,
        String(documentData.entityType),
        documentData.entityId,
        file.originalname
      );

      // Upload file using storage service (local or S3)
      const uploadResult = await storageService.upload(file, fileKey, {
        contentType: file.mimetype,
        metadata: {
          entityType: String(documentData.entityType),
          entityId: documentData.entityId,
          uploadedBy: userId,
        },
      });

      logger.info(`Document uploaded: ${fileKey} -> ${uploadResult.url}`);

      // Create document record
      const document = await prisma.document.create({
        data: {
          organizationId,
          entityType: documentData.entityType,
          entityId: documentData.entityId,
          type: documentData.type,
          name: documentData.name || file.originalname,
          fileUrl: uploadResult.url, // Store full URL
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimetype,
          uploadedBy: userId,
          expiresAt: documentData.expiresAt,
        },
      });

      // Create load event for document upload (if it's a load document)
      if (String(documentData.entityType) === "LOAD") {
        const { LoadRepository } = await import(
          "../repositories/load.repository.js"
        );
        const loadRepo = new LoadRepository();

        // Get user details for the event
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true },
        });

        await loadRepo.createLoadEvent(
          documentData.entityId,
          "DOCUMENT_UPLOADED",
          {
            documentId: document.id,
            documentName: document.name,
            documentType: documentData.type,
            uploadedBy: userId,
            uploadedByName: user
              ? `${user.firstName} ${user.lastName}`
              : "Unknown User",
          },
          userId
        );
      }

      return document;
    } catch (error) {
      logger.error("Document upload failed:", error);
      throw new Error("Failed to upload document");
    }
  }

  async saveGeneratedDocument(
    organizationId: string,
    entityType: EntityType,
    entityId: string,
    type: DocumentType,
    name: string,
    pdfBuffer: Buffer,
    userId: string
  ) {
    try {
      // Generate unique file key for storage
      const fileKey = generateFileKey(
        organizationId,
        String(entityType),
        entityId,
        `${name}.pdf`
      );

      // Create a mock file object for the storage service
      const mockFile: FileInput = {
        fieldname: "file",
        originalname: `${name}.pdf`,
        encoding: "7bit",
        mimetype: "application/pdf",
        buffer: pdfBuffer,
        size: pdfBuffer.length,
        stream: null,
        destination: "",
        filename: "",
        path: "",
      };

      // Upload PDF using storage service
      const uploadResult = await storageService.upload(mockFile, fileKey, {
        contentType: "application/pdf",
        metadata: {
          entityType: String(entityType),
          entityId,
          uploadedBy: userId,
          generated: "true",
        },
      });

      logger.info(
        `Generated document uploaded: ${fileKey} -> ${uploadResult.url}`
      );

      // Create document record
      const document = await prisma.document.create({
        data: {
          organizationId,
          entityType: entityType,
          entityId,
          type: type,
          name,
          fileUrl: uploadResult.url,
          fileSize: uploadResult.size,
          mimeType: "application/pdf",
          uploadedBy: userId,
        },
      });

      return document;
    } catch (error) {
      logger.error("Generated document upload failed:", error);
      throw new Error("Failed to save generated document");
    }
  }

  async updateDocument(
    id: string,
    data: UpdateDocumentDto,
    organizationId: string
  ) {
    const existingDocument = await prisma.document.findFirst({
      where: { id, organizationId },
    });

    if (!existingDocument) {
      return null;
    }

    const document = await prisma.document.update({
      where: { id },
      data,
    });

    return document;
  }

  async deleteDocument(id: string, organizationId: string) {
    const document = await prisma.document.findFirst({
      where: { id, organizationId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    try {
      // Extract file key from URL for storage service
      const fileKey = this.extractFileKeyFromUrl(document.fileUrl);

      // Delete file using storage service
      await storageService.delete(fileKey);

      logger.info(`Document deleted from storage: ${fileKey}`);
    } catch (error) {
      logger.warn("Failed to delete file from storage:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record
    await prisma.document.delete({
      where: { id },
    });
  }

  private extractFileKeyFromUrl(fileUrl: string): string {
    // For S3 URLs, extract the key after the bucket name
    if (fileUrl.includes("amazonaws.com/")) {
      const parts = fileUrl.split("amazonaws.com/");
      return parts[1] || "";
    }

    // For local URLs, extract the path after the base URL
    if (fileUrl.includes("/uploads/")) {
      const parts = fileUrl.split("/uploads/");
      return parts[1] || "";
    }

    // Fallback: return the full URL as key
    return fileUrl;
  }

  async getDocumentsByEntity(
    entityType: EntityType,
    entityId: string,
    organizationId: string
  ) {
    return prisma.document.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });
  }

  async getDocumentStatistics(organizationId: string) {
    const stats = await prisma.document.groupBy({
      by: ["type"],
      where: {
        organizationId,
      },
      _count: {
        id: true,
      },
      _sum: {
        fileSize: true,
      },
    });

    const totalDocuments = await prisma.document.count({
      where: { organizationId },
    });

    const totalSize = await prisma.document.aggregate({
      where: { organizationId },
      _sum: {
        fileSize: true,
      },
    });

    // Check for expiring documents (within 30 days)
    const expiringDocuments = await prisma.document.count({
      where: {
        organizationId,
        expiresAt: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          gte: new Date(),
        },
      },
    });

    return {
      total: totalDocuments,
      totalSize: totalSize._sum.fileSize || 0,
      expiring: expiringDocuments,
      breakdown: stats.reduce(
        (acc: Record<string, { count: number; size: number }>, stat) => {
          acc[stat.type] = {
            count: stat._count.id,
            size: stat._sum.fileSize || 0,
          };
          return acc;
        },
        {}
      ),
    };
  }

  async getExpiringDocuments(organizationId: string, days = 30) {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return prisma.document.findMany({
      where: {
        organizationId,
        expiresAt: {
          lte: cutoffDate,
          gte: new Date(),
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });
  }

  async cleanupExpiredDocuments(organizationId: string) {
    const expiredDocuments = await prisma.document.findMany({
      where: {
        organizationId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    for (const document of expiredDocuments) {
      try {
        await this.deleteDocument(document.id, organizationId);
      } catch (error) {
        console.error(
          "Failed to cleanup expired document:",
          document.id,
          error
        );
      }
    }

    return expiredDocuments.length;
  }

  async getExpiringDocumentsForNotification(organizationId: string, days = 30) {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const startDate = new Date();

    return prisma.document.findMany({
      where: {
        organizationId,
        expiresAt: {
          lte: cutoffDate,
          gte: startDate,
        },
      },
      include: {
        organization: {
          select: {
            name: true,
            billingEmail: true,
          },
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });
  }

  async sendExpirationNotifications(organizationId: string) {
    try {
      const expiringDocuments = await this.getExpiringDocumentsForNotification(
        organizationId,
        30
      );

      if (expiringDocuments.length === 0) {
        return { sent: 0, message: "No expiring documents found" };
      }

      // Group documents by expiration date ranges
      const urgentDocs: DocumentExpirationData[] = [];
      const warningDocs: DocumentExpirationData[] = [];

      expiringDocuments.forEach((doc) => {
        const daysUntilExpiry = Math.ceil(
          (doc.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const expData: DocumentExpirationData = {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          expiresAt: doc.expiresAt!,
          entityType: doc.entityType,
          entityId: doc.entityId,
          daysUntilExpiry,
          alertLevel: daysUntilExpiry <= 7 ? "URGENT" : "WARNING",
        };

        if (daysUntilExpiry <= 7) {
          urgentDocs.push(expData);
        } else {
          warningDocs.push(expData);
        }
      });

      // Send email notification
      const organizationEmail =
        expiringDocuments[0]?.organization?.billingEmail;
      const organizationName = expiringDocuments[0]?.organization?.name;

      if (!organizationEmail || !organizationName) {
        logger.warn(`No email configured for organization ${organizationId}`);
        return {
          sent: 0,
          urgent: urgentDocs.length,
          warning: warningDocs.length,
          message: "No organization email configured",
        };
      }

      const emailResult =
        await this.emailService.sendDocumentExpirationNotifications(
          organizationName,
          organizationEmail,
          urgentDocs,
          warningDocs
        );

      logger.info(
        `Document expiration notifications for org ${organizationId}:`
      );
      logger.info(`Urgent (≤7 days): ${urgentDocs.length} documents`);
      logger.info(`Warning (8-30 days): ${warningDocs.length} documents`);
      logger.info(`Email sent: ${emailResult.sent}`);

      return {
        sent: expiringDocuments.length,
        urgent: urgentDocs.length,
        warning: warningDocs.length,
        emailSent: emailResult.sent,
        message: emailResult.message,
      };
    } catch (error) {
      logger.error("Failed to send expiration notifications:", error);
      throw new Error("Failed to send expiration notifications");
    }
  }
}
