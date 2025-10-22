import express from "express";
import path from "path";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { StorageHealthResponse } from "../types/storage.types.js";

/**
 * Static file serving middleware for local development
 * Serves uploaded files from the local uploads directory
 */
export function staticFilesMiddleware() {
  if (config.storage.type !== "local") {
    logger.info("Static file serving disabled - using S3 storage");
    return (
      _req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      next();
    };
  }

  const uploadsDir = config.storage.local.uploadDir;
  const publicUrl = config.storage.local.publicUrl;

  logger.info(`Serving static files from: ${uploadsDir}`);
  logger.info(`Public URL: ${publicUrl}`);

  // Serve static files from uploads directory
  return express.static(uploadsDir, {
    // Set appropriate headers for file downloads
    setHeaders: (res, filePath) => {
      // Set cache headers for better performance
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache

      // Set appropriate content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
      };

      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }

      // Set CORS headers for cross-origin requests
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    },
  });
}

/**
 * Health check endpoint for file storage
 */
export function storageHealthCheck() {
  return (_req: express.Request, res: express.Response) => {
    const storageType = config.storage.type;
    const status: StorageHealthResponse = {
      storage: {
        type: storageType,
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
    };

    if (storageType === "local") {
      status.storage = {
        ...status.storage,
        uploadDir: config.storage.local.uploadDir,
        publicUrl: config.storage.local.publicUrl,
      };
    } else if (storageType === "s3") {
      status.storage = {
        ...status.storage,
        bucket: config.storage.s3.bucket,
        region: config.storage.s3.region,
        publicUrl: config.storage.s3.publicUrl || "auto-generated",
      };
    }

    res.json({
      success: true,
      data: status,
    });
  };
}
