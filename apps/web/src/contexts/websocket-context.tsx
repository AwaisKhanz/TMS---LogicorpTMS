"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { SocketManager } from "@/lib/socket-manager";
import { debugLogger } from "@/utils/debug";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { NOTIFICATION_KEYS } from "@/hooks/use-notifications";
import { socketConfig } from "@/config/socket.config";
import type { Notification } from "@tms/shared-types";

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  isConnecting: boolean;
}

interface WebSocketMessage {
  type: "notification" | "read" | "load_update" | "carrier_update" | "system";
  data?: Notification;
  notificationId?: string;
  loadId?: string;
  carrierId?: string;
  action?: string;
  status?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  // Socket lifecycle management
  useEffect(() => {
    debugLogger.lifecycle("WebSocket useEffect triggered", {
      user: !!user,
      token: !!token,
      socket: !!socket,
    });

    if (!user || !token) {
      debugLogger.lifecycle("Missing requirements, cleaning up socket");
      SocketManager.destroyInstance();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setReconnectAttempts(0);
      setIsConnecting(false);
      return;
    }

    // Get or create socket instance using SocketManager
    const socketInstance = SocketManager.getInstance(token);
    if (socketInstance && socketInstance !== socket) {
      debugLogger.lifecycle("Socket instance updated");
      setSocket(socketInstance);
    } else if (!socketInstance && socket) {
      debugLogger.lifecycle("Socket instance removed");
      setSocket(null);
    }
  }, [user, token, socket]);

  // Subscribe to SocketManager state changes
  useEffect(() => {
    const unsubscribe = SocketManager.subscribeToState((state) => {
      setIsConnected(state.isConnected);
      setIsConnecting(state.isConnecting);
      setConnectionError(state.connectionError);
      setReconnectAttempts(state.reconnectAttempts);
    });

    return unsubscribe;
  }, []);

  // Separate useEffect to handle socket events
  useEffect(() => {
    if (!socket) {
      return;
    }

    // Connection state is now managed by SocketManager
    // We only handle application-specific events here

    // Handle new notifications
    function onNotificationNew(message: WebSocketMessage) {
      try {
        if (message.type === "notification" && message.data) {
          // Check if this notification is for the current user's own actions
          // Skip showing toast notifications for actions performed by the current user
          if (
            message.data.recipientId &&
            user &&
            message.data.recipientId === user.id
          ) {
            // Still invalidate queries to update the UI, but don't show toast
            queryClient.invalidateQueries({
              queryKey: NOTIFICATION_KEYS.lists(),
            });
            queryClient.invalidateQueries({
              queryKey: NOTIFICATION_KEYS.unreadCount(),
            });
            return;
          }

          // Invalidate notification queries to refresh the UI
          queryClient.invalidateQueries({
            queryKey: NOTIFICATION_KEYS.lists(),
          });
          queryClient.invalidateQueries({
            queryKey: NOTIFICATION_KEYS.unreadCount(),
          });

          // Play notification sound (if user has sound enabled)
          try {
            const audio = new Audio("/sounds/notification.mp3");
            audio.volume = 0.3; // Lower volume to avoid being too loud
            audio.play().catch(() => {
              // Silently fail if audio cannot be played
            });
          } catch {
            // Silently fail if audio is not available
          }

          // Show toast notification
          toast.info(message.data.title, {
            description: message.data.message,
            duration: 5000,
            action: {
              label: "View",
              onClick: () => {
                // Navigate to notifications page or specific notification
                window.location.href = "/notifications";
              },
            },
          });
        } else if (message.type === "system" && message.data) {
          // Handle system-wide notifications
          toast.warning(message.data.title, {
            description: message.data.message,
            duration: 10000,
          });
        }
      } catch (error) {
        console.error("Error handling notification:", error);
      }
    }

    // Handle notification read status updates
    function onNotificationRead(message: WebSocketMessage) {
      try {
        if (message.type === "read" && message.notificationId) {
          // Update cache to reflect read status
          queryClient.invalidateQueries({
            queryKey: NOTIFICATION_KEYS.lists(),
          });
          queryClient.invalidateQueries({
            queryKey: NOTIFICATION_KEYS.unreadCount(),
          });
        }
      } catch (error) {
        console.error("Error handling notification read:", error);
      }
    }

    // Handle load status updates
    function onLoadStatusUpdate(message: WebSocketMessage) {
      try {
        if (message.type === "load_update" && message.loadId) {
          // Invalidate load-related queries
          queryClient.invalidateQueries({ queryKey: ["loads"] });

          // Show status update notification
          toast.info(`Load ${message.loadId} status updated`, {
            description: `Status changed to: ${message.status}`,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error handling load status update:", error);
      }
    }

    // Handle carrier updates
    function onCarrierUpdate(message: WebSocketMessage) {
      try {
        if (message.type === "carrier_update" && message.carrierId) {
          // Invalidate carrier-related queries
          queryClient.invalidateQueries({ queryKey: ["carriers"] });
          queryClient.invalidateQueries({ queryKey: ["carrier-statistics"] });

          // If it's a document upload, also invalidate carrier documents
          if (message.action === "document_uploaded") {
            queryClient.invalidateQueries({
              queryKey: ["carrier-documents", message.carrierId],
            });
            queryClient.refetchQueries({
              queryKey: ["carrier-documents", message.carrierId],
            });
          }

          // Don't show carrier update toast - let notifications handle it
          // The notification system will show the proper toast with "View" button
        }
      } catch (error) {
        console.error("Error handling carrier update:", error);
      }
    }

    // Set up application-specific event listeners
    debugLogger.lifecycle("Setting up application event listeners");
    socket.on(socketConfig.events.notification.new, onNotificationNew);
    socket.on(socketConfig.events.notification.read, onNotificationRead);
    socket.on(socketConfig.events.load.statusUpdate, onLoadStatusUpdate);
    socket.on(socketConfig.events.carrier.update, onCarrierUpdate);

    // Cleanup function
    return () => {
      if (socket) {
        debugLogger.lifecycle("Cleaning up application event listeners");
        socket.off(socketConfig.events.notification.new, onNotificationNew);
        socket.off(socketConfig.events.notification.read, onNotificationRead);
        socket.off(socketConfig.events.load.statusUpdate, onLoadStatusUpdate);
        socket.off(socketConfig.events.carrier.update, onCarrierUpdate);
      }
    };
  }, [socket, queryClient]);

  // Cleanup effect to disconnect socket on unmount
  useEffect(() => {
    return () => {
      debugLogger.lifecycle("Component unmounting, cleaning up socket");
      SocketManager.destroyInstance();
    };
  }, []);

  const value: WebSocketContextType = useMemo(
    () => ({
      socket,
      isConnected,
      connectionError,
      reconnectAttempts,
      isConnecting,
    }),
    [socket, isConnected, connectionError, reconnectAttempts, isConnecting]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

// Hook for sending notifications acknowledgments
export function useNotificationAcknowledge() {
  const { socket } = useWebSocket();

  const acknowledgeNotification = useCallback(
    (notificationId: string) => {
      if (socket && socket.connected) {
        debugLogger.event("Acknowledging notification", { notificationId });
        socket.emit(socketConfig.events.notification.read, notificationId);
      }
    },
    [socket]
  );

  return { acknowledgeNotification };
}
