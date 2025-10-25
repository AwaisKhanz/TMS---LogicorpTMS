"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface PermissionChangeHandlerProps {
  children: React.ReactNode;
}

export function PermissionChangeHandler({
  children,
}: PermissionChangeHandlerProps) {
  const { refreshAuth } = useAuth();

  useEffect(() => {
    // Listen for permission change notifications
    const handlePermissionChange = (event: CustomEvent) => {
      const notification = event.detail;

      if (notification.type === "PERMISSION_CHANGED") {
        // Show toast notification
        toast.info(notification.title, {
          description: notification.message,
          duration: 10000,
          action: {
            label: "Refresh Permissions",
            onClick: async () => {
              try {
                await refreshAuth();
                toast.success("Permissions updated successfully!");
              } catch (error) {
                console.error("Failed to refresh permissions:", error);
                toast.error(
                  "Failed to refresh permissions. Please refresh the page."
                );
              }
            },
          },
        });

        // Auto-refresh permissions after a short delay
        setTimeout(async () => {
          try {
            await refreshAuth();
          } catch (error) {
            console.error("Auto-refresh failed:", error);
          }
        }, 2000);
      }
    };

    // Listen for custom permission change events
    window.addEventListener(
      "permissionChanged",
      handlePermissionChange as EventListener
    );

    // WebSocket notifications are handled by the main WebSocket context

    return () => {
      window.removeEventListener(
        "permissionChanged",
        handlePermissionChange as EventListener
      );
    };
  }, [refreshAuth]);

  return <>{children}</>;
}

// Hook for manually triggering permission updates
export function usePermissionUpdates() {
  const { refreshAuth } = useAuth();

  const handlePermissionChange = async (notification: {
    type: string;
    title: string;
    message: string;
    addedPermissions?: string[];
    removedPermissions?: string[];
  }) => {
    if (notification.type === "PERMISSION_CHANGED") {
      // Show notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 10000,
        action: {
          label: "Refresh Permissions",
          onClick: async () => {
            try {
              await refreshAuth();
              toast.success("Permissions updated successfully!");
            } catch (error) {
              console.error("Failed to refresh permissions:", error);
              toast.error(
                "Failed to refresh permissions. Please refresh the page."
              );
            }
          },
        },
      });

      // Auto-refresh permissions
      try {
        await refreshAuth();
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }
  };

  return {
    handlePermissionChange,
    refreshPermissions: refreshAuth,
  };
}
