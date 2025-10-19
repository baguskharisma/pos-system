import { UserRole } from "@prisma/client"
import { Session } from "next-auth"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth-options"

/**
 * Get the current session on the server side
 * Use this in Server Components and API routes
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Get the current user on the server side
 * Use this in Server Components and API routes
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

/**
 * Check if user is authenticated on the server side
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Check if user has a specific role on the server side
 */
export async function hasRole(role: UserRole | UserRole[]) {
  const user = await getCurrentUser()
  if (!user) return false

  if (Array.isArray(role)) {
    return role.includes(user.role)
  }

  return user.role === role
}

/**
 * Check if user has any of the admin roles on the server side
 */
export async function isAdmin() {
  return await hasRole(["SUPER_ADMIN", "ADMIN"])
}

/**
 * Check if user is a super admin on the server side
 */
export async function isSuperAdmin() {
  return await hasRole("SUPER_ADMIN")
}

/**
 * Require authentication - throws error if not authenticated
 * Use in API routes and Server Actions
 */
export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error("Unauthorized - Authentication required")
  }
  return session.user
}

/**
 * Require specific role - throws error if user doesn't have the role
 * Use in API routes and Server Actions
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth()

  const hasRequiredRole = Array.isArray(role)
    ? role.includes(user.role)
    : user.role === role

  if (!hasRequiredRole) {
    throw new Error(`Unauthorized - Required role: ${Array.isArray(role) ? role.join(" or ") : role}`)
  }

  return user
}

/**
 * Require admin role - throws error if user is not admin
 */
export async function requireAdmin() {
  return await requireRole(["SUPER_ADMIN", "ADMIN"])
}

/**
 * Require super admin role - throws error if user is not super admin
 */
export async function requireSuperAdmin() {
  return await requireRole("SUPER_ADMIN")
}

/**
 * Check if user has permission based on role
 */
export function checkPermission(userRole: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(userRole)
}

/**
 * Client-side helper to check if session user has a role
 */
export function sessionHasRole(session: Session | null, role: UserRole | UserRole[]) {
  if (!session?.user) return false

  if (Array.isArray(role)) {
    return role.includes(session.user.role)
  }

  return session.user.role === role
}

/**
 * Client-side helper to check if session user is admin
 */
export function sessionIsAdmin(session: Session | null) {
  return sessionHasRole(session, ["SUPER_ADMIN", "ADMIN"])
}

/**
 * Client-side helper to check if session user is super admin
 */
export function sessionIsSuperAdmin(session: Session | null) {
  return sessionHasRole(session, "SUPER_ADMIN")
}

/**
 * Role hierarchy - check if a role has equal or higher privileges than another
 */
const roleHierarchy: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  CASHIER: 2,
  STAFF: 1,
}

export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole) {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function hasHigherRole(userRole: UserRole, compareRole: UserRole) {
  return roleHierarchy[userRole] > roleHierarchy[compareRole]
}
