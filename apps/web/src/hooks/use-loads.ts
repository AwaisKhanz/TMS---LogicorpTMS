import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { ApiErrorException } from "@/types/api.types";
import type { LoadEvent, Document } from "@tms/shared-types";
import type {
  LoadFilters,
  CreateLoadRequest,
  UpdateLoadRequest,
  LoadStatus,
  DashboardStats,
  LoadStatisticsByStatus,
} from "@tms/shared-types";
import type { Load } from "@tms/shared-types";
import type { FinancialAdjustment } from "@tms/shared-types";

interface PaginatedLoadsResponse {
  success: boolean;
  data: Load[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface LoadsStatsResponse {
  success: boolean;
  data: LoadStatisticsByStatus;
}

interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

/**
 * React Query key factory for load-related queries
 * Provides consistent cache key management across the application
 */
export const loadKeys = {
  all: ["loads"] as const,
  lists: () => [...loadKeys.all, "list"] as const,
  list: (filters: LoadFilters) => [...loadKeys.lists(), filters] as const,
  details: () => [...loadKeys.all, "detail"] as const,
  detail: (id: string) => [...loadKeys.details(), id] as const,
  statistics: () => [...loadKeys.all, "statistics"] as const,
  dashboardStats: () => [...loadKeys.all, "dashboard-stats"] as const,
  events: (id: string) => [...loadKeys.detail(id), "events"] as const,
  documents: (id: string) => [...loadKeys.detail(id), "documents"] as const,
};

/**
 * Fetch paginated list of loads with filtering
 *
 * @param filters - Optional filters for status, customer, carrier, dates, search
 * @returns Query result with loads array and pagination data
 * @example
 * const { data, isLoading } = useLoads({ status: 'IN_TRANSIT', page: 1 });
 */
export function useLoads(filters: LoadFilters = {}) {
  return useQuery<PaginatedLoadsResponse>({
    queryKey: loadKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.customerId) params.append("customerId", filters.customerId);
      if (filters.carrierId) params.append("carrierId", filters.carrierId);
      if (filters.pickupDateFrom)
        params.append("pickupDateFrom", filters.pickupDateFrom.toString());
      if (filters.pickupDateTo)
        params.append("pickupDateTo", filters.pickupDateTo.toString());
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await apiClient.get<PaginatedLoadsResponse>(
        `/loads?${params.toString()}`
      );
      return response;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single load with full relations
 *
 * @param id - Load ID
 * @returns Query result with complete load data
 * @example
 * const { data: load, isLoading } = useLoad(loadId);
 */
export function useLoad(id: string | undefined) {
  return useQuery<Load>({
    queryKey: loadKeys.detail(id!),
    queryFn: async (): Promise<Load> => {
      const response = await apiClient.get<{ success: boolean; data: Load }>(
        `/loads/${id}`
      );
      return response.data as Load;
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (404, 401, 403, etc.)
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (
          axiosError.response?.status &&
          axiosError.response.status >= 400 &&
          axiosError.response.status < 500
        ) {
          return false; // Don't retry client errors
        }
      }
      // Retry up to 1 time for server errors (5xx) or network errors
      return failureCount < 1;
    },
  });
}

/**
 * Create a new load
 *
 * Automatically invalidates load lists and statistics on success
 * Shows toast notification for success/error
 *
 * @returns Mutation hook with mutate and mutateAsync
 * @example
 * const createLoad = useCreateLoad();
 * await createLoad.mutateAsync(loadData);
 */
export function useCreateLoad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLoadRequest) => {
      const response = await apiClient.post<{ success: boolean; data: Load }>(
        "/loads",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: loadKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: loadKeys.dashboardStats() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to create load"
      );
    },
  });
}

// Update load
export function useUpdateLoad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLoadRequest;
    }) => {
      const response = await apiClient.put<{ success: boolean; data: Load }>(
        `/loads/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: loadKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: loadKeys.statistics() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to update load"
      );
    },
  });
}

// Update financial adjustments
export function useUpdateFinancialAdjustments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      adjustments,
    }: {
      id: string;
      adjustments: FinancialAdjustment[];
    }) => {
      const response = await apiClient.put<{ success: boolean; data: Load }>(
        `/loads/${id}/financial-adjustments`,
        { adjustments }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loadKeys.detail(data.id) });
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to update financial adjustments"
      );
    },
  });
}

// Update load status
export function useUpdateLoadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LoadStatus }) => {
      const response = await apiClient.patch<{ success: boolean; data: Load }>(
        `/loads/${id}/status`,
        { status }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: loadKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: loadKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: loadKeys.dashboardStats() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to update load status"
      );
    },
  });
}

// Delete load
export function useDeleteLoad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/loads/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: loadKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: loadKeys.dashboardStats() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to delete load"
      );
    },
  });
}

// Duplicate load
export function useDuplicateLoad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ success: boolean; data: Load }>(
        `/loads/${id}/duplicate`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to duplicate load"
      );
    },
  });
}

// Assign carrier
export function useAssignCarrier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      carrierId,
      notes,
    }: {
      id: string;
      carrierId: string;
      notes?: string;
    }) => {
      const response = await apiClient.post<{ success: boolean; data: Load }>(
        `/loads/${id}/assign`,
        {
          carrierId,
          notes,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loadKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to assign carrier"
      );
    },
  });
}

// Fetch load statistics
export function useLoadStatistics() {
  return useQuery({
    queryKey: loadKeys.statistics(),
    queryFn: async () => {
      const response =
        await apiClient.get<LoadsStatsResponse>("/loads/statistics");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: loadKeys.dashboardStats(),
    queryFn: async () => {
      const response = await apiClient.get<DashboardStatsResponse>(
        "/loads/dashboard-stats"
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Fetch load events
export function useLoadEvents(id: string | undefined) {
  return useQuery({
    queryKey: loadKeys.events(id!),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: LoadEvent[];
      }>(`/loads/${id}/events`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch load documents
export function useLoadDocuments(id: string | undefined) {
  return useQuery({
    queryKey: loadKeys.documents(id!),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: Document[];
      }>(`/loads/${id}/documents`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useLoadDocumentsPaginated(
  id: string | undefined,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }
) {
  return useQuery({
    queryKey: [...loadKeys.documents(id!), options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.search) params.append("search", options.search);
      if (options?.type) params.append("type", options.type);

      const response = await apiClient.get<{
        success: boolean;
        data: Document[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>(`/loads/${id}/documents?${params.toString()}`);
      return response;
    },
    enabled: !!id,
  });
}
