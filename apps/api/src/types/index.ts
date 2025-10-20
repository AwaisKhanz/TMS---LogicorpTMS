// Re-export Prisma types from shared database package
export type {
  User,
  Organization,
  Role,
  Permission,
  Session,
  Load,
  LoadEvent,
  Carrier,
  CarrierContact,
  Customer,
  CustomerContact,
  Invoice,
  InvoiceLineItem,
  Document,
  AuditLog,
  LoadStatus,
  LoadType,
  EquipmentType,
  InvoiceStatus,
  EntityType,
  DocumentType,
} from "@tms/database";

// Re-export custom types
export * from "./common.types";
export * from "./auth.types";
export * from "./user.types";
