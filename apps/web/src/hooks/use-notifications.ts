import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { ApiErrorException } from "@/types/api.types";
import type {
  Notification,
  NotificationListResponse,
  CreateNotificationRequest,
} from "@tms/shared-types";

// Response types
interface NotificationApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

// Query keys
export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  lists: () => [...NOTIFICATION_KEYS.all, "list"] as const,
  list: (page: number, limit: number) =>
    [...NOTIFICATION_KEYS.lists(), page, limit] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, "unread-count"] as const,
};

// Hook to fetch notifications
export function useNotifications(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page, limit),
    queryFn: async (): Promise<
      NotificationApiResponse<NotificationListResponse>
    > => {
      const response = await apiClient.get<
        NotificationApiResponse<NotificationListResponse>
      >(`/notifications?page=${page}&limit=${limit}`);
      return response;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Hook to get unread notification count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: async (): Promise<UnreadCountResponse> => {
      const response = await apiClient.get<UnreadCountResponse>(
        "/notifications/unread-count"
      );
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to create a notification
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateNotificationRequest
    ): Promise<NotificationApiResponse<Notification>> => {
      const response = await apiClient.post<
        NotificationApiResponse<Notification>
      >("/notifications", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_KEYS.unreadCount(),
      });
      toast.success("Notification sent successfully");
    },
    onError: (error: ApiErrorException) => {
      toast.error(error.message || "Failed to send notification");
    },
  });
}

// Hook to mark notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_KEYS.unreadCount(),
      });
    },
    onError: (error: ApiErrorException) => {
      toast.error(error.message || "Failed to mark notification as read");
    },
  });
}

// Hook to mark all notifications as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ count: number }> => {
      const response = await apiClient.patch<
        NotificationApiResponse<{ count: number }>
      >("/notifications/read-all");
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_KEYS.unreadCount(),
      });
      toast.success(`Marked ${data.count} notifications as read`);
    },
    onError: (error: ApiErrorException) => {
      toast.error(error.message || "Failed to mark notifications as read");
    },
  });
}

// Hook to delete a notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      await apiClient.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_KEYS.unreadCount(),
      });
      toast.success("Notification deleted");
    },
    onError: (error: ApiErrorException) => {
      toast.error(error.message || "Failed to delete notification");
    },
  });
}

// Optimistic update hook for marking as read
export function useOptimisticNotificationRead() {
  const queryClient = useQueryClient();

  const markAsReadOptimistic = (notificationId: string) => {
    queryClient.setQueryData(
      NOTIFICATION_KEYS.lists(),
      (
        oldData: NotificationApiResponse<NotificationListResponse> | undefined
      ) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            notifications: oldData.data.notifications.map((notification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true, readAt: new Date() }
                : notification
            ),
          },
        };
      }
    );

    // Update unread count optimistically
    queryClient.setQueryData(
      NOTIFICATION_KEYS.unreadCount(),
      (oldData: UnreadCountResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: { count: Math.max(0, oldData.data.count - 1) },
        };
      }
    );
  };

  return { markAsReadOptimistic };
}
