"use client"

import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"

/**
 * Custom hook to access authentication state
 * Wraps NextAuth's useSession with additional utilities
 */
export function useAuth() {
  const { data: session, status, update } = useSession()

  return {
    // Session data
    session,
    user: session?.user,
    status,

    // Status booleans
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",

    // User info
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    userName: session?.user?.name,
    userRole: session?.user?.role,
    userAvatar: session?.user?.avatar,
    userPhone: session?.user?.phone,
    isActive: session?.user?.isActive,
    employeeId: session?.user?.employeeId,

    // Utility function to update session
    updateSession: update,
  }
}

/**
 * Hook to check if user has a specific role
 */
export function useRole() {
  const { userRole, isAuthenticated } = useAuth()

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!isAuthenticated || !userRole) return false

    if (Array.isArray(role)) {
      return role.includes(userRole)
    }

    return userRole === role
  }

  const isSuperAdmin = () => hasRole("SUPER_ADMIN")
  const isAdmin = () => hasRole(["SUPER_ADMIN", "ADMIN"])
  const isCashier = () => hasRole("CASHIER")
  const isStaff = () => hasRole("STAFF")

  // Check if user has at least one of the admin roles
  const isAdminUser = () => hasRole(["SUPER_ADMIN", "ADMIN"])

  return {
    userRole,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isCashier,
    isStaff,
    isAdminUser,
  }
}

/**
 * Hook to access just the user object
 */
export function useUser() {
  const { user } = useAuth()
  return user
}

/**
 * Hook for permission-based access control
 */
export function usePermissions() {
  const { userRole, isAuthenticated } = useAuth()

  // Define permissions based on roles
  const permissions = {
    // User management
    canManageUsers: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
    canViewUsers: ["SUPER_ADMIN", "ADMIN"] as UserRole[],

    // Product management
    canManageProducts: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
    canViewProducts: ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"] as UserRole[],

    // Category management
    canManageCategories: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
    canViewCategories: ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"] as UserRole[],

    // Order management
    canCreateOrders: ["SUPER_ADMIN", "ADMIN", "CASHIER"] as UserRole[],
    canViewOrders: ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"] as UserRole[],
    canUpdateOrders: ["SUPER_ADMIN", "ADMIN", "CASHIER"] as UserRole[],
    canCancelOrders: ["SUPER_ADMIN", "ADMIN", "CASHIER"] as UserRole[],
    canRefundOrders: ["SUPER_ADMIN", "ADMIN"] as UserRole[],

    // Payment management
    canVerifyPayments: ["SUPER_ADMIN", "ADMIN", "CASHIER"] as UserRole[],
    canViewPayments: ["SUPER_ADMIN", "ADMIN", "CASHIER"] as UserRole[],

    // Cash drawer
    canManageCashDrawer: ["SUPER_ADMIN", "ADMIN", "CASHIER"] as UserRole[],
    canViewCashDrawer: ["SUPER_ADMIN", "ADMIN", "CASHIER"] as UserRole[],

    // Reports
    canViewReports: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
    canExportReports: ["SUPER_ADMIN", "ADMIN"] as UserRole[],

    // System settings
    canManageSettings: ["SUPER_ADMIN"] as UserRole[],
    canViewSettings: ["SUPER_ADMIN", "ADMIN"] as UserRole[],

    // Audit logs
    canViewAuditLogs: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
  }

  const hasPermission = (permission: keyof typeof permissions) => {
    if (!isAuthenticated || !userRole) return false
    return permissions[permission].includes(userRole)
  }

  const hasAnyPermission = (perms: (keyof typeof permissions)[]) => {
    return perms.some(perm => hasPermission(perm))
  }

  const hasAllPermissions = (perms: (keyof typeof permissions)[]) => {
    return perms.every(perm => hasPermission(perm))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
  }
}
