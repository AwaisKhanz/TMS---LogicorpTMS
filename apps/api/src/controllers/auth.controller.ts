import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { z } from "zod";
import type {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../types/auth.types.js";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "../utils/cookie.util.js";

const authService = new AuthService();

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organizationName: z.string().min(1, "Organization name is required"),
  phone: z.string().optional(),
}) satisfies z.ZodType<RegisterDto>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
}) satisfies z.ZodType<LoginDto>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
}) satisfies z.ZodType<RefreshTokenDto>;

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      const result = await authService.register(req.body, ipAddress, userAgent);

      // Set HTTP-only cookies
      setAccessTokenCookie(res, result.tokens.accessToken);
      setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          organization: result.organization,
          // Don't send tokens in response body (they're in cookies)
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      const result = await authService.login(req.body, ipAddress, userAgent);

      // Set HTTP-only cookies
      setAccessTokenCookie(res, result.tokens.accessToken);
      setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          organization: result.organization,
          // Don't send tokens in response body (they're in cookies)
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      const tokens = await authService.refreshToken(refreshToken);

      // Set new HTTP-only cookies
      setAccessTokenCookie(res, tokens.accessToken);
      setRefreshTokenCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          message: "Tokens refreshed successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      await authService.logout(refreshToken);

      // Clear authentication cookies
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        data: {
          message: "Logged out successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const user = await authService.getCurrentUser(
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as ForgotPasswordDto;
      const result = await authService.forgotPassword(data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as ResetPasswordDto;
      const result = await authService.resetPassword(data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerification(email);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
