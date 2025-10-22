import { Request, Response, NextFunction } from "express";
import { AuthorizationError } from "../utils/errors.util.js";

/**
 * Authorization middleware factory that checks if user has required permissions
 * @param permissions - Array of permissions to check (OR logic by default)
 * @returns Express middleware function
 */
export const authorize = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Ensure authentication middleware has run first
      if (!req.auth || !req.auth.permissions) {
        throw new AuthorizationError("Authentication required");
      }

      // Check if user has any of the required permissions (OR logic)
      const hasPermission = permissions.some((permission) =>
        req.auth!.permissions.includes(permission)
      );

      if (!hasPermission) {
        throw new AuthorizationError(
          `Access denied. Required permissions: ${permissions.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authorization middleware that requires ALL permissions (AND logic)
 * @param permissions - Array of permissions to check (AND logic)
 * @returns Express middleware function
 */
export const authorizeAll = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Ensure authentication middleware has run first
      if (!req.auth || !req.auth.permissions) {
        throw new AuthorizationError("Authentication required");
      }

      // Check if user has ALL required permissions (AND logic)
      const hasAllPermissions = permissions.every((permission) =>
        req.auth!.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new AuthorizationError(
          `Access denied. Required ALL permissions: ${permissions.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authorization middleware that requires ANY permission (OR logic)
 * This is the same as the default authorize function, but explicit
 * @param permissions - Array of permissions to check (OR logic)
 * @returns Express middleware function
 */
export const authorizeAny = (...permissions: string[]) => {
  return authorize(...permissions);
};

/**
 * Authorization middleware that checks for specific resource access
 * @param resource - The resource being accessed (e.g., 'load', 'carrier')
 * @param action - The action being performed (e.g., 'view', 'create', 'edit', 'delete')
 * @returns Express middleware function
 */
export const authorizeResource = (resource: string, action: string) => {
  const permission = `${resource}:${action}`;
  return authorize(permission);
};

/**
 * Authorization middleware that checks for resource access with multiple actions
 * @param resource - The resource being accessed
 * @param actions - Array of actions to check (OR logic)
 * @returns Express middleware function
 */
export const authorizeResourceActions = (
  resource: string,
  ...actions: string[]
) => {
  const permissions = actions.map((action) => `${resource}:${action}`);
  return authorize(...permissions);
};

/**
 * Authorization middleware that checks for admin role
 * @returns Express middleware function
 */
export const requireAdmin = () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.role) {
        throw new AuthorizationError("Authentication required");
      }

      if (req.auth.role !== "ADMIN") {
        throw new AuthorizationError("Admin access required");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authorization middleware that checks for specific roles
 * @param roles - Array of roles to check (OR logic)
 * @returns Express middleware function
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
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
 * Authorization middleware that checks for organization ownership
 * Useful for resources that belong to the user's organization
 * @returns Express middleware function
 */
export const requireOrganizationAccess = () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.organizationId) {
        throw new AuthorizationError("Authentication required");
      }

      // This middleware can be extended to check specific organization access
      // For now, it just ensures the user has an organization context
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authorization middleware that checks for resource ownership
 * @param resourceIdParam - The parameter name containing the resource ID (default: 'id')
 * @returns Express middleware function
 */
export const requireResourceOwnership = (resourceIdParam: string = "id") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.userId) {
        throw new AuthorizationError("Authentication required");
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        throw new AuthorizationError("Resource ID required");
      }

      // This middleware can be extended to check if the resource belongs to the user
      // For now, it just ensures the user is authenticated and has a resource ID
      next();
    } catch (error) {
      next(error);
    }
  };
};
