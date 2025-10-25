"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type {
  Carrier,
  CarrierWithLoads,
  CarrierDocument,
  CarrierContact,
  CreateCarrierRequest,
  UpdateCarrierRequest,
  CreateCarrierContactRequest,
  GetCarriersResponse,
  GetCarrierLoadsResponse,
  CarrierPerformance,
  CarrierOption,
} from "@tms/shared-types";
import type { ApiErrorException } from "@/types/api.types";
import type { ApiResponse } from "@tms/shared-types";

export function useCarriers(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["carriers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get<GetCarriersResponse>(
        `/carriers?${params.toString()}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCarrierOptions(): {
  carriers: CarrierOption[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useCarriers();

  return {
    carriers:
      data?.data.map(
        (carrier: Carrier): CarrierOption => ({
          id: carrier.id,
          name: carrier.companyName,
          mcNumber: carrier.mcNumber,
          value: carrier.id,
          label: `${carrier.companyName} (${carrier.mcNumber})`,
        })
      ) || [],
    isLoading,
    error,
  };
}

export function useCarrierDocuments(carrierId: string) {
  return useQuery({
    queryKey: ["carrier-documents", carrierId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CarrierDocument[]>>(
        `/carriers/${carrierId}/documents`
      );
      return response.data;
    },
    enabled: !!carrierId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get single carrier
export function useCarrier(id: string | undefined) {
  return useQuery<CarrierWithLoads>({
    queryKey: ["carriers", id],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: CarrierWithLoads;
      }>(`/carriers/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// Create carrier
export function useCreateCarrier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCarrierRequest) => {
      const response = await apiClient.post<{
        success: boolean;
        data: Carrier;
      }>("/carriers", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to create carrier"
      );
    },
  });
}

// Update carrier
export function useUpdateCarrier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCarrierRequest;
    }) => {
      const response = await apiClient.put<{ success: boolean; data: Carrier }>(
        `/carriers/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      queryClient.invalidateQueries({ queryKey: ["carriers", data.id] });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to update carrier"
      );
    },
  });
}

// Delete carrier
export function useDeleteCarrier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/carriers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      toast.success("Carrier deleted successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to delete carrier"
      );
    },
  });
}

// Approve carrier
export function useApproveCarrier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<{
        success: boolean;
        data: Carrier;
      }>(`/carriers/${id}/approve`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      queryClient.invalidateQueries({ queryKey: ["carriers", data.id] });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to approve carrier"
      );
    },
  });
}

// Carrier contacts
export function useCarrierContacts(carrierId: string) {
  return useQuery({
    queryKey: ["carrier-contacts", carrierId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: CarrierContact[];
      }>(`/carriers/${carrierId}/contacts`);
      return response.data;
    },
    enabled: !!carrierId,
    staleTime: 60 * 1000,
  });
}

// Add carrier contact
export function useAddCarrierContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      carrierId,
      data,
    }: {
      carrierId: string;
      data: CreateCarrierContactRequest;
    }) => {
      const response = await apiClient.post<{
        success: boolean;
        data: CarrierContact;
      }>(`/carriers/${carrierId}/contacts`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["carrier-contacts", variables.carrierId],
      });
      toast.success("Contact added successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to add contact"
      );
    },
  });
}

// Delete carrier contact
export function useDeleteCarrierContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      carrierId,
      contactId,
    }: {
      carrierId: string;
      contactId: string;
    }) => {
      await apiClient.delete(`/carriers/${carrierId}/contacts/${contactId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["carrier-contacts", variables.carrierId],
      });
      toast.success("Contact deleted successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to delete contact"
      );
    },
  });
}

// Carrier loads
export function useCarrierLoads(
  carrierId: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ["carrier-loads", carrierId, page, limit],
    queryFn: async () => {
      const response = await apiClient.get<GetCarrierLoadsResponse>(
        `/carriers/${carrierId}/loads?page=${page}&limit=${limit}`
      );
      return response;
    },
    enabled: !!carrierId,
    staleTime: 2 * 60 * 1000,
  });
}

// Carrier performance
export function useCarrierPerformance(carrierId: string) {
  return useQuery({
    queryKey: ["carrier-performance", carrierId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: CarrierPerformance;
      }>(`/carriers/${carrierId}/performance`);
      return response.data;
    },
    enabled: !!carrierId,
    staleTime: 5 * 60 * 1000,
  });
}

// Carrier statistics
export function useCarrierStatistics() {
  return useQuery({
    queryKey: ["carrier-statistics"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          total: number;
          approved: number;
          pending: number;
          active: number;
          inactive: number;
          expiringInsurance: number;
          avgRating: number;
          avgOnTimeDelivery: number;
        };
      }>("/carriers/statistics");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Export carriers
export function useExportCarriers() {
  return useMutation({
    mutationFn: async (
      filters: Record<string, unknown> & { format: string }
    ) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get(
        `/carriers/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );
      return response;
    },
    onSuccess: (data, variables) => {
      // Create download link
      const blob = new Blob([data as BlobPart], {
        type:
          variables.format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carriers-${Date.now()}.${variables.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Carriers exported successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to export carriers"
      );
    },
  });
}

// Bulk approve carriers
export function useBulkApproveCarriers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carrierIds: string[]) => {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          successful: string[];
          failed: { id: string; error: string }[];
        };
      }>("/carriers/bulk-approve", { carrierIds });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      if (data.failed.length > 0) {
        toast.warning(
          `${data.successful.length} carriers approved, ${data.failed.length} failed`
        );
      } else {
        toast.success(
          `${data.successful.length} carriers approved successfully`
        );
      }
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to approve carriers"
      );
    },
  });
}

// Bulk delete carriers
export function useBulkDeleteCarriers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carrierIds: string[]) => {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          successful: string[];
          failed: { id: string; error: string }[];
        };
      }>("/carriers/bulk-delete", { carrierIds });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      if (data.failed.length > 0) {
        toast.warning(
          `${data.successful.length} carriers deleted, ${data.failed.length} failed`
        );
      } else {
        toast.success(
          `${data.successful.length} carriers deleted successfully`
        );
      }
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to delete carriers"
      );
    },
  });
}

// Insurance alerts
export function useInsuranceAlerts(days: number = 30) {
  return useQuery({
    queryKey: ["insurance-alerts", days],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: Array<{
          carrierId: string;
          carrierName: string;
          mcNumber: string;
          insuranceExpiry: string;
          daysUntilExpiry: number;
          insuranceAmount: number;
          alertLevel: "GREEN" | "YELLOW" | "RED" | "EXPIRED";
        }>;
      }>(`/carriers/insurance-alerts?days=${days}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
