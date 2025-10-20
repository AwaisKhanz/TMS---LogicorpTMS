import { Router } from "express";
import {
  AuthController,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  authRateLimiter,
  passwordResetLimiter,
} from "../middleware/rate-limit.middleware.js";
import { verifyCsrf } from "../middleware/csrf.middleware.js";
import { z } from "zod";

const router = Router();
const authController = new AuthController();

// Validation schemas
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Public routes
router.post(
  "/register",
  authRateLimiter,
  verifyCsrf,
  validateRequest(registerSchema),
  authController.register
);
router.post(
  "/login",
  authRateLimiter,
  verifyCsrf,
  validateRequest(loginSchema),
  authController.login
);
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);
router.post(
  "/logout",
  validateRequest(refreshTokenSchema),
  authController.logout
);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  verifyCsrf,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  verifyCsrf,
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

// Email verification routes
router.post(
  "/verify-email",
  verifyCsrf,
  validateRequest(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  "/resend-verification",
  verifyCsrf,
  validateRequest(resendVerificationSchema),
  authController.resendVerification
);

// Protected routes
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
