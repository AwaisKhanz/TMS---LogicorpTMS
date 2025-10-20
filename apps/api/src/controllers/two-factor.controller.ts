import { Request, Response, NextFunction } from "express";
import { twoFactorService } from "../services/two-factor.service.js";
import { z } from "zod";

export const setup2FASchema = z.object({
  // No body needed, userId from auth middleware
});

export const enable2FASchema = z.object({
  token: z.string().length(6, "2FA token must be 6 digits"),
});

export const disable2FASchema = z.object({
  token: z.string().length(6, "2FA token must be 6 digits"),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, "2FA token must be 6 digits"),
});

export class TwoFactorController {
  async setup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const result = await twoFactorService.generateSecret(
        req.auth.userId,
        req.auth.email
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async enable(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { token } = req.body;
      const result = await twoFactorService.enable2FA(req.auth.userId, token);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async disable(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { token } = req.body;
      const result = await twoFactorService.disable2FA(req.auth.userId, token);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { token } = req.body;
      const isValid = await twoFactorService.verifyUserToken(
        req.auth.userId,
        token
      );

      res.json({
        success: true,
        data: { valid: isValid },
      });
    } catch (error) {
      next(error);
    }
  }
}
