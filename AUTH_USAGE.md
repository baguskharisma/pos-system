# Authentication & Authorization Guide

This guide explains how to use the authentication and authorization system in the POS application.

## Table of Contents

- [Overview](#overview)
- [Client-Side Usage](#client-side-usage)
- [Server-Side Usage](#server-side-usage)
- [Role-Based Access Control](#role-based-access-control)
- [Permission-Based Access Control](#permission-based-access-control)
- [Examples](#examples)

## Overview

The authentication system is built on top of NextAuth.js and provides:

- **AuthContext/Provider**: React context for managing auth state
- **Custom Hooks**: Easy-to-use hooks for client components
- **Server Utilities**: Functions for server components and API routes
- **RBAC**: Role-based access control with 4 roles (SUPER_ADMIN, ADMIN, CASHIER, STAFF)
- **PBAC**: Permission-based access control for fine-grained permissions

## Client-Side Usage

### Setup

The `AuthProvider` is already configured in the root layout (`src/app/layout.tsx`).

### Using Auth Hooks

#### 1. `useAuth()` - Main authentication hook

```tsx
"use client"

import { useAuth } from "@/hooks/useAuth"

export function MyComponent() {
  const {
    user,           // Current user object
    isAuthenticated,// Boolean: is user logged in?
    isLoading,      // Boolean: is session loading?
    status,         // Session status: "loading" | "authenticated" | "unauthenticated"
    updateSession,  // Function to refresh session
  } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>

  return <div>Welcome, {user?.name}!</div>
}
```

#### 2. `useRole()` - Role checking hook

```tsx
"use client"

import { useRole } from "@/hooks/useAuth"

export function AdminPanel() {
  const {
    hasRole,      // Function to check specific role(s)
    isSuperAdmin, // Function: is user SUPER_ADMIN?
    isAdmin,      // Function: is user SUPER_ADMIN or ADMIN?
    isCashier,    // Function: is user CASHIER?
    isStaff,      // Function: is user STAFF?
  } = useRole()

  return (
    <div>
      {isSuperAdmin() && <div>Super Admin Content</div>}
      {isAdmin() && <div>Admin Content</div>}
      {hasRole(["CASHIER", "ADMIN"]) && <div>Cashier or Admin Content</div>}
    </div>
  )
}
```

#### 3. `usePermissions()` - Permission checking hook

```tsx
"use client"

import { usePermissions } from "@/hooks/useAuth"

export function ProductsPage() {
  const {
    hasPermission,      // Check single permission
    hasAnyPermission,   // Check if user has ANY of the permissions
    hasAllPermissions,  // Check if user has ALL of the permissions
  } = usePermissions()

  return (
    <div>
      {hasPermission("canManageProducts") && (
        <button>Create Product</button>
      )}

      {hasPermission("canViewProducts") && (
        <div>Product List</div>
      )}
    </div>
  )
}
```

#### 4. `useUser()` - Get current user

```tsx
"use client"

import { useUser } from "@/hooks/useAuth"

export function UserProfile() {
  const user = useUser()

  if (!user) return null

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  )
}
```

## Server-Side Usage

### In Server Components

```tsx
import { getSession, getCurrentUser, hasRole } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  // Get session
  const session = await getSession()

  // Redirect if not authenticated
  if (!session) {
    redirect("/auth/signin")
  }

  // Get user
  const user = await getCurrentUser()

  // Check role
  const isUserAdmin = await hasRole(["SUPER_ADMIN", "ADMIN"])

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {isUserAdmin && <div>Admin Controls</div>}
    </div>
  )
}
```

### In API Routes

```tsx
// app/api/products/route.ts
import { requireAuth, requireAdmin } from "@/lib/auth-utils"

export async function GET() {
  try {
    // Require authentication
    const user = await requireAuth()

    // Your API logic here
    return Response.json({ success: true, user })
  } catch (error) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
}

export async function DELETE() {
  try {
    // Require admin role
    const user = await requireAdmin()

    // Your API logic here
    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    )
  }
}
```

### In Server Actions

```tsx
"use server"

import { requireRole } from "@/lib/auth-utils"

export async function createProduct(formData: FormData) {
  try {
    // Require specific role
    const user = await requireRole(["SUPER_ADMIN", "ADMIN"])

    // Your server action logic here
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred"
    }
  }
}
```

## Role-Based Access Control

### Available Roles

1. **SUPER_ADMIN** - Highest privilege level
2. **ADMIN** - Administrative access
3. **CASHIER** - Point of sale operations
4. **STAFF** - Basic staff access

### Role Hierarchy

```
SUPER_ADMIN (Level 4)
    ↓
ADMIN (Level 3)
    ↓
CASHIER (Level 2)
    ↓
STAFF (Level 1)
```

### Client-Side Role Checks

```tsx
import { useRole } from "@/hooks/useAuth"

const { hasRole, isSuperAdmin, isAdmin } = useRole()

// Single role
if (hasRole("SUPER_ADMIN")) { ... }

// Multiple roles (OR)
if (hasRole(["SUPER_ADMIN", "ADMIN"])) { ... }

// Helper functions
if (isSuperAdmin()) { ... }
if (isAdmin()) { ... } // Returns true for SUPER_ADMIN or ADMIN
```

### Server-Side Role Checks

```tsx
import { hasRole, requireRole } from "@/lib/auth-utils"

// Check role (returns boolean)
const isUserAdmin = await hasRole(["SUPER_ADMIN", "ADMIN"])

// Require role (throws error if not authorized)
const user = await requireRole("SUPER_ADMIN")
const user = await requireAdmin() // Shorthand for SUPER_ADMIN or ADMIN
const user = await requireSuperAdmin() // Only SUPER_ADMIN
```

## Permission-Based Access Control

### Available Permissions

See `src/hooks/useAuth.ts` for the complete list. Examples:

- `canManageUsers` - Create, update, delete users
- `canManageProducts` - Create, update, delete products
- `canCreateOrders` - Create new orders
- `canViewReports` - Access reports
- `canManageSettings` - Modify system settings
- And many more...

### Using Permissions

```tsx
import { usePermissions } from "@/hooks/useAuth"

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

// Single permission
if (hasPermission("canManageProducts")) {
  // Show product management UI
}

// Any of these permissions (OR)
if (hasAnyPermission(["canViewReports", "canViewPayments"])) {
  // Show financial data
}

// All of these permissions (AND)
if (hasAllPermissions(["canCreateOrders", "canUpdateOrders"])) {
  // Show full order management
}
```

## Examples

### Protected Page Component

```tsx
"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return null

  return <div>Protected Content</div>
}
```

### Navigation with Role-Based Links

```tsx
"use client"

import { useAuth, usePermissions } from "@/hooks/useAuth"
import Link from "next/link"

export function Navigation() {
  const { isAuthenticated } = useAuth()
  const { hasPermission } = usePermissions()

  if (!isAuthenticated) return null

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>

      {hasPermission("canManageProducts") && (
        <Link href="/products">Products</Link>
      )}

      {hasPermission("canCreateOrders") && (
        <Link href="/orders">Orders</Link>
      )}

      {hasPermission("canViewReports") && (
        <Link href="/reports">Reports</Link>
      )}

      {hasPermission("canManageSettings") && (
        <Link href="/settings">Settings</Link>
      )}
    </nav>
  )
}
```

### Logout Button

```tsx
"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export function LogoutButton() {
  const { user } = useAuth()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="flex items-center gap-4">
      <span>Signed in as {user?.name}</span>
      <Button onClick={handleLogout} variant="outline">
        Sign Out
      </Button>
    </div>
  )
}
```

## API Reference

### Client Hooks

- `useAuth()` - Main auth hook
- `useRole()` - Role checking hook
- `useUser()` - Get current user
- `usePermissions()` - Permission checking hook

### Server Utilities

- `getSession()` - Get current session
- `getCurrentUser()` - Get current user
- `isAuthenticated()` - Check if user is authenticated
- `hasRole(role)` - Check if user has role
- `requireAuth()` - Require authentication (throws error)
- `requireRole(role)` - Require specific role (throws error)
- `requireAdmin()` - Require admin role (throws error)
- `requireSuperAdmin()` - Require super admin role (throws error)

## Best Practices

1. **Always check authentication** before rendering protected content
2. **Use permissions over roles** when possible for better flexibility
3. **Handle loading states** properly to avoid flashing content
4. **Redirect on server side** when possible for better UX
5. **Validate on both client and server** - never trust client-side checks alone
6. **Use proper error handling** in API routes and server actions

## Testing

When testing locally, you can create users with different roles using the Prisma seed file or manually through Prisma Studio:

```bash
npm run db:studio
```

See `prisma/seed.ts` for example users with different roles.
