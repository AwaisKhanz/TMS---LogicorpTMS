/**
 * Socket.IO Performance Optimizations
 * Debouncing, memoization, and lazy initialization utilities
 */

import { useCallback, useMemo, useRef } from "react";
import { Socket } from "socket.io-client";
import { debugLogger } from "@/utils/debug";

/**
 * Debounce utility for socket operations
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Throttle utility for socket operations
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

/**
 * Connection Quality Monitor
 */
export class ConnectionQualityMonitor {
  private pingTimes: number[] = [];
  private maxPingHistory = 10;
  private qualityScore = 100;

  constructor(private socket: Socket) {
    this.setupPingMonitoring();
  }

  private setupPingMonitoring(): void {
    this.socket.on("pong", (latency: number) => {
      this.recordPing(latency);
    });
  }

  private recordPing(latency: number): void {
    this.pingTimes.push(latency);
    if (this.pingTimes.length > this.maxPingHistory) {
      this.pingTimes.shift();
    }

    this.calculateQualityScore();
  }

  private calculateQualityScore(): void {
    if (this.pingTimes.length === 0) return;

    const avgPing =
      this.pingTimes.reduce((a, b) => a + b, 0) / this.pingTimes.length;

    // Quality score based on ping time
    if (avgPing < 50) this.qualityScore = 100;
    else if (avgPing < 100) this.qualityScore = 80;
    else if (avgPing < 200) this.qualityScore = 60;
    else if (avgPing < 500) this.qualityScore = 40;
    else this.qualityScore = 20;

    debugLogger.debug("Connection quality updated", {
      avgPing,
      qualityScore: this.qualityScore,
      pingHistory: this.pingTimes.length,
    });
  }

  getQualityScore(): number {
    return this.qualityScore;
  }

  getAveragePing(): number {
    if (this.pingTimes.length === 0) return 0;
    return this.pingTimes.reduce((a, b) => a + b, 0) / this.pingTimes.length;
  }

  isConnectionGood(): boolean {
    return this.qualityScore >= 60;
  }

  ping(): void {
    this.socket.emit("ping");
  }
}

/**
 * Event Listener Registry for cleanup
 */
export class EventListenerRegistry {
  private listeners: Map<
    string,
    Array<{ event: string; handler: (...args: unknown[]) => void }>
  > = new Map();

  register(
    socketId: string,
    event: string,
    handler: (...args: unknown[]) => void
  ): void {
    if (!this.listeners.has(socketId)) {
      this.listeners.set(socketId, []);
    }

    this.listeners.get(socketId)!.push({ event, handler });
  }

  cleanup(socketId: string): void {
    const socketListeners = this.listeners.get(socketId);
    if (socketListeners) {
      debugLogger.debug(
        `Cleaning up ${socketListeners.length} event listeners for socket ${socketId}`
      );
      this.listeners.delete(socketId);
    }
  }

  cleanupAll(): void {
    debugLogger.debug(
      `Cleaning up all event listeners (${this.listeners.size} sockets)`
    );
    this.listeners.clear();
  }
}

/**
 * Performance-optimized socket hook
 */
export function useOptimizedSocket(socket: Socket | null) {
  const registryRef = useRef(new EventListenerRegistry());
  const qualityMonitorRef = useRef<ConnectionQualityMonitor | null>(null);

  // Memoized socket state
  const socketState = useMemo(
    () => ({
      isConnected: socket?.connected || false,
      id: socket?.id || null,
      transport: socket?.io?.engine?.transport?.name || "unknown",
    }),
    [socket?.connected, socket?.id, socket?.io?.engine?.transport?.name]
  );

  // Debounced connection quality check
  const checkConnectionQuality = useCallback(() => {
    const debouncedCheck = debounce(() => {
      if (qualityMonitorRef.current) {
        const quality = qualityMonitorRef.current.getQualityScore();
        debugLogger.debug("Connection quality check", { quality });
      }
    }, 5000);
    debouncedCheck();
  }, [qualityMonitorRef]);

  // Throttled ping
  const ping = useCallback(() => {
    const throttledPing = throttle(() => {
      if (qualityMonitorRef.current) {
        qualityMonitorRef.current.ping();
      }
    }, 1000);
    throttledPing();
  }, [qualityMonitorRef]);

  // Initialize quality monitor when socket changes
  useMemo(() => {
    if (socket && !qualityMonitorRef.current) {
      qualityMonitorRef.current = new ConnectionQualityMonitor(socket);
      debugLogger.debug("Connection quality monitor initialized");
    } else if (!socket && qualityMonitorRef.current) {
      qualityMonitorRef.current = null;
      debugLogger.debug("Connection quality monitor destroyed");
    }
  }, [socket]);

  // Cleanup on unmount
  useCallback(() => {
    return () => {
      if (socket?.id) {
        registryRef.current.cleanup(socket.id);
      }
      qualityMonitorRef.current = null;
    };
  }, [socket?.id]);

  return {
    socketState,
    checkConnectionQuality,
    ping,
    registry: registryRef.current,
  };
}

/**
 * Lazy socket initialization
 */
export function useLazySocket(shouldConnect: boolean, token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef(false);

  const initializeSocket = useCallback(() => {
    if (!shouldConnect || !token || isInitializedRef.current) {
      return socketRef.current;
    }

    debugLogger.debug("Lazy socket initialization triggered");
    isInitializedRef.current = true;

    // Socket initialization would happen here
    // This is a placeholder for the actual implementation

    return socketRef.current;
  }, [shouldConnect, token]);

  const destroySocket = useCallback(() => {
    if (socketRef.current) {
      debugLogger.debug("Lazy socket destruction triggered");
      socketRef.current = null;
      isInitializedRef.current = false;
    }
  }, []);

  return {
    socket: socketRef.current,
    initializeSocket,
    destroySocket,
    isInitialized: isInitializedRef.current,
  };
}
