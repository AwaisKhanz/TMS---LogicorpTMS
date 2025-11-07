import type { Address } from "./api.types";

// Consignee Interface
export interface Consignee {
  id: string;
  organizationId: string;

  // Company Information
  companyName: string;
  phone: string;
  email?: string;

  // Address Information (JSON format)
  address: Address;

  // Additional Information
  contactPerson?: string;
  notes?: string;

  // Status
  isActive: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  _count?: {
    loads: number;
  };
}

// Request Types
export interface CreateConsigneeRequest {
  companyName: string;
  phone: string;
  email?: string;
  address: Address;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateConsigneeRequest
  extends Partial<CreateConsigneeRequest> {
  isActive?: boolean;
}

export interface ConsigneeFilters {
  isActive?: boolean;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "companyName" | "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}

// Response Types
export interface CreateConsigneeResponse {
  success: boolean;
  data: Consignee;
}

export interface UpdateConsigneeResponse {
  success: boolean;
  data: Consignee;
}

export interface GetConsigneeResponse {
  success: boolean;
  data: Consignee;
}

export interface GetConsigneesResponse {
  success: boolean;
  data: Consignee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeleteConsigneeResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// Statistics Types
export interface ConsigneeStatistics {
  total: number;
  active: number;
  inactive: number;
  totalLoads: number;
  topConsignees: Consignee[];
}

// Export Types
export interface ConsigneeExportData {
  companyName: string;
  phone: string;
  email?: string;
  address: Address;
  contactPerson?: string;
  isActive: boolean;
  totalLoads: number;
  createdAt: string;
  [key: string]: unknown;
}

// Bulk Operations
export interface BulkConsigneeAction {
  action: "activate" | "deactivate" | "export" | "delete";
  consigneeIds: string[];
}

export interface BulkConsigneeResponse {
  success: number;
  failed: number;
  errors: Array<{
    consigneeId: string;
    error: string;
  }>;
}
