import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";
import routes from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { rateLimiter } from "./middleware/rate-limit.middleware.js";
import {
  staticFilesMiddleware,
  storageHealthCheck,
} from "./middleware/static-files.middleware.js";
import { webSocketService } from "./services/websocket.service.js";
import { sessionCleanupService } from "./services/session-cleanup.service.js";

const app: express.Application = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());

// Cookie parser middleware (must be before routes)
app.use(cookieParser());

// CORS configuration (allow credentials for cookies)
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use("/api/", rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging in development
if (config.env === "development") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Static file serving for local development
app.use("/uploads", staticFilesMiddleware());

// Storage health check endpoint
app.get("/api/v1/health/storage", storageHealthCheck());

// API routes
app.use("/api/v1", routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize WebSocket service
webSocketService.initialize(httpServer);

// Start session cleanup service
sessionCleanupService.start();

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║   TMS API Server                         ║
║                                          ║
║   Environment: ${config.env.padEnd(28)}║
║   Port: ${PORT.toString().padEnd(33)}║
║   URL: ${config.apiUrl.padEnd(34)}║
║   WebSocket: Enabled                     ║
║                                          ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  webSocketService.shutdown();
  sessionCleanupService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  webSocketService.shutdown();
  sessionCleanupService.stop();
  process.exit(0);
});

export default app;
