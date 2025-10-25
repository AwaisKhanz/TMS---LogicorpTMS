"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useOptimisticNotificationRead,
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

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose?: () => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.readAt) {
      onMarkAsRead(notification.id);
    }

    // Navigate to the entity if available
    const url = getEntityUrl(notification.entityType, notification.entityId);
    if (url) {
      router.push(url);
      // Close the dropdown after navigation
      onClose?.();
    }
  };

  const isUnread = !notification.readAt;

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer relative",
        isUnread && "bg-muted/20"
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="w-1 h-full absolute left-0 top-0 rounded-r bg-primary" />
      )}

      {/* Icon */}
      <div className="flex-shrink-0 text-lg">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isUnread ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatNotificationTime(new Date(notification.createdAt))}
          </span>

          <Badge variant="outline" className="text-xs">
            {notification.type.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Fetch notifications and unread count
  const { data: notificationsData, isLoading } = useNotifications(1, 10);

  const { data: unreadCountData } = useUnreadNotificationCount();
  const { markAsReadOptimistic } = useOptimisticNotificationRead();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = unreadCountData?.data?.count || 0;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadOptimistic(notificationId);
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const hasUnread = unreadCount > 0;
  const hasNotifications = notifications.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-0" align="end" sideOffset={5}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center space-x-2">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setIsOpen(false);
                router.push("/notifications");
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : hasNotifications ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground/70 text-center mt-1">
                You&apos;ll see updates about your loads and system alerts here
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {hasNotifications && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm h-8"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/notifications");
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
