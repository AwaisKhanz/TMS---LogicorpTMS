import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { Notification as SharedNotification } from "@tms/shared-types";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  lastEventTime?: number;
}

interface JWTPayload {
  sub: string; // User ID
  org: string; // Organization ID
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

interface SocketUser {
  id: string;
  organizationId: string;
  socketId: string;
  connectedAt: Date;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, SocketUser[]>();
  private readonly MAX_CONNECTIONS_PER_USER = 3;
  private readonly MAX_TOTAL_CONNECTIONS = 1000;

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin,
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: "/socket.io",
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on("connection", this.handleConnection.bind(this));

    logger.info("WebSocket service initialized");
  }

  private async authenticateSocket(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      if (!decoded.sub || !decoded.org) {
        return next(new Error("Invalid token"));
      }

      socket.userId = decoded.sub;
      socket.organizationId = decoded.org;

      next();
    } catch (error) {
      logger.error("Socket authentication failed:", error);
      next(new Error("Authentication failed"));
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, organizationId } = socket;

    if (!userId || !organizationId) {
      socket.disconnect();
      return;
    }

    // Check connection limits
    if (this.connectedUsers.size >= this.MAX_TOTAL_CONNECTIONS) {
      logger.warn(
        `Maximum total connections (${this.MAX_TOTAL_CONNECTIONS}) reached`
      );
      socket.emit("error", { message: "Server at capacity" });
      socket.disconnect();
      return;
    }

    const userConnections = this.connectedUsers.get(userId) || [];
    if (userConnections.length >= this.MAX_CONNECTIONS_PER_USER) {
      logger.warn(
        `User ${userId} has reached maximum connections (${this.MAX_CONNECTIONS_PER_USER})`
      );
      socket.emit("error", { message: "Too many connections" });
      socket.disconnect();
      return;
    }

    logger.info(
      `User ${userId} connected to WebSocket from organization ${organizationId}`
    );

    // Add user to connected users map
    this.addConnectedUser(userId, organizationId, socket.id);

    // Join organization room for broadcasting
    socket.join(`org:${organizationId}`);
    socket.join(`user:${userId}`);

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      logger.info(
        `User ${userId} disconnected from WebSocket. Reason: ${reason}`
      );
      this.removeConnectedUser(userId, socket.id);
    });

    // Add socket middleware for event validation
    socket.use(([event], next) => {
      try {
        // Rate limiting check (simple implementation)
        const now = Date.now();
        if (!socket.lastEventTime) {
          socket.lastEventTime = now;
        } else if (now - socket.lastEventTime < 100) {
          // 100ms rate limit
          logger.warn(
            `Rate limit exceeded for user ${userId} on event ${event}`
          );
          return next(new Error("Rate limit exceeded"));
        }
        socket.lastEventTime = now;

        // Validate event name
        if (typeof event !== "string" || event.length === 0) {
          logger.warn(`Invalid event name from user ${userId}: ${event}`);
          return next(new Error("Invalid event name"));
        }

        next();
      } catch (error) {
        logger.error(`Socket middleware error for user ${userId}:`, error);
        next(error instanceof Error ? error : new Error("Unknown error"));
      }
    });

    // Handle notification acknowledgment with validation
    socket.on("notification:acknowledge", (notificationId: string) => {
      try {
        if (!notificationId || typeof notificationId !== "string") {
          logger.warn(
            `Invalid notification ID from user ${userId}: ${notificationId}`
          );
          return;
        }

        logger.debug(
          `User ${userId} acknowledged notification ${notificationId}`
        );
        // Could emit confirmation or update read status
      } catch (error) {
        logger.error(
          `Error handling notification acknowledgment from user ${userId}:`,
          error
        );
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });

    // Send connection confirmation
    socket.emit("connected", {
      userId,
      organizationId,
      timestamp: new Date().toISOString(),
    });
  }

  private addConnectedUser(
    userId: string,
    organizationId: string,
    socketId: string
  ): void {
    const userConnections = this.connectedUsers.get(userId) || [];
    userConnections.push({
      id: userId,
      organizationId,
      socketId,
      connectedAt: new Date(),
    });
    this.connectedUsers.set(userId, userConnections);
  }

  private removeConnectedUser(userId: string, socketId: string): void {
    const userConnections = this.connectedUsers.get(userId) || [];
    const updatedConnections = userConnections.filter(
      (conn) => conn.socketId !== socketId
    );

    if (updatedConnections.length === 0) {
      this.connectedUsers.delete(userId);
    } else {
      this.connectedUsers.set(userId, updatedConnections);
    }
  }

  // Send notification to specific user
  public sendNotificationToUser(
    userId: string,
    notification: SharedNotification
  ): void {
    if (!this.io) return;

    try {
      this.io.to(`user:${userId}`).emit("notification:new", {
        type: "notification",
        data: notification,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Sent notification ${notification.id} to user ${userId}`);
    } catch (error) {
      logger.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  // Send notification to all users in an organization
  public sendNotificationToOrganization(
    organizationId: string,
    notification: SharedNotification
  ): void {
    if (!this.io) return;

    try {
      this.io.to(`org:${organizationId}`).emit("notification:new", {
        type: "notification",
        data: notification,
        timestamp: new Date().toISOString(),
      });

      logger.debug(
        `Sent notification ${notification.id} to organization ${organizationId}`
      );
    } catch (error) {
      logger.error(
        `Error sending notification to organization ${organizationId}:`,
        error
      );
    }
  }

  // Send notification to multiple users
  public sendNotificationToUsers(
    userIds: string[],
    notification: SharedNotification
  ): void {
    if (!this.io) return;

    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Broadcast system-wide notification
  public broadcastSystemNotification(notification: SharedNotification): void {
    if (!this.io) return;

    this.io.emit("notification:system", {
      type: "system",
      data: notification,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Broadcast system notification ${notification.id}`);
  }

  // Notify about notification read status update
  public notifyNotificationRead(userId: string, notificationId: string): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit("notification:read", {
      type: "read",
      notificationId,
      timestamp: new Date().toISOString(),
    });

    logger.debug(
      `Notified user ${userId} about notification ${notificationId} read`
    );
  }

  // Send load status update
  public sendLoadStatusUpdate(
    organizationId: string,
    loadId: string,
    status: string,
    details?: Record<string, unknown>
  ): void {
    if (!this.io) return;

    this.io.to(`org:${organizationId}`).emit("load:status_update", {
      type: "load_update",
      loadId,
      status,
      details,
      timestamp: new Date().toISOString(),
    });

    logger.debug(
      `Sent load status update for load ${loadId} to organization ${organizationId}`
    );
  }

  // Send carrier update
  public sendCarrierUpdate(
    organizationId: string,
    carrierId: string,
    action: string,
    details?: Record<string, unknown>
  ): void {
    if (!this.io) return;

    this.io.to(`org:${organizationId}`).emit("carrier:update", {
      type: "carrier_update",
      carrierId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });

    logger.debug(
      `Sent carrier update for carrier ${carrierId} to organization ${organizationId}`
    );
  }

  // Send customer update
  public sendCustomerUpdate(
    organizationId: string,
    customerId: string,
    action: string,
    details?: Record<string, unknown>
  ): void {
    if (!this.io) return;

    this.io.to(`org:${organizationId}`).emit("customer:update", {
      type: "customer_update",
      customerId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });

    logger.debug(
      `Sent customer update for customer ${customerId} to organization ${organizationId}`
    );
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users for organization
  public getConnectedUsersForOrganization(organizationId: string): string[] {
    const users: string[] = [];
    this.connectedUsers.forEach((connections, userId) => {
      if (connections.some((conn) => conn.organizationId === organizationId)) {
        users.push(userId);
      }
    });
    return users;
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Broadcast to organization (generic method for real-time updates)
  public broadcastToOrganization(organizationId: string, data: any): void {
    if (!this.io) return;

    try {
      this.io.to(`org:${organizationId}`).emit("realtime:update", {
        type: "realtime_update",
        data,
        timestamp: new Date().toISOString(),
      });

      logger.debug(
        `Broadcasted real-time update to organization ${organizationId}`
      );
    } catch (error) {
      logger.error(
        `Error broadcasting to organization ${organizationId}:`,
        error
      );
    }
  }

  // Graceful shutdown
  public shutdown(): void {
    if (this.io) {
      this.io.close();
      this.connectedUsers.clear();
      logger.info("WebSocket service shut down");
    }
  }
}

export const webSocketService = new WebSocketService();
