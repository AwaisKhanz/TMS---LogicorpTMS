"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreateConsigneeRequest,
  UpdateConsigneeRequest,
  ConsigneeFilters,
  BulkConsigneeAction,
  BulkConsigneeResponse,
  GetConsigneesResponse,
  GetConsigneeResponse,
  CreateConsigneeResponse,
  UpdateConsigneeResponse,
  ApiResponse,
  ApiError,
  ConsigneeStatistics,
} from "@tms/shared-types";
import { toast } from "sonner";

// Fetch all consignees with filters
export function useConsignees(filters?: ConsigneeFilters) {
  return useQuery({
    queryKey: ["consignees", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get<GetConsigneesResponse>(
        `/consignees?${params.toString()}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single consignee by ID
export function useConsignee(id: string) {
  return useQuery({
    queryKey: ["consignee", id],
    queryFn: async () => {
      const response = await apiClient.get<GetConsigneeResponse>(
        `/consignees/${id}`
      );
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch consignee options for dropdowns
export function useConsigneeOptions(): {
  consignees: Array<{
    value: string;
    label: string;
    companyName: string;
    city: string;
    state: string;
    isActive: boolean;
  }>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data, isLoading, error, refetch } = useConsignees({
    limit: 1000, // Get all active consignees for options
    isActive: true,
  });

  const consignees =
    data?.data?.map((consignee) => ({
      value: consignee.id,
      label: `${consignee.companyName} - ${consignee.city}, ${consignee.state}`,
      companyName: consignee.companyName,
      city: consignee.city,
      state: consignee.state,
      isActive: consignee.isActive,
    })) || [];

  return {
    consignees,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Fetch consignee statistics
export function useConsigneeStatistics() {
  return useQuery({
    queryKey: ["consignees", "statistics"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ConsigneeStatistics>>(
        `/consignees/statistics`
      );
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create consignee
export function useCreateConsignee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConsigneeRequest) => {
      const response = await apiClient.post<CreateConsigneeResponse>(
        "/consignees",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignees"] });
      queryClient.invalidateQueries({ queryKey: ["consignees", "statistics"] });
      toast.success("Consignee created successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to create consignee";
      toast.error(message);
    },
  });
}

// Update consignee
export function useUpdateConsignee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConsigneeRequest;
    }) => {
      const response = await apiClient.put<UpdateConsigneeResponse>(
        `/consignees/${id}`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["consignees"] });
      queryClient.invalidateQueries({ queryKey: ["consignee", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["consignees", "statistics"] });
      toast.success("Consignee updated successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to update consignee";
      toast.error(message);
    },
  });
}

// Delete consignee
export function useDeleteConsignee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/consignees/${id}`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignees"] });
      queryClient.invalidateQueries({ queryKey: ["consignees", "statistics"] });
      toast.success("Consignee deleted successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to delete consignee";
      toast.error(message);
    },
  });
}

// Bulk update consignees
export function useBulkUpdateConsignees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: BulkConsigneeAction) => {
      const response = await apiClient.post<BulkConsigneeResponse>(
        "/consignees/bulk/update",
        action
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignees"] });
      queryClient.invalidateQueries({ queryKey: ["consignees", "statistics"] });
      toast.success("Consignees updated successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to update consignees";
      toast.error(message);
    },
  });
}

// Bulk delete consignees
export function useBulkDeleteConsignees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consigneeIds: string[]) => {
      const response = await apiClient.post<BulkConsigneeResponse>(
        "/consignees/bulk/delete",
        { consigneeIds }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignees"] });
      queryClient.invalidateQueries({ queryKey: ["consignees", "statistics"] });
      toast.success("Consignees deleted successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to delete consignees";
      toast.error(message);
    },
  });
}

// Export consignees
export function useExportConsignees() {
  return useMutation({
    mutationFn: async (filters?: ConsigneeFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(
        `/consignees/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );
      return response as Blob;
    },
    onSuccess: (response: Blob) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `consignees-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Consignees exported successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to export consignees";
      toast.error(message);
    },
  });
}
