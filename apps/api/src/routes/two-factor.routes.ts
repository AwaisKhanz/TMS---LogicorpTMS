import { Router } from "express";
import {
  TwoFactorController,
  setup2FASchema,
  enable2FASchema,
  disable2FASchema,
  verify2FASchema,
} from "../controllers/two-factor.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { twoFactorRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();
const twoFactorController = new TwoFactorController();

// All 2FA routes require authentication
router.use(authenticate);

// Setup 2FA - Generate QR code
router.post(
  "/setup",
  validateRequest(setup2FASchema),
  twoFactorController.setup
);

// Enable 2FA - Verify first token
router.post(
  "/enable",
  twoFactorRateLimiter,
  validateRequest(enable2FASchema),
  twoFactorController.enable
);

// Disable 2FA
router.post(
  "/disable",
  twoFactorRateLimiter,
  validateRequest(disable2FASchema),
  twoFactorController.disable
);

// Verify 2FA token
router.post(
  "/verify",
  twoFactorRateLimiter,
  validateRequest(verify2FASchema),
  twoFactorController.verify
);

export default router;
