/**
 * Debug Utility
 * Conditional logging utility that only logs in development mode
 */

import { socketConfig } from "@/config/socket.config";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogOptions {
  level?: LogLevel;
  prefix?: string;
  data?: unknown;
}

class DebugLogger {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled =
      socketConfig.features.logging && process.env.NODE_ENV === "development";
  }

  private formatMessage(message: string, options: LogOptions = {}): string {
    const { prefix = "Socket" } = options;
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    return `[${timestamp}] ${prefix}: ${message}`;
  }

  private log(level: LogLevel, message: string, options: LogOptions = {}) {
    if (!this.isEnabled) return;

    const formattedMessage = this.formatMessage(message, { ...options, level });
    const { data } = options;

    switch (level) {
      case "error":
        console.error(formattedMessage, data || "");
        break;
      case "warn":
        console.warn(formattedMessage, data || "");
        break;
      case "debug":
        if (socketConfig.features.debug) {
          console.debug(formattedMessage, data || "");
        }
        break;
      default:
        console.log(formattedMessage, data || "");
    }
  }

  info(message: string, data?: unknown) {
    this.log("info", message, { data });
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, { data });
  }

  error(message: string, data?: unknown) {
    this.log("error", message, { data });
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, { data });
  }

  // Socket-specific logging methods
  connection(message: string, data?: unknown) {
    this.info(message, { prefix: "WebSocket", data });
  }

  event(message: string, data?: unknown) {
    this.debug(message, { prefix: "Socket Event", data });
  }

  socketError(message: string, data?: unknown) {
    this.log("error", message, { prefix: "Socket Error", data });
  }

  lifecycle(message: string, data?: unknown) {
    this.info(message, { prefix: "Socket Lifecycle", data });
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Convenience exports
export const log = debugLogger.info.bind(debugLogger);
export const logWarn = debugLogger.warn.bind(debugLogger);
export const logError = debugLogger.error.bind(debugLogger);
export const logDebug = debugLogger.debug.bind(debugLogger);
export const logConnection = debugLogger.connection.bind(debugLogger);
export const logEvent = debugLogger.event.bind(debugLogger);
export const logSocketError = debugLogger.socketError.bind(debugLogger);
export const logLifecycle = debugLogger.lifecycle.bind(debugLogger);
