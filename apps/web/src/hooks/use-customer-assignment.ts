import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ApiResponse } from "@/types/api.types";

interface Customer {
  id: string;
  companyName: string;
  billingEmail: string;
  billingPhone: string;
  isActive: boolean;
}

interface AssignCustomersRequest {
  customerIds: string[];
}

export function useMemberCustomers(memberId: string) {
  return useQuery({
    queryKey: ["member-customers", memberId],
    queryFn: async (): Promise<Customer[]> => {
      const response = await apiClient.get<ApiResponse<Customer[]>>(
        `/settings/team/${memberId}/customers`
      );
      return response.data;
    },
    enabled: !!memberId,
  });
}

export function useAssignCustomers(memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignCustomersRequest): Promise<void> => {
      await apiClient.post<ApiResponse<void>>(
        `/settings/team/${memberId}/customers`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["member-customers", memberId],
      });
      queryClient.invalidateQueries({
        queryKey: ["team-members"],
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create customer";
      toast.error(message);
    },
  });
}

export function useRemoveCustomerAssignment(memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string): Promise<void> => {
      await apiClient.delete(
        `/settings/team/${memberId}/customers/${customerId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["member-customers", memberId],
      });
      queryClient.invalidateQueries({
        queryKey: ["team-members"],
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create customer";
      toast.error(message);
    },
  });
}
