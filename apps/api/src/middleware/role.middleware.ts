import { Request, Response, NextFunction } from "express";
import { AuthorizationError } from "../utils/errors.util.js";

/**
 * Role-based authorization middleware
 * Checks if user has any of the required roles (OR logic)
 * @param roles - Array of roles to check
 * @returns Express middleware function
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.role) {
        throw new AuthorizationError("Authentication required");
      }

      const hasRole = roles.includes(req.auth.role);

      if (!hasRole) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${roles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Role-based authorization middleware that requires ALL roles (AND logic)
 * @param roles - Array of roles to check
 * @returns Express middleware function
 */
export const requireAllRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.role) {
        throw new AuthorizationError("Authentication required");
      }

      // For single role checking, this is the same as requireRole
      // This is here for consistency with permission middleware
      const hasRole = roles.includes(req.auth.role);

      if (!hasRole) {
        throw new AuthorizationError(
          `Access denied. Required ALL roles: ${roles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin role requirement middleware
 * @returns Express middleware function
 */
export const requireAdmin = () => {
  return requireRole("ADMIN");
};

/**
 * Manager or Admin role requirement middleware
 * @returns Express middleware function
 */
export const requireManagerOrAdmin = () => {
  return requireRole("ADMIN", "MANAGER");
};

/**
 * Dispatcher or higher role requirement middleware
 * @returns Express middleware function
 */
export const requireDispatcherOrHigher = () => {
  return requireRole("ADMIN", "MANAGER", "DISPATCHER");
};

/**
 * User or higher role requirement middleware
 * @returns Express middleware function
 */
export const requireUserOrHigher = () => {
  return requireRole("ADMIN", "MANAGER", "DISPATCHER", "USER");
};

/**
 * Role hierarchy check middleware
 * Checks if user's role is at or above the required level
 * @param requiredLevel - The minimum role level required
 * @returns Express middleware function
 */
export const requireRoleLevel = (requiredLevel: string) => {
  const roleHierarchy = {
    USER: 1,
    DISPATCHER: 2,
    MANAGER: 3,
    ADMIN: 4,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.role) {
        throw new AuthorizationError("Authentication required");
      }

      const userLevel =
        roleHierarchy[req.auth.role as keyof typeof roleHierarchy] || 0;
      const requiredUserLevel =
        roleHierarchy[requiredLevel as keyof typeof roleHierarchy] || 0;

      if (userLevel < requiredUserLevel) {
        throw new AuthorizationError(
          `Access denied. Required role level: ${requiredLevel} or higher`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
