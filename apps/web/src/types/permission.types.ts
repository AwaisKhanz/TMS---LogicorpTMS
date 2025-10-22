// Re-export permission types from shared types package
export type {
  Permission,
  Role,
  PermissionCheck,
  RoleCheck,
} from "@tms/shared-types";

export {
  PERMISSIONS,
  ROLES,
  LOAD_PERMISSIONS,
  CARRIER_PERMISSIONS,
  CUSTOMER_PERMISSIONS,
  INVOICE_PERMISSIONS,
  REPORT_PERMISSIONS,
  USER_PERMISSIONS,
  SETTINGS_PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  isValidPermission,
  isValidRole,
  getPermissionsForRole,
  getRolesWithPermission,
  canAccessResource,
} from "@tms/shared-types";
