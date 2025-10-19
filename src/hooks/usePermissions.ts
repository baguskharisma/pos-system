"use client";

import { useSession } from "next-auth/react";
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleHigher,
  isRoleHigherOrEqual,
  canManageRole,
  getRolePermissions,
  formatRole,
  formatPermission,
} from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const role = user?.role as UserRole | undefined;

  /**
   * Check if user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (targetRole: UserRole): boolean => {
    if (!role) return false;
    return role === targetRole;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  /**
   * Check if user's role is higher than target role
   */
  const isHigherRole = (targetRole: UserRole): boolean => {
    if (!role) return false;
    return isRoleHigher(role, targetRole);
  };

  /**
   * Check if user's role is higher or equal to target role
   */
  const isHigherOrEqualRole = (targetRole: UserRole): boolean => {
    if (!role) return false;
    return isRoleHigherOrEqual(role, targetRole);
  };

  /**
   * Check if user can manage another role
   */
  const canManage = (targetRole: UserRole): boolean => {
    if (!role) return false;
    return canManageRole(role, targetRole);
  };

  /**
   * Check if user is admin (ADMIN or SUPER_ADMIN)
   */
  const isAdmin = (): boolean => {
    if (!role) return false;
    return role === "ADMIN" || role === "SUPER_ADMIN";
  };

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = (): boolean => {
    if (!role) return false;
    return role === "SUPER_ADMIN";
  };

  /**
   * Get all permissions for current user
   */
  const permissions = role ? getRolePermissions(role) : [];

  /**
   * Get formatted role name
   */
  const formattedRole = role ? formatRole(role) : "";

  return {
    // User info
    user,
    role,
    formattedRole,
    permissions,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",

    // Permission checks
    can,
    canAny,
    canAll,
    cannot: (permission: Permission) => !can(permission),

    // Role checks
    hasRole,
    hasAnyRole,
    isHigherRole,
    isHigherOrEqualRole,
    canManage,
    isAdmin: isAdmin(),
    isSuperAdmin: isSuperAdmin(),
  };
}

/**
 * Hook for role-based rendering
 */
export function useRoleCheck(allowedRoles: UserRole[]) {
  const { hasAnyRole, isLoading } = usePermissions();
  const isAllowed = hasAnyRole(allowedRoles);

  return {
    isAllowed,
    isLoading,
    isDenied: !isLoading && !isAllowed,
  };
}

/**
 * Hook for permission-based rendering
 */
export function usePermissionCheck(requiredPermissions: Permission[]) {
  const { canAll, isLoading } = usePermissions();
  const isAllowed = canAll(requiredPermissions);

  return {
    isAllowed,
    isLoading,
    isDenied: !isLoading && !isAllowed,
  };
}
