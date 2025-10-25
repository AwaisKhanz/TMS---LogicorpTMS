import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { User } from "@tms/shared-types";

interface UserDetailsResponse {
  success: boolean;
  data: User;
}

export function useUserDetails(userId: string) {
  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await apiClient.get<UserDetailsResponse>(
        `/users/${userId}`
      );
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
