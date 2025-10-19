import { headers } from "next/headers"
import type { UserRole } from "@prisma/client"

/**
 * Get authenticated user information from request headers
 * These headers are set by the middleware after authentication
 * Use this in API route handlers for quick access to user info
 */

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
}

/**
 * Get the authenticated user from request headers
 * Returns null if headers are not present (shouldn't happen if middleware is working)
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const headersList = await headers()

  const userId = headersList.get("x-user-id")
  const userEmail = headersList.get("x-user-email")
  const userRole = headersList.get("x-user-role")

  if (!userId || !userEmail || !userRole) {
    return null
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole as UserRole,
  }
}

/**
 * Get the authenticated user ID from request headers
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get("x-user-id")
}

/**
 * Get the authenticated user role from request headers
 */
export async function getAuthenticatedUserRole(): Promise<UserRole | null> {
  const headersList = await headers()
  const role = headersList.get("x-user-role")
  return role as UserRole | null
}

/**
 * Get the authenticated user email from request headers
 */
export async function getAuthenticatedUserEmail(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get("x-user-email")
}

/**
 * Check if the authenticated user has a specific role
 */
export async function userHasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const userRole = await getAuthenticatedUserRole()
  if (!userRole) return false

  if (Array.isArray(role)) {
    return role.includes(userRole)
  }

  return userRole === role
}

/**
 * Check if the authenticated user is an admin (SUPER_ADMIN or ADMIN)
 */
export async function userIsAdmin(): Promise<boolean> {
  return await userHasRole(["SUPER_ADMIN", "ADMIN"])
}

/**
 * Check if the authenticated user is a super admin
 */
export async function userIsSuperAdmin(): Promise<boolean> {
  return await userHasRole("SUPER_ADMIN")
}

/**
 * Alternative: Get user from NextRequest directly (for route handlers with request param)
 */
export function getUserFromRequest(request: Request): AuthenticatedUser | null {
  const userId = request.headers.get("x-user-id")
  const userEmail = request.headers.get("x-user-email")
  const userRole = request.headers.get("x-user-role")

  if (!userId || !userEmail || !userRole) {
    return null
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole as UserRole,
  }
}
