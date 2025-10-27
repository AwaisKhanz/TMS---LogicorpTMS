// Permission and Role Types for TMS Application

// ==================== PERMISSION CONSTANTS ====================
export const PERMISSIONS = {
  // Load permissions
  LOAD_VIEW_ALL: "load:view:all",
  LOAD_VIEW_OWN: "load:view:own",
  LOAD_CREATE: "load:create",
  LOAD_EDIT: "load:edit",
  LOAD_DELETE: "load:delete",

  // Carrier permissions
  CARRIER_VIEW: "carrier:view",
  CARRIER_CREATE: "carrier:create",
  CARRIER_EDIT: "carrier:edit",
  CARRIER_DELETE: "carrier:delete",

  // Customer permissions
  CUSTOMER_VIEW: "customer:view",
  CUSTOMER_CREATE: "customer:create",
  CUSTOMER_EDIT: "customer:edit",
  CUSTOMER_DELETE: "customer:delete",

  // Consignee permissions
  CONSIGNEE_VIEW: "consignee:view",
  CONSIGNEE_CREATE: "consignee:create",
  CONSIGNEE_EDIT: "consignee:edit",
  CONSIGNEE_DELETE: "consignee:delete",

  // Shipper permissions
  SHIPPER_VIEW: "shipper:view",
  SHIPPER_CREATE: "shipper:create",
  SHIPPER_EDIT: "shipper:edit",
  SHIPPER_DELETE: "shipper:delete",

  // Invoice permissions
  INVOICE_VIEW: "invoice:view",
  INVOICE_CREATE: "invoice:create",
  INVOICE_SEND: "invoice:send",
  INVOICE_VOID: "invoice:void",
  INVOICE_EDIT: "invoice:edit",
  INVOICE_DELETE: "invoice:delete",
  // Report permissions
  REPORT_VIEW: "report:view",
  REPORT_EXPORT: "report:export",
  REPORT_CREATE: "report:create",
  REPORT_EDIT: "report:edit",
  REPORT_DELETE: "report:delete",
  // User permissions
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_EDIT: "user:edit",
  USER_DELETE: "user:delete",

  // Settings permissions
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",
} as const;

// ==================== ROLE CONSTANTS ====================
export const ROLES = {
  ADMINISTRATOR: "ADMINISTRATOR",
  MANAGER: "MANAGER",
  DISPATCHER: "DISPATCHER",
  VIEWER: "VIEWER",
  INVOICES: "INVOICES",
} as const;

// ==================== PERMISSION GROUPS ====================
export const LOAD_PERMISSIONS = [
  PERMISSIONS.LOAD_VIEW_ALL,
  PERMISSIONS.LOAD_VIEW_OWN,
  PERMISSIONS.LOAD_CREATE,
  PERMISSIONS.LOAD_EDIT,
  PERMISSIONS.LOAD_DELETE,
] as const;

export const CARRIER_PERMISSIONS = [
  PERMISSIONS.CARRIER_VIEW,
  PERMISSIONS.CARRIER_CREATE,
  PERMISSIONS.CARRIER_EDIT,
  PERMISSIONS.CARRIER_DELETE,
] as const;

export const CUSTOMER_PERMISSIONS = [
  PERMISSIONS.CUSTOMER_VIEW,
  PERMISSIONS.CUSTOMER_CREATE,
  PERMISSIONS.CUSTOMER_EDIT,
  PERMISSIONS.CUSTOMER_DELETE,
] as const;

export const CONSIGNEE_PERMISSIONS = [
  PERMISSIONS.CONSIGNEE_VIEW,
  PERMISSIONS.CONSIGNEE_CREATE,
  PERMISSIONS.CONSIGNEE_EDIT,
  PERMISSIONS.CONSIGNEE_DELETE,
] as const;

export const SHIPPER_PERMISSIONS = [
  PERMISSIONS.SHIPPER_VIEW,
  PERMISSIONS.SHIPPER_CREATE,
  PERMISSIONS.SHIPPER_EDIT,
  PERMISSIONS.SHIPPER_DELETE,
] as const;

export const INVOICE_PERMISSIONS = [
  PERMISSIONS.INVOICE_VIEW,
  PERMISSIONS.INVOICE_CREATE,
  PERMISSIONS.INVOICE_SEND,
  PERMISSIONS.INVOICE_VOID,
  PERMISSIONS.INVOICE_EDIT,
  PERMISSIONS.INVOICE_DELETE,
] as const;

export const REPORT_PERMISSIONS = [
  PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.REPORT_EXPORT,
  PERMISSIONS.REPORT_CREATE,
  PERMISSIONS.REPORT_EDIT,
  PERMISSIONS.REPORT_DELETE,
] as const;

export const USER_PERMISSIONS = [
  PERMISSIONS.USER_VIEW,
  PERMISSIONS.USER_CREATE,
  PERMISSIONS.USER_EDIT,
  PERMISSIONS.USER_DELETE,
] as const;

export const SETTINGS_PERMISSIONS = [
  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.SETTINGS_EDIT,
] as const;

// ==================== TYPE DEFINITIONS ====================
// Flatten the PERMISSIONS object to get all permission values
type FlattenPermissions<T> = T extends string
  ? T
  : T extends Record<string, any>
    ? {
        [K in keyof T]: FlattenPermissions<T[K]>;
      }[keyof T]
    : never;

export type Permission = FlattenPermissions<typeof PERMISSIONS>;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// Permission checking types
export type PermissionCheck = {
  permission: Permission;
  resource?: string;
  action?: string;
};

export type RoleCheck = {
  role: Role;
  anyOf?: Role[];
  allOf?: Role[];
};

// ==================== PERMISSION UTILITIES ====================
export const hasPermission = (
  userPermissions: string[],
  requiredPermission: Permission
): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

export const hasAllPermissions = (
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

export const hasRole = (userRoles: string[], requiredRole: Role): boolean => {
  return userRoles.includes(requiredRole);
};

export const hasAnyRole = (
  userRoles: string[],
  requiredRoles: Role[]
): boolean => {
  return requiredRoles.some((role) => userRoles.includes(role));
};

export const hasAllRoles = (
  userRoles: string[],
  requiredRoles: Role[]
): boolean => {
  return requiredRoles.every((role) => userRoles.includes(role));
};

// Helper function to flatten permissions object
const flattenPermissions = (obj: any): string[] => {
  const result: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      result.push(value);
    } else if (typeof value === "object") {
      result.push(...flattenPermissions(value));
    }
  }
  return result;
};

// Get all flattened permissions
const ALL_PERMISSIONS = flattenPermissions(PERMISSIONS);

// ==================== ROLE PERMISSION MAPPING ====================
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMINISTRATOR]: ALL_PERMISSIONS as Permission[],
  [ROLES.MANAGER]: [
    ...LOAD_PERMISSIONS,
    ...CARRIER_PERMISSIONS,
    PERMISSIONS.CUSTOMER_VIEW,
    ...CONSIGNEE_PERMISSIONS,
    ...SHIPPER_PERMISSIONS,
    ...REPORT_PERMISSIONS,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ] as Permission[],
  [ROLES.DISPATCHER]: [
    PERMISSIONS.LOAD_VIEW_ALL,
    PERMISSIONS.LOAD_VIEW_OWN,
    PERMISSIONS.LOAD_CREATE,
    PERMISSIONS.LOAD_EDIT,
    PERMISSIONS.CARRIER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    ...CONSIGNEE_PERMISSIONS,
    ...SHIPPER_PERMISSIONS,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ] as Permission[],
  [ROLES.VIEWER]: [
    PERMISSIONS.LOAD_VIEW_ALL,
    PERMISSIONS.LOAD_VIEW_OWN,
    PERMISSIONS.CARRIER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CONSIGNEE_VIEW,
    PERMISSIONS.SHIPPER_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
  ] as Permission[],
  [ROLES.INVOICES]: [
    ...INVOICE_PERMISSIONS,
    PERMISSIONS.LOAD_VIEW_ALL,
    PERMISSIONS.LOAD_VIEW_OWN,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CARRIER_VIEW,
    PERMISSIONS.CONSIGNEE_VIEW,
    PERMISSIONS.SHIPPER_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
  ] as Permission[],
};

// ==================== PERMISSION VALIDATION ====================
export const isValidPermission = (
  permission: string
): permission is Permission => {
  return Object.values(PERMISSIONS).includes(permission as Permission);
};

export const isValidRole = (role: string): role is Role => {
  return Object.values(ROLES).includes(role as Role);
};

// ==================== PERMISSION HELPERS ====================
export const getPermissionsForRole = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const getRolesWithPermission = (permission: Permission): Role[] => {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, permissions]) => permissions.includes(permission))
    .map(([role]) => role as Role);
};

export const canAccessResource = (
  userPermissions: string[],
  resource: string,
  action: string
): boolean => {
  const permissionString = `${resource}:${action}`;
  return userPermissions.includes(permissionString);
};
