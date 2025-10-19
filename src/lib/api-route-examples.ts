/**
 * Example API route implementations showing how to use middleware protection
 * and request helpers
 */

import { NextResponse } from "next/server"
import { getAuthenticatedUser, userIsAdmin } from "./request-helpers"

/**
 * Example 1: Simple protected API route
 * Middleware ensures user is authenticated before this runs
 */
export async function simpleProtectedRoute() {
  // Get user from headers injected by middleware
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    message: `Hello ${user.email}`,
    userId: user.id,
    role: user.role,
  })
}

/**
 * Example 2: Admin-only API route
 * Check if user is admin before proceeding
 */
export async function adminOnlyRoute() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const isAdmin = await userIsAdmin()

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    )
  }

  // Admin-only logic here
  return NextResponse.json({ message: "Admin access granted" })
}

/**
 * Example 3: Role-based API route
 * Different responses based on user role
 */
export async function roleBasedRoute() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  switch (user.role) {
    case "SUPER_ADMIN":
      return NextResponse.json({
        data: "Full access data",
        permissions: ["all"],
      })

    case "ADMIN":
      return NextResponse.json({
        data: "Admin data",
        permissions: ["read", "write"],
      })

    case "CASHIER":
      return NextResponse.json({
        data: "Cashier data",
        permissions: ["read", "create_orders"],
      })

    case "STAFF":
      return NextResponse.json({
        data: "Staff data",
        permissions: ["read"],
      })

    default:
      return NextResponse.json({ error: "Invalid role" }, { status: 403 })
  }
}

/**
 * Example 4: POST route with user tracking
 * Track who created a resource
 */
export async function createResourceRoute(request: Request) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse request body
  const body = await request.json()

  // Your creation logic here
  const resource = {
    ...body,
    createdBy: user.id,
    createdByEmail: user.email,
    createdAt: new Date().toISOString(),
  }

  // Save to database...
  console.log("Resource created:", resource)

  return NextResponse.json({
    success: true,
    resource,
  })
}

/**
 * Example 5: PUT/PATCH route with authorization
 * Check if user can modify a resource
 */
export async function updateResourceRoute(
  request: Request,
  resourceOwnerId: string
) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin or the owner of the resource
  const isAdmin = await userIsAdmin()
  const isOwner = user.id === resourceOwnerId

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "Forbidden - You can only modify your own resources" },
      { status: 403 }
    )
  }

  // Update logic here
  const body = await request.json()

  return NextResponse.json({
    success: true,
    message: "Resource updated",
    updatedBy: user.id,
  })
}

/**
 * Example 6: DELETE route with super admin check
 * Only super admins can delete
 */
export async function deleteResourceRoute() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only super admin can delete
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Forbidden - Only super admins can delete" },
      { status: 403 }
    )
  }

  // Delete logic here
  return NextResponse.json({
    success: true,
    message: "Resource deleted",
    deletedBy: user.id,
  })
}

/**
 * Example 7: Multi-method route handler
 * Different logic for GET, POST, PUT, DELETE
 */
export async function multiMethodRoute(request: Request) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const method = request.method

  switch (method) {
    case "GET":
      // Anyone authenticated can read
      return NextResponse.json({ data: "Resource data" })

    case "POST": {
      // Admins and cashiers can create
      if (!["SUPER_ADMIN", "ADMIN", "CASHIER"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.json({ success: true, message: "Created" })
    }

    case "PUT":
    case "PATCH": {
      // Only admins can update
      const isAdmin = await userIsAdmin()
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.json({ success: true, message: "Updated" })
    }

    case "DELETE": {
      // Only super admin can delete
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.json({ success: true, message: "Deleted" })
    }

    default:
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      )
  }
}

/**
 * Example 8: Error handling with user context
 * Proper error handling with user info for logging
 */
export async function errorHandlingRoute() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Your logic that might throw an error
    throw new Error("Something went wrong")
  } catch (error) {
    // Log error with user context
    console.error("Error occurred:", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
