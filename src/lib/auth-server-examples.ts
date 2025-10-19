/**
 * This file contains examples of how to use auth utilities on the server side
 * These are reference implementations for Server Components, API routes, and Server Actions
 */

import {
  getSession,
  getCurrentUser,
  isAuthenticated,
  hasRole,
  requireAuth,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
} from "./auth-utils"
import { redirect } from "next/navigation"

/**
 * Example 1: Server Component with auth check
 */
export async function ServerComponentExample() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  )
}

/**
 * Example 2: Server Component with role check
 */
export async function AdminOnlyServerComponent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const isUserAdmin = await hasRole(["SUPER_ADMIN", "ADMIN"])

  if (!isUserAdmin) {
    redirect("/unauthorized")
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user.name}</p>
    </div>
  )
}

/**
 * Example 3: API Route with auth
 */
export async function apiRouteExample() {
  // Example for app/api/products/route.ts
  try {
    const user = await requireAuth()

    // Proceed with API logic
    return Response.json({
      success: true,
      message: `Hello ${user.name}`,
    })
  } catch (error) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }
}

/**
 * Example 4: API Route with role requirement
 */
export async function adminApiRouteExample() {
  // Example for app/api/admin/users/route.ts
  try {
    const user = await requireAdmin()

    // Proceed with admin API logic
    return Response.json({
      success: true,
      message: `Admin ${user.name} accessed the endpoint`,
    })
  } catch (error) {
    return Response.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    )
  }
}

/**
 * Example 5: Server Action with auth
 */
export async function createProductAction(formData: FormData) {
  "use server"

  try {
    // Require admin role
    const user = await requireRole(["SUPER_ADMIN", "ADMIN"])

    const name = formData.get("name") as string
    const price = formData.get("price") as string

    // Create product logic here
    console.log(`Product created by ${user.name}`)

    return { success: true, message: "Product created successfully" }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    }
  }
}

/**
 * Example 6: Server Action with super admin requirement
 */
export async function deleteUserAction(userId: string) {
  "use server"

  try {
    // Only super admins can delete users
    const user = await requireSuperAdmin()

    // Delete user logic here
    console.log(`User ${userId} deleted by ${user.name}`)

    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    }
  }
}

/**
 * Example 7: Conditional rendering based on auth state
 */
export async function ConditionalServerComponent() {
  const authenticated = await isAuthenticated()
  const user = await getCurrentUser()

  return (
    <div>
      {authenticated ? (
        <div>
          <h2>Welcome back, {user?.name}</h2>
          <p>Email: {user?.email}</p>
        </div>
      ) : (
        <div>
          <h2>Welcome, Guest</h2>
          <a href="/auth/signin">Sign In</a>
        </div>
      )}
    </div>
  )
}

/**
 * Example 8: Multiple role checks in Server Component
 */
export async function MultiRoleServerComponent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const canManageProducts = await hasRole(["SUPER_ADMIN", "ADMIN"])
  const canCreateOrders = await hasRole(["SUPER_ADMIN", "ADMIN", "CASHIER"])

  return (
    <div className="space-y-4">
      <h1>Dashboard</h1>

      {canManageProducts && (
        <div className="p-4 bg-blue-100 rounded">
          <h2>Product Management</h2>
          <p>You can manage products</p>
        </div>
      )}

      {canCreateOrders && (
        <div className="p-4 bg-green-100 rounded">
          <h2>Order Management</h2>
          <p>You can create orders</p>
        </div>
      )}
    </div>
  )
}

/**
 * Example 9: Protected page with automatic redirect
 */
export async function ProtectedPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  return (
    <div>
      <h1>Protected Dashboard</h1>
      <p>This page is only accessible to authenticated users</p>
    </div>
  )
}

/**
 * Example 10: API Route with permission validation
 */
export async function deleteProductApiRoute(productId: string) {
  try {
    // Require admin role
    const user = await requireAdmin()

    // Additional permission checks can be done here
    // For example, check if user owns the product or has specific permissions

    // Delete product logic
    console.log(`Product ${productId} deleted by ${user.name}`)

    return Response.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return Response.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes("Required role")) {
        return Response.json({ error: error.message }, { status: 403 })
      }
    }

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
