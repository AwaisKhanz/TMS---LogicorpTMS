/**
 * Socket.IO Error Handling
 * Custom error types and recovery strategies for Socket.IO operations
 */

import { SocketErrorCodes, SocketErrorMessages } from "@/config/socket.config";

export class SocketError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    recoverable: boolean = true,
    retryable: boolean = true
  ) {
    super(message);
    this.name = "SocketError";
    this.code = code;
    this.recoverable = recoverable;
    this.retryable = retryable;
  }

  static fromError(
    error: Error,
    code: string = SocketErrorCodes.CONNECTION_FAILED
  ): SocketError {
    return new SocketError(
      code,
      error.message ||
        SocketErrorMessages[code as keyof typeof SocketErrorMessages],
      true,
      true
    );
  }
}

export class AuthenticationError extends SocketError {
  constructor(
    message: string = SocketErrorMessages[
      SocketErrorCodes.AUTHENTICATION_FAILED
    ]
  ) {
    super(SocketErrorCodes.AUTHENTICATION_FAILED, message, false, false);
    this.name = "AuthenticationError";
  }
}

export class ConnectionTimeoutError extends SocketError {
  constructor(message: string = SocketErrorMessages[SocketErrorCodes.TIMEOUT]) {
    super(SocketErrorCodes.TIMEOUT, message, true, true);
    this.name = "ConnectionTimeoutError";
  }
}

export class NetworkError extends SocketError {
  constructor(
    message: string = SocketErrorMessages[SocketErrorCodes.NETWORK_ERROR]
  ) {
    super(SocketErrorCodes.NETWORK_ERROR, message, true, true);
    this.name = "NetworkError";
  }
}

export class ServerError extends SocketError {
  constructor(
    message: string = SocketErrorMessages[SocketErrorCodes.SERVER_ERROR]
  ) {
    super(SocketErrorCodes.SERVER_ERROR, message, true, true);
    this.name = "ServerError";
  }
}

/**
 * Error Recovery Strategies
 */
export interface RecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  circuitBreakerThreshold: number;
}

export const defaultRecoveryStrategy: RecoveryStrategy = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  circuitBreakerThreshold: 5,
};

export class ErrorRecoveryManager {
  private retryCount = 0;
  private lastErrorTime = 0;
  private circuitBreakerOpen = false;
  private failureCount = 0;

  constructor(private strategy: RecoveryStrategy = defaultRecoveryStrategy) {}

  shouldRetry(error: SocketError): boolean {
    if (!error.retryable) {
      return false;
    }

    if (this.circuitBreakerOpen) {
      const timeSinceLastError = Date.now() - this.lastErrorTime;
      if (timeSinceLastError < this.strategy.retryDelay * 10) {
        return false;
      }
      this.circuitBreakerOpen = false;
      this.failureCount = 0;
    }

    if (this.retryCount >= this.strategy.maxRetries) {
      return false;
    }

    return true;
  }

  getRetryDelay(): number {
    if (this.strategy.exponentialBackoff) {
      return this.strategy.retryDelay * Math.pow(2, this.retryCount);
    }
    return this.strategy.retryDelay;
  }

  recordAttempt(): void {
    this.retryCount++;
  }

  recordSuccess(): void {
    this.retryCount = 0;
    this.failureCount = 0;
    this.circuitBreakerOpen = false;
  }

  recordFailure(_error: SocketError): void {
    this.lastErrorTime = Date.now();
    this.failureCount++;

    if (this.failureCount >= this.strategy.circuitBreakerThreshold) {
      this.circuitBreakerOpen = true;
    }
  }

  reset(): void {
    this.retryCount = 0;
    this.failureCount = 0;
    this.circuitBreakerOpen = false;
    this.lastErrorTime = 0;
  }
}

/**
 * Error Handler Factory
 */
export function createErrorHandler(recoveryManager: ErrorRecoveryManager) {
  return (error: Error, context: string) => {
    const socketError = SocketError.fromError(error);

    if (recoveryManager.shouldRetry(socketError)) {
      const delay = recoveryManager.getRetryDelay();
      recoveryManager.recordAttempt();

      setTimeout(() => {
        // Retry logic would be implemented here
        console.warn(`Retrying ${context} after ${delay}ms`);
      }, delay);
    } else {
      recoveryManager.recordFailure(socketError);
      console.error(`Failed to recover from ${context}:`, socketError);
    }
  };
}
