"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LoadCustomer } from "@tms/shared-types";

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
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await apiClient.get<CustomersResponse>("/customers");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerOptions() {
  const { data, isLoading, error } = useCustomers();

  return {
    customers:
      data?.map((customer) => ({
        id: customer.id,
        name: customer.companyName,
        value: customer.id,
        label: customer.companyName,
      })) || [],
    isLoading,
    error,
  };
}
