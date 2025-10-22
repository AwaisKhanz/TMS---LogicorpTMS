import type { Address } from "./api.types";

// Customer Sub-Types
export interface PreferredCarrier {
  carrierId: string;
  carrierName?: string;
  priority?: number;
  notes?: string;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  title?: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes?: string;
}

// Main Customer Interface
export interface Customer {
  id: string;
  organizationId: string;

  // Company Info
  companyName: string;
  dba?: string;
  industry?: string;
  website?: string;
  ein?: string;

  // Billing
  billingAddress: Address;
  billingEmail: string;
  billingPhone: string;

  // Financial
  creditLimit?: number;
  paymentTerms: string;

  // Preferences
  preferredCarriers?: PreferredCarrier[];
  equipmentTypes: string[];

  // Status
  isActive: boolean;
  notes?: string;

  // Performance
  totalLoads: number;
  totalRevenue: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  contacts?: CustomerContact[];
  _count?: {
    loads: number;
  };
}

// Request Types
export interface CreateCustomerRequest extends Record<string, unknown> {
  companyName: string;
  dba?: string;
  industry?: string;
  website?: string;
  ein?: string;
  billingAddress: Address;
  billingEmail: string;
  billingPhone: string;
  creditLimit?: number;
  paymentTerms?: string;
  preferredCarriers?: PreferredCarrier[];
  equipmentTypes?: string[];
  notes?: string;
}

export interface UpdateCustomerRequest extends Record<string, unknown> {
  companyName?: string;
  dba?: string;
  industry?: string;
  website?: string;
  ein?: string;
  billingAddress?: Address;
  billingEmail?: string;
  billingPhone?: string;
  creditLimit?: number;
  paymentTerms?: string;
  preferredCarriers?: PreferredCarrier[];
  equipmentTypes?: string[];
  isActive?: boolean;
  notes?: string;
}

export interface CreateCustomerContactRequest {
  name: string;
  title?: string;
  email: string;
  phone: string;
  isPrimary?: boolean;
  notes?: string;
}

// Legacy naming for backward compatibility
export interface CustomerContactData {
  name: string;
  title?: string;
  email: string;
  phone: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateCustomerContactRequest extends Partial<CreateCustomerContactRequest> {}

export interface CustomerFilters {
  industry?: string;
  isActive?: boolean;
  paymentTerms?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Response Types
export interface CreateCustomerResponse {
  customer: Customer;
}

export interface UpdateCustomerResponse {
  customer: Customer;
}

export interface GetCustomerResponse {
  customer: Customer;
}

export interface GetCustomersResponse {
  customers: Customer[];
}

export interface DeleteCustomerResponse {
  message: string;
}

export interface CreateCustomerContactResponse {
  contact: CustomerContact;
}

export interface UpdateCustomerContactResponse {
  contact: CustomerContact;
}

export interface DeleteCustomerContactResponse {
  message: string;
}

// Statistics Types
export interface CustomerStatistics {
  total: number;
  active: number;
  inactive: number;
  topByRevenue: Customer[];
  topByLoads: Customer[];
  avgRevenue: number;
  totalRevenue: number;
}

export interface CustomerPerformance {
  totalLoads: number;
  totalRevenue: number;
  averageLoadValue: number;
  recentLoads: number;
  paymentHistory: {
    onTime: number;
    late: number;
    outstanding: number;
  };
}

// Customer Load Data for display
export interface CustomerLoadData {
  id: string;
  loadNumber: string;
  status: string;
  pickupDate: string;
  deliveryDate: string;
  carrier?: {
    companyName: string;
  };
  customerRate: number;
  carrierRate?: number;
}

export interface GetCustomerLoadsResponse {
  loads: CustomerLoadData[];
}

// Export Types
export interface CustomerExportData {
  companyName: string;
  industry?: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: {
    city?: string;
    state?: string;
    [key: string]: unknown;
  };
  paymentTerms: string;
  creditLimit?: number | string;
  totalLoads: number;
  totalRevenue: number | string;
  isActive: boolean;
  [key: string]: unknown;
}