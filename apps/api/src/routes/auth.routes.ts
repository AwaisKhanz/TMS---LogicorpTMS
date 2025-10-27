import { Router } from "express";
import {
  AuthController,
  registerSchema,
  loginSchema,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  authRateLimiter,
  passwordResetLimiter,
} from "../middleware/rate-limit.middleware.js";
import { z } from "zod";

const router: Router = Router();
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

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Public routes
router.post(
  "/register",
  authRateLimiter,
  validateRequest(registerSchema),
  authController.register
);
router.post(
  "/login",
  authRateLimiter,
  validateRequest(loginSchema),
  authController.login
);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

// Email verification routes
router.post(
  "/verify-email",
  validateRequest(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  "/resend-verification",
  validateRequest(resendVerificationSchema),
  authController.resendVerification
);

router.post(
  "/accept-invitation",
  authRateLimiter,
  validateRequest(acceptInvitationSchema),
  authController.acceptInvitation
);

router.get("/validate-invitation", authController.validateInvitation);

// Protected routes
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
