// Export all shared types
export * from "./api.types";
export * from "./auth.types";
export * from "./user.types";
export * from "./load.types";
export * from "./carrier.types";
export * from "./customer.types";
export * from "./dashboard.types";
export * from "./document.types";
export * from "./settings.types";
export * from "./permission.types";

// Re-export common Prisma types that might be needed (as types only)
// Note: Removed Load, Carrier, Customer, Document exports to avoid conflicts with our shared types
export type {
  User,
  Organization,
  Session,
  LoadEvent,
  CarrierContact,
  CustomerContact,
  Invoice,
  InvoiceLineItem,
  AuditLog,
  InvoiceStatus,
} from "@prisma/client";

// Re-export our custom types with different names to avoid conflicts
export type {
  Permission as PrismaPermission,
  Role as PrismaRole,
} from "@prisma/client";
