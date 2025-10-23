"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { NOTIFICATION_KEYS } from "@/hooks/use-notifications";
import type { Notification } from "@tms/shared-types";

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
}

interface WebSocketMessage {
  type: "notification" | "read" | "load_update" | "system";
  data?: Notification;
  notificationId?: string;
  loadId?: string;
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

  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const connectSocket = useCallback(() => {
    if (!token || !user) return;

    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
      {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      }
    );

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    newSocket.on("connected", (data) => {
      console.log("WebSocket authentication successful:", data);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setIsConnected(false);

      if (reason === "io server disconnect") {
        // Server initiated disconnect, reconnect manually
        setTimeout(() => newSocket.connect(), 1000);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setConnectionError(error.message);
      setReconnectAttempts((prev) => prev + 1);
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
      setReconnectAttempts(attemptNumber);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
      toast.success("Connection restored");
    });

    newSocket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
      setConnectionError("Failed to reconnect to server");
      toast.error("Connection lost. Please refresh the page.");
    });

    // Handle new notifications
    newSocket.on("notification:new", (message: WebSocketMessage) => {
      if (message.type === "notification" && message.data) {
        // Invalidate notification queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_KEYS.unreadCount(),
        });

        // Play notification sound (if user has sound enabled)
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 0.3; // Lower volume to avoid being too loud
          audio.play().catch((error) => {
            console.log("Could not play notification sound:", error);
          });
        } catch (error) {
          console.log("Notification sound not available:", error);
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
    });

    // Handle notification read status updates
    newSocket.on("notification:read", (message: WebSocketMessage) => {
      if (message.type === "read" && message.notificationId) {
        // Update cache to reflect read status
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_KEYS.unreadCount(),
        });
      }
    });

    // Handle load status updates
    newSocket.on("load:status_update", (message: WebSocketMessage) => {
      if (message.type === "load_update" && message.loadId) {
        // Invalidate load-related queries
        queryClient.invalidateQueries({ queryKey: ["loads"] });

        // Show status update notification
        toast.info(`Load ${message.loadId} status updated`, {
          description: `Status changed to: ${message.status}`,
          duration: 3000,
        });
      }
    });

    setSocket(newSocket);

    return newSocket;
  }, [token, user, queryClient]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setReconnectAttempts(0);
    }
  }, [socket]);

  useEffect(() => {
    if (user && token) {
      const newSocket = connectSocket();

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      disconnectSocket();
    }
  }, [user, token, connectSocket, disconnectSocket]);

  // Handle visibility change to reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        user &&
        token &&
        !isConnected &&
        !socket
      ) {
        connectSocket();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isConnected, socket, user, token, connectSocket]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
  };

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
        socket.emit("notification:acknowledge", notificationId);
      }
    },
    [socket]
  );

  return { acknowledgeNotification };
}
