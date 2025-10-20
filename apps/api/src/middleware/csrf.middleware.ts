import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Simple CSRF token middleware (alternative to csurf package which is deprecated)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * Generate CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Middleware to generate and send CSRF token
 */
export const csrfToken = (req: Request, res: Response, next: NextFunction) => {
  const token = generateCsrfToken();
  const sessionId =
    req.cookies?.sessionId || crypto.randomBytes(16).toString("hex");

  // Store token with 1 hour expiration
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  // Set session cookie if not exists
  if (!req.cookies?.sessionId) {
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });
  }

  // Send CSRF token in response header
  res.setHeader("X-CSRF-Token", token);

  // Also attach to response locals for easy access
  res.locals.csrfToken = token;

  next();
};

/**
 * Middleware to verify CSRF token
 */
export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const sessionId = req.cookies?.sessionId;
  const providedToken = req.headers["x-csrf-token"] as string;

  if (!sessionId || !providedToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: "CSRF_ERROR",
        message: "CSRF token missing",
      },
    });
  }

  const storedData = csrfTokens.get(sessionId);

  if (!storedData) {
    return res.status(403).json({
      success: false,
      error: {
        code: "CSRF_ERROR",
        message: "CSRF token not found",
      },
    });
  }

  // Check expiration
  if (Date.now() > storedData.expiresAt) {
    csrfTokens.delete(sessionId);
    return res.status(403).json({
      success: false,
      error: {
        code: "CSRF_ERROR",
        message: "CSRF token expired",
      },
    });
  }

  // Verify token
  if (storedData.token !== providedToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: "CSRF_ERROR",
        message: "Invalid CSRF token",
      },
    });
  }

  next();
};

// Clean up expired tokens periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [sessionId, data] of csrfTokens.entries()) {
      if (now > data.expiresAt) {
        csrfTokens.delete(sessionId);
      }
    }
  },
  15 * 60 * 1000
); // Every 15 minutes
