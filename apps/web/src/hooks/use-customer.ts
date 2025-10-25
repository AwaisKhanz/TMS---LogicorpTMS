"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CreateCustomerContactRequest,
  UpdateCustomerContactRequest,
  BulkCustomerAction,
  BulkCustomerResponse,
  GetCustomersResponse,
  GetCustomerResponse,
  GetCustomerInvoicesResponse,
  GetCustomerContactsResponse,
  GetCustomerPerformanceResponse,
  GetCustomerStatisticsResponse,
  GetCustomerLoadsResponse,
  CreateCustomerResponse,
  UpdateCustomerResponse,
  CreateCustomerContactResponse,
  UpdateCustomerContactResponse,
  ApiResponse,
} from "@tms/shared-types";
import { toast } from "sonner";

// Fetch all customers with filters
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get<GetCustomersResponse>(
        `/customers?${params.toString()}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single customer by ID
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const response = await apiClient.get<GetCustomerResponse>(
        `/customers/${id}`
      );
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await apiClient.post<CreateCustomerResponse>(
        "/customers",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create customer";
      toast.error(message);
    },
  });
}

// Update customer
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCustomerRequest) => {
      const response = await apiClient.put<UpdateCustomerResponse>(
        `/customers/${id}`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update customer";
      toast.error(message);
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/customers/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete customer";
      toast.error(message);
    },
  });
}

// Customer Statistics
export function useCustomerStatistics() {
  return useQuery({
    queryKey: ["customer-statistics"],
    queryFn: async () => {
      const response = await apiClient.get<GetCustomerStatisticsResponse>(
        "/customers/statistics"
      );
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Customer Performance
export function useCustomerPerformance(customerId: string) {
  return useQuery({
    queryKey: ["customer-performance", customerId],
    queryFn: async () => {
      const response = await apiClient.get<GetCustomerPerformanceResponse>(
        `/customers/${customerId}/performance`
      );
      console.log(response);
      return response;
    },
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Customer Loads
export function useCustomerLoads(
  customerId: string,
  page: number = 1,
  limit: number = 50
) {
  return useQuery({
    queryKey: ["customer-loads", customerId, page, limit],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<GetCustomerLoadsResponse>
      >(`/customers/${customerId}/loads?page=${page}&limit=${limit}`);
      return response;
    },
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000,
  });
}

// Customer Invoices
export function useCustomerInvoices(
  customerId: string,
  page: number = 1,
  limit: number = 50
) {
  return useQuery({
    queryKey: ["customer-invoices", customerId, page, limit],
    queryFn: async () => {
      const response = await apiClient.get<GetCustomerInvoicesResponse>(
        `/customers/${customerId}/invoices?page=${page}&limit=${limit}`
      );
      return response;
    },
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000,
  });
}

// Customer Contacts
export function useCustomerContacts(customerId: string) {
  return useQuery({
    queryKey: ["customer-contacts", customerId],
    queryFn: async () => {
      const response = await apiClient.get<GetCustomerContactsResponse>(
        `/customers/${customerId}/contacts`
      );
      return response;
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
}

// Create Customer Contact
export function useCreateCustomerContact(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerContactRequest) => {
      const response = await apiClient.post<CreateCustomerContactResponse>(
        `/customers/${customerId}/contacts`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-contacts", customerId],
      });
      toast.success("Contact added successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to add contact";
      toast.error(message);
    },
  });
}

// Update Customer Contact
export function useUpdateCustomerContact(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      data,
    }: {
      contactId: string;
      data: UpdateCustomerContactRequest;
    }) => {
      const response = await apiClient.put<UpdateCustomerContactResponse>(
        `/customers/${customerId}/contacts/${contactId}`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contacts"] });
      toast.success("Contact updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update contact";
      toast.error(message);
    },
  });
}

// Delete Customer Contact
export function useDeleteCustomerContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await apiClient.delete(
        `/customers/contacts/${contactId}`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contacts"] });
      toast.success("Contact deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete contact";
      toast.error(message);
    },
  });
}

// Bulk Customer Operations
export function useBulkUpdateCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCustomerAction) => {
      const response = await apiClient.post<BulkCustomerResponse>(
        "/customers/bulk-update",
        data
      );
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`${data.success} customers updated successfully`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} customers failed to update`);
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update customers";
      toast.error(message);
    },
  });
}

// Export Customers
export function useExportCustomers() {
  return useMutation({
    mutationFn: async (filters?: CustomerFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(
        `/customers/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );
      return response as Blob;
    },
    onSuccess: (data: Blob) => {
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `customers-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Customers exported successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to export customers";
      toast.error(message);
    },
  });
}

// Validate Credit Limit
export function useValidateCreditLimit() {
  return useMutation({
    mutationFn: async ({
      customerId,
      amount,
    }: {
      customerId: string;
      amount: number;
    }) => {
      const response = await apiClient.post(
        `/customers/${customerId}/validate-credit`,
        { amount }
      );
      return response;
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Credit validation failed";
      toast.error(message);
    },
  });
}
