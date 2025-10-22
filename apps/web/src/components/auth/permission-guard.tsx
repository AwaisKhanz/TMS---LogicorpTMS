"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@tms/shared-types";

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permission
 * @param permission - The permission to check
 * @param children - The content to render if user has permission
 * @param fallback - Optional content to render if user doesn't have permission
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();
  const hasPermissionValue = hasPermission(permission);

  if (!hasPermissionValue) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AnyPermissionGuardProps {
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user has ANY of the specified permissions
 * @param permissions - Array of permissions to check (OR logic)
 * @param children - The content to render if user has any permission
 * @param fallback - Optional content to render if user doesn't have any permission
 */
export function AnyPermissionGuard({
  permissions,
  children,
  fallback = null,
}: AnyPermissionGuardProps) {
  const { hasAnyPermission } = usePermissions();
  const hasAny = hasAnyPermission(...permissions);

  if (!hasAny) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AllPermissionsGuardProps {
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user has ALL of the specified permissions
 * @param permissions - Array of permissions to check (AND logic)
 * @param children - The content to render if user has all permissions
 * @param fallback - Optional content to render if user doesn't have all permissions
 */
export function AllPermissionsGuard({
  permissions,
  children,
  fallback = null,
}: AllPermissionsGuardProps) {
  const { hasAllPermissions } = usePermissions();
  const hasAll = hasAllPermissions(...permissions);

  if (!hasAll) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
