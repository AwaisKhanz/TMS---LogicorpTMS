import type { Address } from "./api.types";

// Shipper Interface
export interface Shipper {
  id: string;
  organizationId: string;

  // Company Information
  companyName: string;
  phone: string;
  email?: string;

  // Address Information
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

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
export interface CreateShipperRequest {
  companyName: string;
  phone: string;
  email?: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateShipperRequest extends Partial<CreateShipperRequest> {
  isActive?: boolean;
}

export interface ShipperFilters {
  isActive?: boolean;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "companyName" | "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}

// Response Types
export interface CreateShipperResponse {
  success: boolean;
  data: Shipper;
}

export interface UpdateShipperResponse {
  success: boolean;
  data: Shipper;
}

export interface GetShipperResponse {
  success: boolean;
  data: Shipper;
}

export interface GetShippersResponse {
  success: boolean;
  data: Shipper[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeleteShipperResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// Statistics Types
export interface ShipperStatistics {
  total: number;
  active: number;
  inactive: number;
  totalLoads: number;
  topShippers: Shipper[];
}

// Export Types
export interface ShipperExportData {
  companyName: string;
  phone: string;
  email?: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactPerson?: string;
  isActive: boolean;
  totalLoads: number;
  createdAt: string;
  [key: string]: unknown;
}

// DTO Types (for API layer)
export interface CreateShipperDto {
  companyName: string;
  phone: string;
  email?: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateShipperDto extends Partial<CreateShipperDto> {
  isActive?: boolean;
}

export interface ShipperFiltersDto {
  isActive?: boolean;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "companyName" | "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}

// Statistics Response
export interface GetShipperStatisticsResponse {
  success: boolean;
  data: {
    totalShippers: number;
    activeShippers: number;
    inactiveShippers: number;
    recentShippers: number;
    topStates: Array<{
      state: string;
      count: number;
    }>;
  };
}

// Bulk Operations
export interface BulkShipperAction {
  action: "activate" | "deactivate" | "export" | "delete";
  shipperIds: string[];
}

export interface BulkShipperResponse {
  success: number;
  failed: number;
  errors: Array<{
    shipperId: string;
    error: string;
  }>;
}
