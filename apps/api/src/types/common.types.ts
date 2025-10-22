// Re-export common types from shared types package
export type {
  ApiResponse,
  ApiErrorResponse as ApiError,
  PaginationMeta,
  PaginationParams,
  Address,
  WhereClause,
} from "@tms/shared-types";

// Document Numbering Types
export interface DocumentNumberingSettings {
  prefix: string;
  startNumber: number;
  currentNumber: number;
}

export interface OrganizationDocumentNumbering {
  LOAD?: DocumentNumberingSettings;
  INVOICE?: DocumentNumberingSettings;
  BOL?: DocumentNumberingSettings;
  RATE_CONFIRMATION?: DocumentNumberingSettings;
}

// Organization Settings Types
export interface OrganizationSettings {
  id: string;
  name: string;
  documentNumbering?: OrganizationDocumentNumbering;
}
