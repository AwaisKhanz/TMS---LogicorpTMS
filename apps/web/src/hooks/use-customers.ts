"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LoadCustomer, CustomerOption } from "@tms/shared-types";

interface CustomersResponse {
  success: boolean;
  data: LoadCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers", "options"],
    queryFn: async () => {
      const response = await apiClient.get<CustomersResponse>("/customers");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerOptions(): {
  customers: CustomerOption[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useCustomers();

  return {
    customers:
      data?.map(
        (customer): CustomerOption => ({
          id: customer.id,
          name: customer.companyName,
          value: customer.id,
          label: customer.companyName,
        })
      ) || [],
    isLoading,
    error,
  };
}
