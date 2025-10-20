import prisma from "../config/database.js";
import { logger } from "../config/logger.js";

export interface AuditLogData {
  organizationId: string;
  userId: string;
  action: string; // "CREATE", "UPDATE", "DELETE", "VIEW", "LOGIN", "LOGOUT"
  entityType: string; // "USER", "LOAD", "CARRIER", etc.
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(data: AuditLogData) {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          changes: data.changes || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      logger.info("Audit log created", {
        action: data.action,
        entityType: data.entityType,
        userId: data.userId,
      });
    } catch (error) {
      // Don't throw error, just log it
      logger.error("Failed to create audit log:", error);
    }
  }

  async logAuthentication(
    userId: string,
    organizationId: string,
    action:
      | "LOGIN"
      | "LOGOUT"
      | "REGISTER"
      | "PASSWORD_RESET"
      | "EMAIL_VERIFIED",
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      organizationId,
      userId,
      action,
      entityType: "USER",
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  async logCreate(
    organizationId: string,
    userId: string,
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      organizationId,
      userId,
      action: "CREATE",
      entityType,
      entityId,
      changes: { new: data },
      ipAddress,
      userAgent,
    });
  }

  async logUpdate(
    organizationId: string,
    userId: string,
    entityType: string,
    entityId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      organizationId,
      userId,
      action: "UPDATE",
      entityType,
      entityId,
      changes: { old: oldData, new: newData },
      ipAddress,
      userAgent,
    });
  }

  async logDelete(
    organizationId: string,
    userId: string,
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      organizationId,
      userId,
      action: "DELETE",
      entityType,
      entityId,
      changes: { old: data },
      ipAddress,
      userAgent,
    });
  }
}

export const auditService = new AuditService();
