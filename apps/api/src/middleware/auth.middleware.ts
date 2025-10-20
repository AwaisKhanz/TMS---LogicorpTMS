import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { AuthenticationError } from "../utils/errors.util.js";
import { extractToken } from "../utils/cookie.util.js";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from cookie or Authorization header
    const tokenData = extractToken(req);

    if (!tokenData) {
      throw new AuthenticationError("No authentication token provided");
    }

    // Verify token
    const payload = verifyAccessToken(tokenData.token);

    // Attach auth data to request
    req.auth = {
      userId: payload.sub,
      organizationId: payload.org,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
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
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    next();
  }
};
