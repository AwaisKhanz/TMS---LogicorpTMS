// Notification Constants for TMS Application

// ==================== NOTIFICATION TYPES ====================

export const NOTIFICATION_TYPES = {
  LOAD_STATUS_CHANGE: "LOAD_STATUS_CHANGE",
  LOAD_ASSIGNED: "LOAD_ASSIGNED",
  DOCUMENT_GENERATED: "DOCUMENT_GENERATED",
  INVOICE_CREATED: "INVOICE_CREATED",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  CARRIER_CREATED: "CARRIER_CREATED",
  CARRIER_UPDATED: "CARRIER_UPDATED",
  CARRIER_APPROVED: "CARRIER_APPROVED",
  CARRIER_SUSPENDED: "CARRIER_SUSPENDED",
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  CUSTOMER_UPDATED: "CUSTOMER_UPDATED",
  SYSTEM_ALERT: "SYSTEM_ALERT",
} as const;

// ==================== ENTITY TYPES ====================

export const ENTITY_TYPES = {
  LOAD: "LOAD",
  CARRIER: "CARRIER",
  CUSTOMER: "CUSTOMER",
  DOCUMENT: "DOCUMENT",
  INVOICE: "INVOICE",
  PAYMENT: "PAYMENT",
  VIEWER: "VIEWER",
  ORGANIZATION: "ORGANIZATION",
} as const;

// ==================== NOTIFICATION ICONS ====================

export const NOTIFICATION_ICONS = {
  LOAD_STATUS_CHANGE: "📦",
  LOAD_ASSIGNED: "👤",
  DOCUMENT_GENERATED: "📄",
  INVOICE_CREATED: "💰",
  PAYMENT_RECEIVED: "💵",
  CARRIER_CREATED: "🚛",
  CARRIER_UPDATED: "✏️",
  CARRIER_APPROVED: "✅",
  CARRIER_SUSPENDED: "⚠️",
  CUSTOMER_CREATED: "👥",
  CUSTOMER_UPDATED: "✏️",
  SYSTEM_ALERT: "🔧",
} as const;

// ==================== NOTIFICATION PRIORITIES ====================

export const NOTIFICATION_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

// ==================== EMAIL TEMPLATES ====================

export const EMAIL_TEMPLATES = {
  LOAD_STATUS_CHANGE: "load-status-change",
  LOAD_ASSIGNED: "load-assigned",
  DOCUMENT_GENERATED: "document-generated",
  INVOICE_CREATED: "invoice-created",
  PAYMENT_RECEIVED: "payment-received",
  CARRIER_CREATED: "carrier-created",
  CARRIER_UPDATED: "carrier-updated",
  CARRIER_APPROVED: "carrier-approved",
  CARRIER_SUSPENDED: "carrier-suspended",
  CUSTOMER_CREATED: "customer-created",
  CUSTOMER_UPDATED: "customer-updated",
  SYSTEM_ALERT: "system-alert",
} as const;

// ==================== NOTIFICATION SETTINGS ====================

export const NOTIFICATION_SETTINGS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_EMAIL_ENABLED: true,
  DEFAULT_REAL_TIME_ENABLED: true,
} as const;
