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

  // Invoice permissions
  INVOICE_VIEW: "invoice:view",
  INVOICE_CREATE: "invoice:create",
  INVOICE_SEND: "invoice:send",
  INVOICE_VOID: "invoice:void",

  // Report permissions
  REPORT_VIEW: "report:view",
  REPORT_EXPORT: "report:export",

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
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  DISPATCHER: "DISPATCHER",
  USER: "USER",
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

export const INVOICE_PERMISSIONS = [
  PERMISSIONS.INVOICE_VIEW,
  PERMISSIONS.INVOICE_CREATE,
  PERMISSIONS.INVOICE_SEND,
  PERMISSIONS.INVOICE_VOID,
] as const;

export const REPORT_PERMISSIONS = [
  PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.REPORT_EXPORT,
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
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
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

// ==================== ROLE PERMISSION MAPPING ====================
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    ...LOAD_PERMISSIONS,
    ...CARRIER_PERMISSIONS,
    ...CUSTOMER_PERMISSIONS,
    ...INVOICE_PERMISSIONS,
    ...REPORT_PERMISSIONS,
    PERMISSIONS.USER_VIEW,
  ],
  [ROLES.DISPATCHER]: [
    PERMISSIONS.LOAD_VIEW_ALL,
    PERMISSIONS.LOAD_VIEW_OWN,
    PERMISSIONS.LOAD_CREATE,
    PERMISSIONS.LOAD_EDIT,
    PERMISSIONS.CARRIER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
  [ROLES.USER]: [
    PERMISSIONS.LOAD_VIEW_OWN,
    PERMISSIONS.CARRIER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
  ],
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
