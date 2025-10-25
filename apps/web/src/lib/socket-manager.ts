/**
 * SocketManager - Singleton Pattern Implementation
 * Ensures only one Socket.IO instance exists throughout the application
 */

"use client";

import { io, Socket } from "socket.io-client";
import { socketConfig, SocketErrorCodes } from "@/config/socket.config";
import { debugLogger } from "@/utils/debug";
import {
  SocketError,
  ErrorRecoveryManager,
  createErrorHandler,
} from "./socket-errors";

export interface SocketManagerState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
}

export class SocketManager {
  private static instance: Socket | null = null;
  private static isInitializing = false;
  private static currentToken: string | null = null;
  private static state: SocketManagerState = {
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    reconnectAttempts: 0,
  };
  private static stateListeners: Set<(state: SocketManagerState) => void> =
    new Set();
  private static recoveryManager = new ErrorRecoveryManager();
  private static errorHandler = createErrorHandler(
    SocketManager.recoveryManager
  );

  /**
   * Get or create socket instance
   */
  static getInstance(token: string): Socket | null {
    if (!token) {
      debugLogger.warn("No token provided for socket creation");
      return null;
    }

    // If we already have an instance with the same token, return it
    if (this.instance && this.currentToken === token) {
      debugLogger.debug("Returning existing socket instance");
      return this.instance;
    }

    // If we're already initializing, wait for completion
    if (this.isInitializing) {
      debugLogger.debug("Socket initialization in progress, waiting...");
      return null;
    }

    // Clean up existing instance if token changed
    if (this.instance && this.currentToken !== token) {
      debugLogger.lifecycle("Token changed, destroying existing socket");
      this.destroyInstance();
    }

    return this.createInstance(token);
  }

  /**
   * Create new socket instance
   */
  private static createInstance(token: string): Socket | null {
    if (this.isInitializing) {
      debugLogger.debug("Already initializing socket, skipping");
      return null;
    }

    this.isInitializing = true;
    this.updateState({ isConnecting: true, connectionError: null });

    try {
      debugLogger.lifecycle("Creating new socket instance", {
        token: token.substring(0, 20) + "...",
      });

      const socket = io(socketConfig.url, {
        auth: { token },
        autoConnect: true,
        reconnection: socketConfig.reconnection.enabled,
        reconnectionAttempts: socketConfig.reconnection.attempts,
        reconnectionDelay: socketConfig.reconnection.delay,
        reconnectionDelayMax: socketConfig.reconnection.delayMax,
        timeout: socketConfig.timeout,
        forceNew: false,
      });

      this.setupEventListeners(socket);
      this.instance = socket;
      this.currentToken = token;
      this.isInitializing = false;

      debugLogger.lifecycle("Socket instance created successfully");
      return socket;
    } catch (error) {
      this.isInitializing = false;
      const socketError = SocketError.fromError(
        error as Error,
        SocketErrorCodes.CONNECTION_FAILED
      );
      this.updateState({
        isConnecting: false,
        connectionError: socketError.message,
      });
      this.errorHandler(error as Error, "socket creation");
      return null;
    }
  }

  /**
   * Setup socket event listeners
   */
  private static setupEventListeners(socket: Socket): void {
    const { events } = socketConfig;

    socket.on(events.connection, () => {
      debugLogger.connection("Connected successfully");
      this.updateState({
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        reconnectAttempts: 0,
      });
    });

    socket.on(events.disconnect, (reason: string) => {
      debugLogger.connection("Disconnected", { reason });
      this.updateState({ isConnected: false });
    });

    socket.on(events.error, (error: Error) => {
      debugLogger.error("Connection error", error);
      const socketError = SocketError.fromError(
        error,
        SocketErrorCodes.CONNECTION_FAILED
      );
      this.updateState({
        isConnecting: false,
        connectionError: socketError.message,
      });
      this.errorHandler(error, "connection");
    });

    socket.on(events.reconnect, (attemptNumber: number) => {
      debugLogger.connection("Reconnected successfully", { attemptNumber });
      this.recoveryManager.recordSuccess();
      this.updateState({
        isConnected: true,
        connectionError: null,
        reconnectAttempts: 0,
      });
    });

    socket.on(events.reconnectFailed, () => {
      debugLogger.error("Reconnection failed");
      this.updateState({
        isConnected: false,
        connectionError: "Reconnection failed",
      });
    });

    socket.on(events.reconnectAttempt, (attemptNumber: number) => {
      debugLogger.connection("Reconnection attempt", { attemptNumber });
      this.updateState({ reconnectAttempts: attemptNumber });
    });
  }

  /**
   * Update authentication token for existing socket
   */
  static updateAuth(token: string): void {
    if (!this.instance || !token) {
      debugLogger.warn("Cannot update auth: no socket instance or token");
      return;
    }

    if (this.currentToken === token) {
      debugLogger.debug("Token unchanged, skipping auth update");
      return;
    }

    debugLogger.lifecycle("Updating socket authentication", {
      oldToken: this.currentToken?.substring(0, 20) + "...",
      newToken: token.substring(0, 20) + "...",
    });

    this.currentToken = token;
    this.instance.auth = { token };
  }

  /**
   * Destroy socket instance
   */
  static destroyInstance(): void {
    if (this.instance) {
      debugLogger.lifecycle("Destroying socket instance");
      this.instance.disconnect();
      this.instance = null;
      this.currentToken = null;
      this.isInitializing = false;
      this.updateState({
        isConnected: false,
        isConnecting: false,
        connectionError: null,
        reconnectAttempts: 0,
      });
    }
  }

  /**
   * Get current socket instance
   */
  static getCurrentInstance(): Socket | null {
    return this.instance;
  }

  /**
   * Get current state
   */
  static getState(): SocketManagerState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  static subscribeToState(
    listener: (state: SocketManagerState) => void
  ): () => void {
    this.stateListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Update state and notify listeners
   */
  private static updateState(updates: Partial<SocketManagerState>): void {
    this.state = { ...this.state, ...updates };
    this.stateListeners.forEach((listener) => listener(this.state));
  }

  /**
   * Check if socket is available
   */
  static isAvailable(): boolean {
    return this.instance !== null;
  }

  /**
   * Check if socket is connected
   */
  static isConnected(): boolean {
    return this.instance?.connected || false;
  }

  /**
   * Force reconnection
   */
  static reconnect(): void {
    if (this.instance) {
      debugLogger.lifecycle("Forcing socket reconnection");
      this.instance.disconnect();
      this.instance.connect();
    }
  }
}
