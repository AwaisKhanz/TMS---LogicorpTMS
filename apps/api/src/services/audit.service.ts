import prisma from "../config/database.js";
import { logger } from "../config/logger.js";
import type { Prisma } from "@prisma/client";

export interface AuditLogData {
  organizationId: string;
  userId: string;
  action: string; // "CREATE", "UPDATE", "DELETE", "VIEW", "LOGIN", "LOGOUT"
  entityType: string; // "USER", "LOAD", "CARRIER", etc.
  entityId: string;
  changes?: Prisma.InputJsonValue;
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
          changes: data.changes || (null as unknown as Prisma.InputJsonValue),
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
      | "EMAIL_VERIFIED"
      | "2FA_ENABLED"
      | "2FA_DISABLED"
      | "2FA_VERIFIED"
      | "2FA_FAILED",
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
      changes: { new: data } as unknown as Prisma.InputJsonValue,
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
      changes: {
        old: oldData,
        new: newData,
      } as unknown as Prisma.InputJsonValue,
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
      changes: { old: data } as unknown as Prisma.InputJsonValue,
      ipAddress,
      userAgent,
    });
  }
}

export const auditService = new AuditService();
