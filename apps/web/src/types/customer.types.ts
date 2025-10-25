// Re-export from shared types
export type {
  Customer,
  CustomerContact,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateCustomerContactRequest,
  UpdateCustomerContactRequest,
  CustomerContactData,
  CustomerFilters,
  CreateCustomerResponse,
  UpdateCustomerResponse,
  GetCustomerResponse,
  GetCustomersResponse,
  Address,
} from "@tms/shared-types";

// Legacy aliases for compatibility - types are already imported above
import type {
  GetCustomersResponse,
  GetCustomerResponse,
} from "@tms/shared-types";
export type CustomersResponse = GetCustomersResponse;
export type CustomerResponse = GetCustomerResponse;
