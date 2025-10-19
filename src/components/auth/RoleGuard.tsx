"use client";

import { ReactNode } from "react";
import { usePermissions, useRoleCheck, usePermissionCheck } from "@/hooks/usePermissions";
import { Permission } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

/**
 * Component Props
 */
interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

interface PermissionGuardProps {
  children: ReactNode;
  permissions: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission.
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * RoleGuard - Show children only if user has one of the allowed roles
 *
 * @example
 * <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
 *   <AdminDashboard />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  loadingFallback = <div>Loading...</div>,
}: RoleGuardProps) {
  const { isAllowed, isLoading } = useRoleCheck(allowedRoles);

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * PermissionGuard - Show children only if user has required permissions
 *
 * @example
 * <PermissionGuard permissions={[Permission.USER_CREATE, Permission.USER_UPDATE]}>
 *   <UserForm />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permissions,
  requireAll = true,
  fallback = null,
  loadingFallback = <div>Loading...</div>,
}: PermissionGuardProps) {
  const { canAll, canAny, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  const isAllowed = requireAll ? canAll(permissions) : canAny(permissions);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * AdminGuard - Show children only if user is admin (ADMIN or SUPER_ADMIN)
 *
 * @example
 * <AdminGuard>
 *   <AdminPanel />
 * </AdminGuard>
 */
export function AdminGuard({
  children,
  fallback = null,
  loadingFallback = <div>Loading...</div>,
}: AdminGuardProps) {
  const { isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * SuperAdminGuard - Show children only if user is super admin
 *
 * @example
 * <SuperAdminGuard>
 *   <SystemSettings />
 * </SuperAdminGuard>
 */
export function SuperAdminGuard({
  children,
  fallback = null,
  loadingFallback = <div>Loading...</div>,
}: Omit<AdminGuardProps, "loadingFallback"> & { loadingFallback?: ReactNode }) {
  const { isSuperAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isSuperAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Can - Render children only if user has permission
 *
 * @example
 * <Can permission={Permission.USER_DELETE}>
 *   <DeleteButton />
 * </Can>
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Cannot - Render children only if user does NOT have permission
 *
 * @example
 * <Cannot permission={Permission.USER_DELETE}>
 *   <p>You cannot delete users</p>
 * </Cannot>
 */
export function Cannot({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { cannot } = usePermissions();

  if (!cannot(permission)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * ShowForRoles - Show children only for specific roles
 *
 * @example
 * <ShowForRoles roles={["CASHIER"]}>
 *   <CashierView />
 * </ShowForRoles>
 */
export function ShowForRoles({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { hasAnyRole } = usePermissions();

  if (!hasAnyRole(roles)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HideForRoles - Hide children for specific roles
 *
 * @example
 * <HideForRoles roles={["STAFF"]}>
 *   <AdminOnlyFeature />
 * </HideForRoles>
 */
export function HideForRoles({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { hasAnyRole } = usePermissions();

  if (hasAnyRole(roles)) {
    return null;
  }

  return <>{children}</>;
}
