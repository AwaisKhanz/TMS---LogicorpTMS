"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Search, Eye, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useOptimisticNotificationRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications";
import {
  getNotificationIcon,
  formatNotificationTime,
  type Notification,
} from "@tms/shared-types";

// Helper function to get navigation URL based on entity type and ID
const getEntityUrl = (
  entityType: string | null | undefined,
  entityId: string | null | undefined
): string | null => {
  if (!entityType || !entityId) return null;

  switch (entityType) {
    case "CUSTOMER":
      return `/customers/${entityId}`;
    case "LOAD":
      return `/loads/${entityId}`;
    case "CARRIER":
      return `/carriers/${entityId}`;
    case "INVOICE":
      return `/invoices/${entityId}`;
    case "DOCUMENT":
      return `/documents/${entityId}`;
    default:
      return null;
  }
};

// Helper function to get action buttons based on notification type
function getActionButtons(notification: Notification) {
  const { type, entityId } = notification;

  switch (type) {
    case "LOAD_STATUS_CHANGE":
    case "LOAD_ASSIGNED":
      return entityId ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`/loads/${entityId}`, "_blank")}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Load
        </Button>
      ) : null;

    case "DOCUMENT_GENERATED":
      return entityId ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`/documents/${entityId}`, "_blank")}
        >
          <FileText className="h-4 w-4 mr-1" />
          View Document
        </Button>
      ) : null;

    case "INVOICE_CREATED":
    case "PAYMENT_RECEIVED":
      return entityId ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`/invoices/${entityId}`, "_blank")}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          View Invoice
        </Button>
      ) : null;

    default:
      return null;
  }
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isSelected,
  onSelect,
}: NotificationItemProps) {
  const router = useRouter();
  const icon = getNotificationIcon(notification.type);
  const actionButtons = getActionButtons(notification);

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.readAt) {
      onMarkAsRead(notification.id);
    }

    // Navigate to the entity if available
    const url = getEntityUrl(notification.entityType, notification.entityId);
    if (url) {
      router.push(url);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-4 border rounded-lg transition-colors cursor-pointer",
        notification.readAt
          ? "bg-muted/30 border-muted"
          : "bg-background border-border hover:bg-muted/50"
      )}
      onClick={handleClick}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(notification.id, !!checked)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{icon}</span>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">{notification.title}</h3>
              {!notification.readAt && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {notification.type.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatNotificationTime(notification.createdAt)}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-1">
          {notification.message}
        </p>

        {actionButtons && (
          <div
            className="mt-3 flex space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            {actionButtons}
          </div>
        )}
      </div>

      <div
        className="flex flex-col space-y-1"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.readAt && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkAsRead(notification.id)}
            className="h-8 px-2"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(notification.id)}
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          ×
        </Button>
      </div>
    </div>
  );
}

interface NotificationListProps {
  title?: string;
  showFilters?: boolean;
}

export function NotificationList({
  title = "Notifications",
  showFilters = true,
}: NotificationListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  const { data: notificationsData, isLoading } = useNotifications(page, 20);
  const { markAsReadOptimistic } = useOptimisticNotificationRead();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.data?.notifications || [];
  const total = notificationsData?.data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  // Filter notifications by search
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(search.toLowerCase()) ||
      notification.message.toLowerCase().includes(search.toLowerCase())
  );

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadOptimistic(notificationId);
    markAsRead.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate(notificationId);
  };

  const handleSelectNotification = (id: string, selected: boolean) => {
    setSelectedNotifications((prev) =>
      selected ? [...prev, id] : prev.filter((nId) => nId !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedNotifications(
      selected ? filteredNotifications.map((n) => n.id) : []
    );
  };

  const handleBulkMarkAsRead = () => {
    selectedNotifications.forEach((id) => {
      markAsReadOptimistic(id);
      markAsRead.mutate(id);
    });
    setSelectedNotifications([]);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {total} notification{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedNotifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark Selected as Read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-1" />
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Search */}
      {showFilters && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 && (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={
                selectedNotifications.length === filteredNotifications.length
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all ({filteredNotifications.length})
            </span>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                {search
                  ? "No notifications match your search."
                  : "You're all caught up! No new notifications."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                isSelected={selectedNotifications.includes(notification.id)}
                onSelect={handleSelectNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
