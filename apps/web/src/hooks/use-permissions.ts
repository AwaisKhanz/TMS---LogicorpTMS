import { useAuth } from "@/contexts/auth-context";
import type { Permission, Role } from "@tms/shared-types";

/**
 * Hook that provides permission checking functions
 * @returns Object with permission checking functions
 */
export function usePermissions() {
  const {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  } = useAuth();

  return {
    permissions,
    roles,
    hasPermission: (permission: Permission) => hasPermission(permission),
    hasAnyPermission: (...permissions: Permission[]) =>
      hasAnyPermission(...permissions),
    hasAllPermissions: (...permissions: Permission[]) =>
      hasAllPermissions(...permissions),
    hasRole: (role: Role) => hasRole(role),
  };
}

/**
 * Hook that checks if user has a specific permission
 * @param permission - The permission to check
 * @returns boolean indicating if user has the permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook that checks if user has any of the specified permissions
 * @param permissions - Array of permissions to check (OR logic)
 * @returns boolean indicating if user has any of the permissions
 */
export function useHasAnyPermission(...permissions: Permission[]): boolean {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(...permissions);
}

/**
 * Hook that checks if user has all of the specified permissions
 * @param permissions - Array of permissions to check (AND logic)
 * @returns boolean indicating if user has all of the permissions
 */
export function useHasAllPermissions(...permissions: Permission[]): boolean {
  const { hasAllPermissions } = useAuth();
  return hasAllPermissions(...permissions);
}

/**
 * Hook that checks if user has a specific role
 * @param role - The role to check
 * @returns boolean indicating if user has the role
 */
export function useHasRole(role: Role): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

/**
 * Hook that checks if user has any of the specified roles
 * @param roles - Array of roles to check (OR logic)
 * @returns boolean indicating if user has any of the roles
 */
export function useHasAnyRole(...roles: Role[]): boolean {
  const { hasRole } = useAuth();
  return roles.some((role) => hasRole(role));
}

/**
 * Hook that checks if user has all of the specified roles
 * @param roles - Array of roles to check (AND logic)
 * @returns boolean indicating if user has all of the roles
 */
export function useHasAllRoles(...roles: Role[]): boolean {
  const { hasRole } = useAuth();
  return roles.every((role) => hasRole(role));
}

/**
 * Hook that checks if user can access a specific resource with an action
 * @param resource - The resource to check access for
 * @param action - The action to check access for
 * @returns boolean indicating if user can access the resource with the action
 */
export function useCanAccessResource(
  resource: string,
  action: string
): boolean {
  const { hasPermission } = useAuth();
  const permission = `${resource}:${action}` as Permission;
  return hasPermission(permission);
}

/**
 * Hook that checks if user can perform multiple actions on a resource
 * @param resource - The resource to check access for
 * @param actions - Array of actions to check (OR logic)
 * @returns boolean indicating if user can perform any of the actions on the resource
 */
export function useCanAccessResourceActions(
  resource: string,
  ...actions: string[]
): boolean {
  const { hasAnyPermission } = useAuth();
  const permissions = actions.map(
    (action) => `${resource}:${action}` as Permission
  );
  return hasAnyPermission(...permissions);
}

/**
 * Hook that checks if user is admin
 * @returns boolean indicating if user is admin
 */
export function useIsAdmin(): boolean {
  const { hasRole } = useAuth();
  return hasRole("ADMIN");
}

/**
 * Hook that checks if user is manager or admin
 * @returns boolean indicating if user is manager or admin
 */
export function useIsManagerOrAdmin(): boolean {
  const { hasRole } = useAuth();
  return hasRole("ADMIN") || hasRole("MANAGER");
}

/**
 * Hook that checks if user is dispatcher or higher
 * @returns boolean indicating if user is dispatcher or higher
 */
export function useIsDispatcherOrHigher(): boolean {
  const { hasRole } = useAuth();
  return hasRole("ADMIN") || hasRole("MANAGER") || hasRole("DISPATCHER");
}
