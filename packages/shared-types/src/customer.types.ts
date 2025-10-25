import type { Address } from "./api.types";

// Customer Sub-Types

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
  creditLimit: number;
  creditUsed: number;
  paymentTerms: string;

  // Preferences
  equipmentTypes: string[];

  // Status
  isActive: boolean;
  notes?: string;

  // Performance
  totalLoads: number;
  totalRevenue: number;
  averageMargin: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  contacts?: CustomerContact[];
  _count?: {
    loads: number;
    invoices: number;
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

export interface UpdateCustomerContactRequest
  extends Partial<CreateCustomerContactRequest> {}

export interface CustomerFilters {
  industry?: string;
  isActive?: boolean;
  paymentTerms?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?:
    | "companyName"
    | "totalRevenue"
    | "totalLoads"
    | "creditLimit"
    | "createdAt"
    | "updatedAt";
  order?: "asc" | "desc";
  creditStatus?: "good" | "warning" | "critical";
  dateRange?: {
    start: string;
    end: string;
  };
}

// Response Types
export interface CreateCustomerResponse {
  success: boolean;
  data: Customer;
}

export interface UpdateCustomerResponse {
  success: boolean;
  data: Customer;
}

export interface GetCustomerResponse {
  success: boolean;
  data: Customer;
}

export interface GetCustomersResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  avgRevenuePerCustomer: number;
  breakdown: Array<{
    isActive: boolean;
    _count: { id: number };
    _sum: { totalRevenue: number | null; creditUsed: number | null };
  }>;
}

export interface CustomerPerformance {
  totalLoads: number;
  totalRevenue: number;
  averageLoadValue: number;
  averageMargin: number;
  recentLoads: number;
  paymentHistory: {
    onTime: number;
    late: number;
    outstanding: number;
  };
  creditUtilization: {
    used: number;
    limit: number;
    percentage: number;
    status: "good" | "warning" | "critical";
  };
  loadTrends: Array<{
    period: string;
    loads: number;
    revenue: number;
  }>;
  topLanes: Array<{
    lane: string;
    loads: number;
    revenue: number;
  }>;
}

// Customer Invoice Types
export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "PARTIAL" | "OVERDUE" | "VOID";
  invoiceDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  paymentMethod?: string;
  paymentDate?: string;
  sentAt?: string;
  viewedAt?: string;
  remindersSent: number;
  lastReminderAt?: string;
}

export interface CustomerInvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  averagePaymentDays: number;
  recentInvoices: CustomerInvoice[];
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

export interface GetCustomerInvoicesResponse {
  success: boolean;
  data: CustomerInvoice[];
  summary: CustomerInvoiceSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetCustomerPerformanceResponse {
  success: boolean;
  data: CustomerPerformance;
}

export interface GetCustomerContactsResponse {
  success: boolean;
  data: CustomerContact[];
}

// Statistics Response
export interface GetCustomerStatisticsResponse {
  success: boolean;
  data: CustomerStatistics;
}

// Customer Loads Response
export interface GetCustomerLoadsResponse {
  success: boolean;
  data: CustomerLoadData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation Schemas
export interface CustomerValidationErrors {
  companyName?: string[];
  billingEmail?: string[];
  billingPhone?: string[];
  creditLimit?: string[];
  paymentTerms?: string[];
}

export interface ContactValidationErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
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
  creditUsed?: number | string;
  totalLoads: number;
  totalRevenue: number | string;
  averageMargin?: number | string;
  isActive: boolean;
  createdAt: string;
  [key: string]: unknown;
}

// Bulk Operations
export interface BulkCustomerAction {
  action: "activate" | "deactivate" | "export" | "delete";
  customerIds: string[];
}

export interface BulkCustomerResponse {
  success: number;
  failed: number;
  errors: Array<{
    customerId: string;
    error: string;
  }>;
}
