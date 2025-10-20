import { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";
import { AuthenticationError } from "../utils/errors.util.js";

/**
 * Middleware to check if user's email is verified
 * Use this on routes that require email verification
 */
export const requireEmailVerification = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.auth) {
      throw new AuthenticationError("Authentication required");
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return _res.status(403).json({
        success: false,
        error: {
          code: "EMAIL_NOT_VERIFIED",
          message: "Please verify your email address to access this feature",
          details: {
            emailVerified: false,
          },
        },
      });
    }

    // Email is verified, continue
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional email verification check
 * Adds emailVerified flag to req.auth but doesn't block
 */
export const checkEmailVerification = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (req.auth) {
      const user = await prisma.user.findUnique({
        where: { id: req.auth.userId },
      });

      if (user && req.auth) {
        req.auth = {
          ...req.auth,
          emailVerified: user.emailVerified,
        } as any;
      }
    }

    next();
  } catch (error) {
    // Don't fail request if check fails
    next();
  }
};
