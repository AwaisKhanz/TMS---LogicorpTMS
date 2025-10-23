import rateLimit from "express-rate-limit";

// Skip rate limiting in development
const isDevelopment = process.env.NODE_ENV === "development";

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 0 : 100, // 0 = unlimited in development
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip entirely in development
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 0 : 5, // 0 = unlimited in development, 5 in production
  message: "Too many login attempts, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: () => isDevelopment, // Skip entirely in development
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 0 : 3, // 0 = unlimited in development, 3 in production
  message: "Too many password reset attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip entirely in development
});

// Rate limiter for two-factor authentication verification
export const twoFactorRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 0 : 5, // 0 = unlimited in development, 5 in production
  message: "Too many 2FA verification attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed verification attempts
  skip: () => isDevelopment, // Skip entirely in development
});
