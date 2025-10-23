// Simplified Notification Types for TMS Application
import type { ApiResponse } from "./api.types.js";
import {
  NOTIFICATION_TYPES,
  ENTITY_TYPES,
  NOTIFICATION_ICONS,
} from "@tms/shared-constants";

// ==================== CORE TYPES ====================

// Re-export constants from shared-constants
export { NOTIFICATION_TYPES, ENTITY_TYPES, NOTIFICATION_ICONS };

export type NotificationType = keyof typeof NOTIFICATION_TYPES;
export type EntityType = keyof typeof ENTITY_TYPES;

// ==================== CORE NOTIFICATION MODEL ====================

export interface Notification {
  id: string;
  organizationId: string;
  recipientId: string;

  // Content
  type: NotificationType;
  title: string;
  message: string;

  // Optional link to entity
  entityType?: EntityType | null;
  entityId?: string | null;

  // Status (simple)
  isRead: boolean;
  readAt?: Date | null;

  // Timestamps
  createdAt: Date;
}

// ==================== REQUEST/RESPONSE TYPES ====================

export interface CreateNotificationRequest {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
  sendEmail?: boolean;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
}

// ==================== API RESPONSE WRAPPERS ====================

export type NotificationApiResponse<T> = ApiResponse<T>;
export type NotificationListApiResponse = ApiResponse<NotificationListResponse>;
export type CreateNotificationApiResponse = ApiResponse<Notification>;

// ==================== WEBSOCKET TYPES ====================

export interface NotificationWebSocketEvent {
  type: "NOTIFICATION_RECEIVED" | "NOTIFICATION_READ" | "NOTIFICATION_DELETED";
  data: Notification;
  timestamp: string;
}

// ==================== UTILITY FUNCTIONS ====================

export const isValidNotificationType = (
  type: string
): type is NotificationType => {
  return Object.keys(NOTIFICATION_TYPES).includes(type as NotificationType);
};

export const getNotificationIcon = (type: NotificationType): string => {
  return NOTIFICATION_ICONS[type] || "🔔";
};

export const formatNotificationTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};
