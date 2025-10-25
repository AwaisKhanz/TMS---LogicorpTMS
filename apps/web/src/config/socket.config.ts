/**
 * Socket.IO Configuration
 * Centralized configuration for Socket.IO client with environment-specific settings
 */

export interface SocketConfig {
  url: string;
  timeout: number;
  reconnection: {
    enabled: boolean;
    attempts: number;
    delay: number;
    delayMax: number;
  };
  features: {
    logging: boolean;
    debug: boolean;
    healthCheck: boolean;
  };
  events: {
    connection: string;
    disconnect: string;
    error: string;
    reconnect: string;
    reconnectFailed: string;
    reconnectAttempt: string;
    notification: {
      new: string;
      read: string;
    };
    load: {
      statusUpdate: string;
    };
    carrier: {
      update: string;
    };
  };
}

const isDevelopment = process.env.NODE_ENV === "development";

export const socketConfig: SocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000",
  timeout: 20000,
  reconnection: {
    enabled: true,
    attempts: 5,
    delay: 1000,
    delayMax: 5000,
  },
  features: {
    logging: isDevelopment,
    debug: isDevelopment,
    healthCheck: true,
  },
  events: {
    connection: "connect",
    disconnect: "disconnect",
    error: "connect_error",
    reconnect: "reconnect",
    reconnectFailed: "reconnect_failed",
    reconnectAttempt: "reconnect_attempt",
    notification: {
      new: "notification:new",
      read: "notification:read",
    },
    load: {
      statusUpdate: "load:status_update",
    },
    carrier: {
      update: "carrier:update",
    },
  },
};

// Error codes and messages
export const SocketErrorCodes = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  TIMEOUT: "TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export const SocketErrorMessages = {
  [SocketErrorCodes.CONNECTION_FAILED]: "Failed to connect to server",
  [SocketErrorCodes.AUTHENTICATION_FAILED]: "Authentication failed",
  [SocketErrorCodes.TIMEOUT]: "Connection timeout",
  [SocketErrorCodes.NETWORK_ERROR]: "Network error occurred",
  [SocketErrorCodes.SERVER_ERROR]: "Server error occurred",
} as const;

export type SocketErrorCode =
  (typeof SocketErrorCodes)[keyof typeof SocketErrorCodes];
