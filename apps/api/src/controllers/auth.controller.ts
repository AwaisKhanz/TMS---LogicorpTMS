import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { z } from "zod";
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../types/auth.types.js";

const authService = new AuthService();

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organizationName: z.string().min(1, "Organization name is required"),
  mcNumber: z
    .string()
    .min(2, "MC# must be at least 2 characters")
    .regex(/^[A-Za-z0-9]+$/, "MC# must contain only letters and numbers"),
  dotNumber: z
    .string()
    .min(2, "DOT# must be at least 2 characters")
    .regex(/^[A-Za-z0-9]+$/, "DOT# must contain only letters and numbers"),
  companyAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
    country: z.string().min(2, "Country is required"),
  }),
  phone: z.string().optional(),
}) satisfies z.ZodType<RegisterDto>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
}) satisfies z.ZodType<LoginDto>;

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      const result = await authService.register(req.body, ipAddress, userAgent);

      // Set httpOnly cookies for tokens
      res.cookie("tms_token", result.tokens.accessToken, {
        httpOnly: false, // Allow frontend to read the token
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: result.tokens.expiresIn * 1000, // Convert seconds to milliseconds
        path: "/",
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          organization: result.organization,
          tokens: result.tokens,
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

      // If 2FA is required, don't return tokens
      if (result.requires2FA) {
        res.status(200).json({
          success: true,
          data: {
            user: result.user,
            organization: result.organization,
            requires2FA: true,
          },
        });
        return;
      }

      // Set httpOnly cookies for tokens
      res.cookie("tms_token", result.tokens.accessToken, {
        httpOnly: false, // Allow frontend to read the token
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: result.tokens.expiresIn * 1000, // Convert seconds to milliseconds
        path: "/",
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          organization: result.organization,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      await authService.logout(req.auth.userId, req.auth.organizationId);

      // Clear httpOnly cookies
      res.clearCookie("tms_token", {
        httpOnly: false, // Allow frontend to read the token
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

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
