"use client"

/**
 * This file contains examples of how to use the auth context and hooks
 * These are reference implementations - use them as a guide
 */

import { useAuth, useRole, usePermissions } from "@/hooks/useAuth"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

/**
 * Example 1: Basic authentication check
 */
export function BasicAuthExample() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please sign in to continue</div>
  }

  return (
    <div>
      <h2>Welcome, {user?.name}!</h2>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
    </div>
  )
}

/**
 * Example 2: Role-based rendering
 */
export function RoleBasedExample() {
  const { isSuperAdmin, isAdmin, isCashier, isStaff } = useRole()

  return (
    <div className="space-y-4">
      {isSuperAdmin() && (
        <div className="p-4 bg-purple-100 rounded">
          Super Admin Only Content
        </div>
      )}

      {isAdmin() && (
        <div className="p-4 bg-blue-100 rounded">
          Admin Content (SUPER_ADMIN and ADMIN can see this)
        </div>
      )}

      {isCashier() && (
        <div className="p-4 bg-green-100 rounded">
          Cashier Only Content
        </div>
      )}

      {isStaff() && (
        <div className="p-4 bg-yellow-100 rounded">
          Staff Only Content
        </div>
      )}
    </div>
  )
}

/**
 * Example 3: Permission-based rendering
 */
export function PermissionBasedExample() {
  const { hasPermission } = usePermissions()

  return (
    <div className="space-y-4">
      {hasPermission("canManageUsers") && (
        <Button>Manage Users</Button>
      )}

      {hasPermission("canManageProducts") && (
        <Button>Manage Products</Button>
      )}

      {hasPermission("canViewReports") && (
        <Button>View Reports</Button>
      )}

      {hasPermission("canManageSettings") && (
        <Button>System Settings</Button>
      )}
    </div>
  )
}

/**
 * Example 4: User profile display
 */
export function UserProfileExample() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-10 h-10 rounded-full"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <p className="font-medium">{user?.name}</p>
        <p className="text-sm text-slate-500">{user?.role}</p>
      </div>
    </div>
  )
}

/**
 * Example 5: Conditional navigation based on role
 */
export function NavigationExample() {
  const { isAuthenticated } = useAuth()
  const { hasRole } = useRole()
  const { hasPermission } = usePermissions()

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="space-y-2">
      {/* Everyone can see dashboard */}
      <a href="/dashboard" className="block p-2 hover:bg-slate-100 rounded">
        Dashboard
      </a>

      {/* Only admins can see users */}
      {hasRole(["SUPER_ADMIN", "ADMIN"]) && (
        <a href="/users" className="block p-2 hover:bg-slate-100 rounded">
          Users
        </a>
      )}

      {/* Permission-based */}
      {hasPermission("canManageProducts") && (
        <a href="/products" className="block p-2 hover:bg-slate-100 rounded">
          Products
        </a>
      )}

      {hasPermission("canCreateOrders") && (
        <a href="/orders" className="block p-2 hover:bg-slate-100 rounded">
          Orders
        </a>
      )}

      {hasPermission("canViewReports") && (
        <a href="/reports" className="block p-2 hover:bg-slate-100 rounded">
          Reports
        </a>
      )}

      {hasPermission("canManageSettings") && (
        <a href="/settings" className="block p-2 hover:bg-slate-100 rounded">
          Settings
        </a>
      )}
    </nav>
  )
}

/**
 * Example 6: Logout button
 */
export function LogoutExample() {
  const { isAuthenticated, userName } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="flex items-center gap-4">
      <span>Signed in as {userName}</span>
      <Button onClick={handleLogout} variant="outline">
        Sign Out
      </Button>
    </div>
  )
}

/**
 * Example 7: Protected form submit
 */
export function ProtectedFormExample() {
  const { hasPermission } = usePermissions()
  const { isAuthenticated } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      alert("You must be signed in")
      return
    }

    if (!hasPermission("canManageProducts")) {
      alert("You don't have permission to perform this action")
      return
    }

    // Proceed with form submission
    console.log("Form submitted")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Product name"
        className="border p-2 rounded w-full"
      />
      <Button type="submit">
        Save Product
      </Button>
    </form>
  )
}

/**
 * Example 8: Multiple permission check
 */
export function MultiplePermissionExample() {
  const { hasAnyPermission, hasAllPermissions } = usePermissions()

  // Check if user has ANY of these permissions
  const canAccessFinancials = hasAnyPermission([
    "canViewReports",
    "canViewPayments",
  ])

  // Check if user has ALL of these permissions
  const canFullyManageOrders = hasAllPermissions([
    "canCreateOrders",
    "canUpdateOrders",
    "canCancelOrders",
  ])

  return (
    <div className="space-y-4">
      {canAccessFinancials && (
        <div className="p-4 bg-green-100 rounded">
          You can access financial data
        </div>
      )}

      {canFullyManageOrders && (
        <div className="p-4 bg-blue-100 rounded">
          You have full order management permissions
        </div>
      )}
    </div>
  )
}
