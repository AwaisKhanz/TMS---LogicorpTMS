import { authService } from "./auth.service.js";
import { logger } from "../config/logger.js";

export class SessionCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  /**
   * Starts the periodic session cleanup
   */
  start(): void {
    if (this.cleanupInterval) {
      logger.warn("Session cleanup service is already running");
      return;
    }

    logger.info("Starting session cleanup service");

    // Run cleanup immediately
    this.cleanupExpiredSessions();

    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stops the periodic session cleanup
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info("Session cleanup service stopped");
    }
  }

  /**
   * Manually triggers session cleanup
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await authService.cleanupExpiredSessions();
    } catch (error) {
      logger.error("Session cleanup failed:", error);
    }
  }
}

export const sessionCleanupService = new SessionCleanupService();
