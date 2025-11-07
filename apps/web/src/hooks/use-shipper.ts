"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreateShipperRequest,
  UpdateShipperRequest,
  ShipperFilters,
  GetShippersResponse,
  GetShipperResponse,
  CreateShipperResponse,
  UpdateShipperResponse,
  ApiResponse,
  Shipper,
  ApiError,
  ShipperStatistics,
} from "@tms/shared-types";
import { toast } from "sonner";

// Fetch all shippers with filters
export function useShippers(filters?: ShipperFilters) {
  return useQuery({
    queryKey: ["shippers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get<GetShippersResponse>(
        `/shippers?${params.toString()}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single shipper by ID
export function useShipper(id: string) {
  return useQuery({
    queryKey: ["shipper", id],
    queryFn: async () => {
      const response = await apiClient.get<GetShipperResponse>(
        `/shippers/${id}`
      );
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch shipper options for dropdowns
export function useShipperOptions(): {
  shippers: Array<{
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
  const { data, isLoading, error, refetch } = useShippers({
    limit: 1000, // Get all active shippers for options
    isActive: true,
  });

  const shippers =
    data?.data?.map((shipper: Shipper) => ({
      value: shipper.id,
      label: `${shipper.companyName} - ${(shipper.address as any)?.city || ""}, ${(shipper.address as any)?.state || ""}`,
      companyName: shipper.companyName,
      city: (shipper.address as any)?.city || "",
      state: (shipper.address as any)?.state || "",
      isActive: shipper.isActive,
    })) || [];

  return {
    shippers,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Fetch shipper statistics
export function useShipperStatistics() {
  return useQuery({
    queryKey: ["shippers", "statistics"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ShipperStatistics>>(`/shippers/statistics`);
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create shipper
export function useCreateShipper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShipperRequest) => {
      const response = await apiClient.post<CreateShipperResponse>(
        "/shippers",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippers"] });
      queryClient.invalidateQueries({ queryKey: ["shippers", "statistics"] });
      toast.success("Shipper created successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to create shipper";
      toast.error(message);
    },
  });
}

// Update shipper
export function useUpdateShipper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateShipperRequest;
    }) => {
      const response = await apiClient.put<UpdateShipperResponse>(
        `/shippers/${id}`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shippers"] });
      queryClient.invalidateQueries({ queryKey: ["shipper", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["shippers", "statistics"] });
      toast.success("Shipper updated successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to update shipper";
      toast.error(message);
    },
  });
}

// Delete shipper
export function useDeleteShipper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/shippers/${id}`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippers"] });
      queryClient.invalidateQueries({ queryKey: ["shippers", "statistics"] });
      toast.success("Shipper deleted successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to delete shipper";
      toast.error(message);
    },
  });
}

// Export shippers
export function useExportShippers() {
  return useMutation({
    mutationFn: async (filters?: ShipperFilters): Promise<Blob> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(
        `/shippers/export?${params.toString()}`,
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
        `shippers-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Shippers exported successfully");
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to export shippers";
      toast.error(message);
    },
  });
}
