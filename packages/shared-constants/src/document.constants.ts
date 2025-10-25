// ==================== DOCUMENT TYPES ====================

export const DOCUMENT_TYPES = {
  RATE_CONFIRMATION: "RATE_CONFIRMATION",
  BOL: "BOL",
  POD: "POD",
  INVOICE: "INVOICE",
  W9: "W9",
  INSURANCE: "INSURANCE",
  AUTHORITY: "AUTHORITY",
  CONTRACT: "CONTRACT",
  AVATAR: "AVATAR",
  LOGO: "LOGO",
  OTHER: "OTHER",
} as const;

// ==================== DOCUMENT TYPE OPTIONS ====================

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "RATE_CONFIRMATION", label: "Rate Confirmation" },
  { value: "BOL", label: "Bill of Lading" },
  { value: "POD", label: "Proof of Delivery" },
  { value: "INVOICE", label: "Invoice" },
  { value: "W9", label: "W-9 Form" },
  { value: "INSURANCE", label: "Insurance Certificate" },
  { value: "AUTHORITY", label: "Authority Document" },
  { value: "CONTRACT", label: "Contract" },
  { value: "AVATAR", label: "Avatar" },
  { value: "LOGO", label: "Logo" },
  { value: "OTHER", label: "Other" },
] as const;

// ==================== ENTITY TYPE OPTIONS ====================

export const ENTITY_TYPE_OPTIONS = [
  { value: "LOAD", label: "Load" },
  { value: "CARRIER", label: "Carrier" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "DOCUMENT", label: "Document" },
  { value: "INVOICE", label: "Invoice" },
  { value: "PAYMENT", label: "Payment" },
  { value: "VIEWER", label: "User" },
  { value: "ORGANIZATION", label: "Organization" },
] as const;

// ==================== TYPE EXPORTS ====================

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];
