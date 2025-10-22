"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@tms/shared-types";

interface CanProps {
  do: string;
  on: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on resource and action permissions
 * @param do - The action to check (e.g., 'create', 'edit', 'delete', 'view')
 * @param on - The resource to check (e.g., 'load', 'carrier', 'customer')
 * @param children - The content to render if user has permission
 * @param fallback - Optional content to render if user doesn't have permission
 */
export function Can({
  do: action,
  on: resource,
  children,
  fallback = null,
}: CanProps) {
  const { hasPermission } = usePermissions();
  const permission = `${resource}:${action}` as Permission;
  const hasPermissionValue = hasPermission(permission);

  if (!hasPermissionValue) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface CanAnyProps {
  anyOf: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user has ANY of the specified permissions
 * @param anyOf - Array of permissions to check (OR logic)
 * @param children - The content to render if user has any permission
 * @param fallback - Optional content to render if user doesn't have any permission
 */
export function CanAny({ anyOf, children, fallback = null }: CanAnyProps) {
  const { hasAnyPermission } = usePermissions();
  const hasAny = hasAnyPermission(...anyOf);

  if (!hasAny) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface CanAllProps {
  allOf: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user has ALL of the specified permissions
 * @param allOf - Array of permissions to check (AND logic)
 * @param children - The content to render if user has all permissions
 * @param fallback - Optional content to render if user doesn't have all permissions
 */
export function CanAll({ allOf, children, fallback = null }: CanAllProps) {
  const { hasAllPermissions } = usePermissions();
  const hasAll = hasAllPermissions(...allOf);

  if (!hasAll) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface CanResourceProps {
  resource: string;
  actions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user can perform ANY action on a resource
 * @param resource - The resource to check
 * @param actions - Array of actions to check (OR logic)
 * @param children - The content to render if user can perform any action
 * @param fallback - Optional content to render if user can't perform any action
 */
export function CanResource({
  resource,
  actions,
  children,
  fallback = null,
}: CanResourceProps) {
  const { hasAnyPermission } = usePermissions();
  const permissions = actions.map((action) => `${resource}:${action}`);
  const hasAny = hasAnyPermission(...(permissions as Permission[]));

  if (!hasAny) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
interface CanViewProps {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user can view a resource
 */
export function CanView({ resource, children, fallback = null }: CanViewProps) {
  return (
    <Can do="view" on={resource} fallback={fallback}>
      {children}
    </Can>
  );
}

interface CanCreateProps {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user can create a resource
 */
export function CanCreate({
  resource,
  children,
  fallback = null,
}: CanCreateProps) {
  return (
    <Can do="create" on={resource} fallback={fallback}>
      {children}
    </Can>
  );
}

interface CanEditProps {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user can edit a resource
 */
export function CanEdit({ resource, children, fallback = null }: CanEditProps) {
  return (
    <Can do="edit" on={resource} fallback={fallback}>
      {children}
    </Can>
  );
}

interface CanDeleteProps {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user can delete a resource
 */
export function CanDelete({
  resource,
  children,
  fallback = null,
}: CanDeleteProps) {
  return (
    <Can do="delete" on={resource} fallback={fallback}>
      {children}
    </Can>
  );
}
