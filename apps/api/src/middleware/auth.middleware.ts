import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { AuthenticationError } from "../utils/errors.util.js";
import { extractToken } from "../utils/cookie.util.js";
import prisma from "../config/database.js";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const tokenData = extractToken(req);

    if (!tokenData) {
      throw new AuthenticationError("No authentication token provided");
    }

    // Verify token
    const payload = verifyAccessToken(tokenData.token);

    // Check if session exists in database (for permission invalidation)
    const session = await prisma.session.findFirst({
      where: {
        token: tokenData.token,
        userId: payload.sub,
        expiresAt: { gt: new Date() }, // Session not expired
      },
    });

    if (!session) {
      throw new AuthenticationError("Session expired or invalid");
    }

    // Get user from database to check email verification status
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { emailVerified: true },
    });

    // Attach auth data to request
    req.auth = {
      userId: payload.sub,
      organizationId: payload.org,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      emailVerified: user?.emailVerified ?? false,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      req.auth = {
        userId: payload.sub,
        organizationId: payload.org,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        emailVerified: false, // Default to false for optional auth
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    next();
  }
};
