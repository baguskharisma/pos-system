# Middleware Quick Reference

## 🔒 Route Protection Cheat Sheet

### Public Routes (No Auth)
```
✅ /                          Homepage
✅ /menu                       Menu
✅ /cart                       Cart
✅ /checkout                   Checkout
✅ /order/[id]                 Order tracking
✅ /auth/signin                Login
✅ /api/products (GET)         Public products
✅ /api/categories (GET)       Public categories
```

### Protected Routes (Any Auth)
```
🔐 /admin/dashboard
🔐 /admin/pos
🔐 /admin/orders
🔐 /admin/cash-drawer
🔐 /admin/inventory
🔐 /admin/profile
```

### Admin Only (ADMIN/SUPER_ADMIN)
```
👔 /admin/products/new
👔 /admin/products/[id]/edit
👔 /admin/categories/new
👔 /admin/categories/[id]/edit
👔 /admin/reports/*
👔 /api/products (POST/PUT/DELETE)
👔 /api/reports/*
```

### Super Admin Only
```
👑 /admin/users
👑 /admin/users/new
👑 /admin/users/[id]/edit
👑 /admin/settings
👑 /api/users/*
👑 /api/settings/*
👑 /api/audit-logs
```

## 🚀 Quick Start

### 1. Access User in API Routes

```typescript
import { getAuthenticatedUser } from "@/lib/request-helpers"

export async function GET() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return Response.json({ user })
}
```

### 2. Check Admin Access

```typescript
import { userIsAdmin } from "@/lib/request-helpers"

export async function POST() {
  const isAdmin = await userIsAdmin()

  if (!isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  // Admin-only logic
}
```

### 3. Check Specific Role

```typescript
import { getAuthenticatedUser } from "@/lib/request-helpers"

export async function DELETE() {
  const user = await getAuthenticatedUser()

  if (user?.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  // Super admin only logic
}
```

### 4. Access User in Server Component

```typescript
import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function Page() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return <div>Welcome {user.name}</div>
}
```

### 5. Check Role in Server Component

```typescript
import { requireRole } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  try {
    const user = await requireRole(["SUPER_ADMIN", "ADMIN"])
    return <div>Admin: {user.name}</div>
  } catch {
    redirect("/admin/forbidden")
  }
}
```

## 📋 Common Patterns

### Pattern 1: Create Resource with User Tracking
```typescript
import { getAuthenticatedUser } from "@/lib/request-helpers"

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  const data = await request.json()

  const resource = await db.create({
    ...data,
    createdBy: user.id,
  })

  return Response.json({ resource })
}
```

### Pattern 2: Check Resource Ownership
```typescript
const user = await getAuthenticatedUser()
const resource = await db.findById(id)

const isAdmin = await userIsAdmin()
const isOwner = resource.userId === user.id

if (!isAdmin && !isOwner) {
  return Response.json({ error: "Forbidden" }, { status: 403 })
}
```

### Pattern 3: Multi-Method Handler
```typescript
export async function GET() {
  const user = await getAuthenticatedUser()
  // Anyone authenticated can read
  return Response.json({ data })
}

export async function POST() {
  const isAdmin = await userIsAdmin()
  if (!isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  // Admin-only create
}

export async function DELETE() {
  const user = await getAuthenticatedUser()
  if (user?.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  // Super admin only delete
}
```

## 🎯 Available Helper Functions

### From `@/lib/request-helpers`
```typescript
getAuthenticatedUser()      // Get user object from headers
getAuthenticatedUserId()    // Get just user ID
getAuthenticatedUserRole()  // Get just user role
getAuthenticatedUserEmail() // Get just user email
userHasRole(role)           // Check if user has role
userIsAdmin()               // Check if ADMIN/SUPER_ADMIN
userIsSuperAdmin()          // Check if SUPER_ADMIN
getUserFromRequest(req)     // Get user from Request object
```

### From `@/lib/auth-utils` (Server Components)
```typescript
getSession()                // Get NextAuth session
getCurrentUser()            // Get current user
isAuthenticated()           // Check if authenticated
hasRole(role)              // Check if user has role
requireAuth()              // Require auth (throws)
requireRole(role)          // Require role (throws)
requireAdmin()             // Require admin (throws)
requireSuperAdmin()        // Require super admin (throws)
```

## 🛠️ User Object Structure

```typescript
interface AuthenticatedUser {
  id: string        // User ID
  email: string     // User email
  role: UserRole    // SUPER_ADMIN | ADMIN | CASHIER | STAFF
}
```

## ⚡ Performance Tips

1. **Use headers for quick checks** - Faster than database queries
2. **Cache user data** - Don't fetch repeatedly
3. **Use middleware injection** - User info already in headers
4. **Minimize database calls** - Use session data when possible

## 🐛 Troubleshooting

### "User is null in API route"
- Ensure middleware is running (check `middleware.ts` matcher)
- Verify route requires authentication
- Check session cookie is present

### "Getting 401 on protected route"
- User not logged in - redirect to `/auth/signin`
- Session expired - refresh token

### "Getting 403 on admin route"
- User doesn't have required role
- Check user role in database
- Verify role assignment is correct

### "Infinite redirect loop"
- `/auth/signin` must be in public routes
- Check middleware public route patterns
- Verify `isPublicRoute()` function

## 📦 Response Status Codes

```
200 - Success
401 - Unauthorized (not logged in)
403 - Forbidden (logged in but insufficient permissions)
404 - Not Found
405 - Method Not Allowed
500 - Internal Server Error
```

## 🔑 Environment Variables

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 📚 Full Documentation

For comprehensive guides, see:
- [MIDDLEWARE_GUIDE.md](./MIDDLEWARE_GUIDE.md) - Complete middleware documentation
- [AUTH_USAGE.md](./AUTH_USAGE.md) - Authentication hooks and utilities

## 🎓 Examples

See example implementations:
- `src/lib/api-route-examples.ts` - API route patterns
- `src/app/api/auth/me/route.ts` - Working example
- `src/components/auth/AuthExamples.tsx` - Client examples
