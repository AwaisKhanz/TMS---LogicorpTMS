import type { Address } from "./api.types";

// Document Enums (based on Prisma schema)
export enum DocumentType {
  RATE_CONFIRMATION = "RATE_CONFIRMATION",
  BOL = "BOL",
  POD = "POD",
  INVOICE = "INVOICE",
  W9 = "W9",
  INSURANCE = "INSURANCE",
  AUTHORITY = "AUTHORITY",
  CONTRACT = "CONTRACT",
  OTHER = "OTHER",
}

export enum EntityType {
  LOAD = "LOAD",
  CARRIER = "CARRIER",
  CUSTOMER = "CUSTOMER",
  INVOICE = "INVOICE",
  USER = "USER",
}

// Main Document Interface
export interface Document {
  id: string;
  organizationId: string;
  entityType: EntityType;
  entityId: string;
  type: DocumentType;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  expiresAt?: string;
}

// Request Types
export interface CreateDocumentRequest {
  entityType: EntityType;
  entityId: string;
  type: DocumentType;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiresAt?: Date | string;
}

export interface UpdateDocumentRequest {
  name?: string;
  expiresAt?: Date | string;
}

export interface DocumentFilters {
  entityType?: EntityType;
  entityId?: string;
  type?: DocumentType;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Response Types
export interface CreateDocumentResponse {
  document: Document;
}

export interface UpdateDocumentResponse {
  document: Document;
}

export interface GetDocumentResponse {
  document: Document;
}

export interface GetDocumentsResponse {
  documents: Document[];
}

export interface DeleteDocumentResponse {
  message: string;
}

// Upload Types
export interface UploadFileRequest {
  file: File | Buffer;
  entityType: EntityType;
  entityId: string;
  type: DocumentType;
  name?: string;
  expiresAt?: Date | string;
}

export interface UploadFileResponse {
  document: Document;
  fileUrl: string;
}

export interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Document Generation Types
export interface OrganizationInfo {
  name: string;
  address?: Address;
  phone?: string;
  email?: string;
  logo?: string | null;
  mcNumber?: string;
  dotNumber?: string;
}

export interface RateConfirmationData {
  loadId: string;
  loadNumber: string;
  customerName: string;
  customerAddress: Address;
  carrierName: string;
  carrierMC: string;
  pickupDate: string;
  deliveryDate: string;
  shipper: {
    name: string;
    address: Address;
    phone: string;
  };
  consignee: {
    name: string;
    address: Address;
    phone: string;
  };
  commodity: string;
  weight: number;
  equipmentType: string;
  customerRate: number;
  carrierRate: number;
  pickupInstructions?: string;
  deliveryInstructions?: string;
}

export interface BOLData {
  loadId: string;
  loadNumber: string;
  bolNumber: string;
  shipper: {
    name: string;
    address: Address;
    phone: string;
  };
  consignee: {
    name: string;
    address: Address;
    phone: string;
  };
  carrierName: string;
  carrierMC: string;
  driverName?: string;
  truckNumber?: string;
  trailerNumber?: string;
  commodity: string;
  weight: number;
  pieces: number;
  equipmentType: string;
  pickupDate: string;
  pickupTime?: string;
  deliveryDate: string;
  deliveryTime?: string;
  specialInstructions?: string;
  hazmat: boolean;
}

export interface InvoiceData {
  loadId: string;
  loadNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: Address;
  billToAddress?: Address;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Generate Document Requests
export interface GenerateRateConfirmationRequest {
  loadId: string;
  templateId?: string;
}

export interface GenerateBOLRequest {
  loadId: string;
  bolNumber?: string;
  templateId?: string;
}

export interface GenerateInvoiceRequest {
  loadId: string;
  invoiceNumber?: string;
  dueDate?: string;
  templateId?: string;
}

// Generate Document Responses
export interface GenerateDocumentResponse {
  document: Document;
  fileUrl: string;
  pdfBuffer?: Buffer;
}

// Document Template Types
export interface DocumentTemplate {
  id: string;
  type: DocumentType;
  name: string;
  template: string; // HTML template
  isDefault: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTemplateRequest {
  type: DocumentType;
  name: string;
  template: string;
  isDefault?: boolean;
}

export interface UpdateDocumentTemplateRequest extends Partial<CreateDocumentTemplateRequest> {}

// Document Statistics
export interface DocumentStatistics {
  total: number;
  byType: Record<DocumentType, number>;
  byEntity: Record<EntityType, number>;
  recentUploads: Document[];
  expiringDocs: Document[];
}

// Document Download/Preview
export interface DocumentDownloadRequest {
  documentId: string;
  inline?: boolean; // For preview vs download
}

export interface DocumentPreviewResponse {
  document: Document;
  previewUrl: string;
}