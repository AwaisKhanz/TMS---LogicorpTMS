// Re-export document types from shared types package
export type {
  Document,
  DocumentType,
  EntityType,
  CreateDocumentRequest as CreateDocumentDto,
  UpdateDocumentRequest as UpdateDocumentDto,
  DocumentFilters as DocumentFiltersDto,
  CreateDocumentResponse,
  UpdateDocumentResponse,
  GetDocumentResponse,
  GetDocumentsResponse,
  DeleteDocumentResponse,
  UploadFileRequest,
  UploadFileResponse,
  UploadedFileInfo as UploadedFile,
  OrganizationInfo as OrganizationBasicInfo,
  RateConfirmationData,
  BOLData,
  InvoiceData,
  InvoiceLineItem,
  GenerateRateConfirmationRequest,
  GenerateBOLRequest,
  GenerateInvoiceRequest,
  GenerateDocumentResponse,
  DocumentTemplate,
  CreateDocumentTemplateRequest as CreateDocumentTemplateDto,
  UpdateDocumentTemplateRequest as UpdateDocumentTemplateDto,
  DocumentStatistics,
  DocumentDownloadRequest,
  DocumentPreviewResponse,
  Address,
} from "@tms/shared-types";

// Additional backend-specific types
import type { DocumentType } from "@tms/shared-types";

export interface DocumentTemplateFiltersDto {
  type?: DocumentType;
  isDefault?: boolean;
}