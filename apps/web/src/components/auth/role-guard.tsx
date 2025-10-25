"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Role } from "@tms/shared-types";
import { ROLES } from "@tms/shared-types";

interface RoleGuardProps {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * @param role - The role to check
 * @param children - The content to render if user has role
 * @param fallback - Optional content to render if user doesn't have role
 */
export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { hasRole } = usePermissions();
  const hasRoleValue = hasRole(role);

  if (!hasRoleValue) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AnyRoleGuardProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user has ANY of the specified roles
 * @param roles - Array of roles to check (OR logic)
 * @param children - The content to render if user has any role
 * @param fallback - Optional content to render if user doesn't have any role
 */
export function AnyRoleGuard({
  roles,
  children,
  fallback = null,
}: AnyRoleGuardProps) {
  const { hasRole } = usePermissions();
  const hasAny = roles.some((role) => hasRole(role));

  if (!hasAny) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AllRolesGuardProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user has ALL of the specified roles
 * @param roles - Array of roles to check (AND logic)
 * @param children - The content to render if user has all roles
 * @param fallback - Optional content to render if user doesn't have all roles
 */
export function AllRolesGuard({
  roles,
  children,
  fallback = null,
}: AllRolesGuardProps) {
  const { hasRole } = usePermissions();
  const hasAll = roles.every((role) => hasRole(role));

  if (!hasAll) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user is admin
 * @param children - The content to render if user is admin
 * @param fallback - Optional content to render if user is not admin
 */
export function AdminGuard({ children, fallback = null }: AdminGuardProps) {
  const { hasRole } = usePermissions();
  const isAdmin = hasRole(ROLES.ADMINISTRATOR);

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ManagerOrAdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user is manager or admin
 * @param children - The content to render if user is manager or admin
 * @param fallback - Optional content to render if user is not manager or admin
 */
export function ManagerOrAdminGuard({
  children,
  fallback = null,
}: ManagerOrAdminGuardProps) {
  const { hasRole } = usePermissions();
  const isManagerOrAdmin =
    hasRole(ROLES.ADMINISTRATOR) || hasRole(ROLES.MANAGER);

  if (!isManagerOrAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface DispatcherOrHigherGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user is dispatcher or higher
 * @param children - The content to render if user is dispatcher or higher
 * @param fallback - Optional content to render if user is not dispatcher or higher
 */
export function DispatcherOrHigherGuard({
  children,
  fallback = null,
}: DispatcherOrHigherGuardProps) {
  const { hasRole } = usePermissions();
  const isDispatcherOrHigher =
    hasRole(ROLES.ADMINISTRATOR) ||
    hasRole(ROLES.MANAGER) ||
    hasRole(ROLES.DISPATCHER);

  if (!isDispatcherOrHigher) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
