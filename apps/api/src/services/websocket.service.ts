import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { Notification as SharedNotification } from "@tms/shared-types";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

interface JWTPayload {
  userId: string;
  organizationId: string;
  [key: string]: unknown;
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

  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      if (!decoded.userId || !decoded.organizationId) {
        return next(new Error("Invalid token"));
      }

      socket.userId = decoded.userId;
      socket.organizationId = decoded.organizationId;

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

    logger.info(`User ${userId} connected to WebSocket from organization ${organizationId}`);

    // Add user to connected users map
    this.addConnectedUser(userId, organizationId, socket.id);

    // Join organization room for broadcasting
    socket.join(`org:${organizationId}`);
    socket.join(`user:${userId}`);

    // Handle disconnect
    socket.on("disconnect", () => {
      logger.info(`User ${userId} disconnected from WebSocket`);
      this.removeConnectedUser(userId, socket.id);
    });

    // Handle notification acknowledgment
    socket.on("notification:acknowledge", (notificationId: string) => {
      logger.debug(`User ${userId} acknowledged notification ${notificationId}`);
      // Could emit confirmation or update read status
    });

    // Send connection confirmation
    socket.emit("connected", {
      userId,
      organizationId,
      timestamp: new Date().toISOString(),
    });
  }

  private addConnectedUser(userId: string, organizationId: string, socketId: string): void {
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
    const updatedConnections = userConnections.filter(conn => conn.socketId !== socketId);

    if (updatedConnections.length === 0) {
      this.connectedUsers.delete(userId);
    } else {
      this.connectedUsers.set(userId, updatedConnections);
    }
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: string, notification: SharedNotification): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit("notification:new", {
      type: "notification",
      data: notification,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Sent notification ${notification.id} to user ${userId}`);
  }

  // Send notification to all users in an organization
  public sendNotificationToOrganization(organizationId: string, notification: SharedNotification): void {
    if (!this.io) return;

    this.io.to(`org:${organizationId}`).emit("notification:new", {
      type: "notification",
      data: notification,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Sent notification ${notification.id} to organization ${organizationId}`);
  }

  // Send notification to multiple users
  public sendNotificationToUsers(userIds: string[], notification: SharedNotification): void {
    if (!this.io) return;

    userIds.forEach(userId => {
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

    logger.debug(`Notified user ${userId} about notification ${notificationId} read`);
  }

  // Send load status update
  public sendLoadStatusUpdate(organizationId: string, loadId: string, status: string, details?: Record<string, unknown>): void {
    if (!this.io) return;

    this.io.to(`org:${organizationId}`).emit("load:status_update", {
      type: "load_update",
      loadId,
      status,
      details,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Sent load status update for load ${loadId} to organization ${organizationId}`);
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users for organization
  public getConnectedUsersForOrganization(organizationId: string): string[] {
    const users: string[] = [];
    this.connectedUsers.forEach((connections, userId) => {
      if (connections.some(conn => conn.organizationId === organizationId)) {
        users.push(userId);
      }
    });
    return users;
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
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