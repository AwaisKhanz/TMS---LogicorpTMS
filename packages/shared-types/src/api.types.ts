// Base API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiErrorException {
  message: string;
  response?: {
    data?: ApiErrorResponse;
  };
}

// Utility type for error handling
export type ApiError = {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
  message?: string;
};

// Pagination Types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Address Types - Prisma-compatible JSON object
export interface Address extends Record<string, string | number | undefined> {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  formattedAddress?: string; // Full formatted address from Google Places
  latitude?: number; // Latitude coordinate
  longitude?: number; // Longitude coordinate
  placeId?: string; // Google Places ID
  lat?: number; // Legacy alias for latitude
  lng?: number; // Legacy alias for longitude
}

// Generic Where Clause Type for database queries
export type WhereClause = Record<string, unknown>;