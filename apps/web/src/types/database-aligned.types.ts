/**
 * Database-Aligned Types
 * Re-export all types from shared types package to maintain compatibility
 */

// Re-export all shared types
export type {
  // Core API Types
  Address,

  // Load Types
  Load,
  LoadStatus,
  EquipmentType,
  LoadType,
  Dimensions,
  Accessorial,
  LoadCustomer,
  LoadCarrier,
  LoadCreator,
  LoadEvent,
  LoadDocument,
  LoadTrackingInfo,

  // Carrier Types
  Carrier,
  CarrierContact,
  CSAScores,
  PreferredLane,
  CarrierDocument,

  // Customer Types
  Customer,
  CustomerContact,
  PreferredCarrier,

  // Document Types
  Document,
  DocumentType,
  EntityType,

  // User Types
  User,
  Role,
  Permission,

  // Organization Types
  Organization,

  // Invoice Types
  InvoiceStatus,
} from "@tms/shared-types";

// Re-export Prisma types that are needed
export type {
  User as PrismaUser,
  Organization as PrismaOrganization,
  Role as PrismaRole,
  Permission as PrismaPermission,
  Session,
  LoadEvent as PrismaLoadEvent,
  CarrierContact as PrismaCarrierContact,
  CustomerContact as PrismaCustomerContact,
  Invoice,
  InvoiceLineItem,
  AuditLog,
} from "@prisma/client";
