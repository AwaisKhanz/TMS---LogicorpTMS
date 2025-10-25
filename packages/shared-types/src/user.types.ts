// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  organizationId: string;
  twoFactorEnabled?: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
  assignedCustomers?: Customer[];
}

// Import Customer type
import { Customer } from "./customer.types";

// User Request Types (DTOs)
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
  customerIds?: string[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
  customerIds?: string[];
}

export interface UserFilters {
  isActive?: boolean;
  search?: string;
  organizationId?: string;
}

// User Response Types
export interface CreateUserResponse {
  user: User;
}

export interface UpdateUserResponse {
  user: User;
}

export interface GetUserResponse {
  user: User;
}

export interface GetUsersResponse {
  users: User[];
}

export interface DeleteUserResponse {
  message: string;
}

// Customer Assignment Types
export interface AssignCustomersRequest {
  userId: string;
  customerIds: string[];
}

export interface AssignCustomersResponse {
  message: string;
  assignedCustomers: Customer[];
}

export interface GetUserCustomersResponse {
  customers: Customer[];
}

export interface UserCustomerAssignment {
  userId: string;
  customerId: string;
  customer: Customer;
}
