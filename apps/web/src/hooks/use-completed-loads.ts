import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Load } from "@tms/shared-types";

export interface CompletedLoadsResponse {
  data: Load[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CompletedLoadsFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export const completedLoadKeys = {
  all: ["completed-loads"] as const,
  list: (filters: CompletedLoadsFilters) => [...completedLoadKeys.all, "list", filters] as const,
};

/**
 * Fetch completed loads for invoice/accounting page
 *
 * @param filters - Optional filters for pagination and search
 * @returns Query result with completed loads array and pagination data
 * @example
 * const { data, isLoading } = useCompletedLoads({ page: 1, limit: 20 });
 */
export function useCompletedLoads(filters: CompletedLoadsFilters = {}) {
  return useQuery<CompletedLoadsResponse>({
    queryKey: completedLoadKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.search) params.append("search", filters.search);

      const response = await apiClient.get<CompletedLoadsResponse>(
        `/loads/completed?${params.toString()}`
      );
      return response;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
