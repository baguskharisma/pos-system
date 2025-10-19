# Middleware & Route Protection Guide

This guide explains how the route protection middleware works and how routes are secured in the POS system.

## Overview

The middleware (`middleware.ts`) provides:
- **Authentication checking** - Ensures users are logged in
- **Role-based access control (RBAC)** - Restricts routes by user role
- **API route protection** - Secures API endpoints
- **Automatic redirects** - Sends unauthenticated users to login
- **User info injection** - Adds user data to request headers for easy access

## Route Categories

### 1. Public Routes (No Authentication Required)

#### Customer-Facing Pages
```
/                           - Homepage/Menu
/menu                       - Menu page
/cart                       - Shopping cart
/checkout                   - Checkout page
/order/[id]                 - Order tracking
/order/[id]/receipt         - Order receipt
```

#### Auth Pages
```
/auth/signin                - Login page
/auth/error                 - Authentication error page
/auth/forgot-password       - Password recovery
/login                      - Alias to /auth/signin
```

#### Public API Routes
```
/api/auth/*                 - NextAuth endpoints
/api/products (GET only)    - Public product listing
/api/categories (GET only)  - Public category listing
/api/orders (POST)          - Customer order creation
/api/orders/[id] (GET)      - Order status check (with order number)
/api/payment/notification   - Payment gateway webhook (Midtrans)
/api/payment/check-status/[orderId] - Payment status check
```

### 2. Admin Routes (Authentication Required)

All routes under `/admin/*` require authentication and active user status.

#### General Admin Access (All authenticated users)
```
/admin/dashboard            - Main dashboard
/admin/pos                  - Point of sale interface
/admin/orders               - Order management
/admin/orders/[id]          - Order details
/admin/cash-drawer          - Cash drawer management
/admin/inventory            - Inventory management
/admin/profile              - User profile
```

#### Admin/Super Admin Only
```
/admin/products             - Product listing (view only for others)
/admin/products/new         - Create product (ADMIN/SUPER_ADMIN)
/admin/products/[id]/edit   - Edit product (ADMIN/SUPER_ADMIN)
/admin/categories           - Category listing (view only for others)
/admin/categories/new       - Create category (ADMIN/SUPER_ADMIN)
/admin/categories/[id]/edit - Edit category (ADMIN/SUPER_ADMIN)
/admin/reports              - Reports dashboard (ADMIN/SUPER_ADMIN)
/admin/reports/daily        - Daily reports (ADMIN/SUPER_ADMIN)
/admin/reports/weekly       - Weekly reports (ADMIN/SUPER_ADMIN)
/admin/reports/monthly      - Monthly reports (ADMIN/SUPER_ADMIN)
```

#### Super Admin Only
```
/admin/users                - User management
/admin/users/new            - Create user
/admin/users/[id]/edit      - Edit user
/admin/settings             - System settings
```

### 3. Protected API Routes

#### General Authenticated APIs
```
/api/auth/logout            - User logout
/api/auth/me                - Current user info
```

#### Admin/Super Admin APIs
```
/api/products (POST, PUT, DELETE, PATCH) - Product mutations (ADMIN/SUPER_ADMIN)
/api/categories (POST, PUT, DELETE, PATCH) - Category mutations (ADMIN/SUPER_ADMIN)
/api/reports/*              - Report APIs (ADMIN/SUPER_ADMIN)
```

#### Cashier/Admin APIs
```
/api/orders/[id]/confirm-payment - Confirm payment (CASHIER/ADMIN/SUPER_ADMIN)
/api/orders/[id]/update-status   - Update order status (CASHIER/ADMIN/SUPER_ADMIN)
/api/cash-drawer/*          - Cash drawer operations (CASHIER/ADMIN/SUPER_ADMIN)
/api/inventory/*            - Inventory operations (CASHIER/ADMIN/SUPER_ADMIN)
```

#### Super Admin Only APIs
```
/api/users/*                - User CRUD operations
/api/settings/*             - System settings
/api/audit-logs             - Audit log access
```

## How Middleware Works

### 1. Request Flow

```
Request → Middleware → Route Handler
           ↓
    Authentication Check
           ↓
    Role Authorization
           ↓
    Inject User Headers
           ↓
    Continue/Redirect
```

### 2. Authentication Check

The middleware uses NextAuth's `getToken()` to efficiently check authentication:

```typescript
const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
})

if (!token) {
  // Redirect to login or return 401
}
```

### 3. Active User Check

```typescript
if (!token.isActive) {
  // Redirect to error page or return 403
}
```

### 4. Role-Based Authorization

```typescript
// Super Admin only routes
if (requiresSuperAdmin(pathname)) {
  if (userRole !== "SUPER_ADMIN") {
    // Redirect to forbidden or return 403
  }
}

// Admin routes
if (["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
  // Allow access
}
```

### 5. User Info Injection

The middleware injects user information into request headers:

```typescript
requestHeaders.set("x-user-id", token.id)
requestHeaders.set("x-user-role", token.role)
requestHeaders.set("x-user-email", token.email)
```

## Using Request Helpers in API Routes

### Method 1: Using Helper Functions

```typescript
// app/api/products/route.ts
import { getAuthenticatedUser, userIsAdmin } from "@/lib/request-helpers"

export async function POST() {
  // Get user info from headers (set by middleware)
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const isAdmin = await userIsAdmin()

  if (!isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  // Your logic here
  console.log(`Product created by ${user.email}`)

  return Response.json({ success: true })
}
```

### Method 2: Direct Header Access

```typescript
// app/api/orders/route.ts
import { headers } from "next/headers"

export async function GET() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")
  const userRole = headersList.get("x-user-role")

  // Your logic here
  return Response.json({ userId, userRole })
}
```

### Method 3: From Request Object

```typescript
// app/api/products/route.ts
import { getUserFromRequest } from "@/lib/request-helpers"

export async function POST(request: Request) {
  const user = getUserFromRequest(request)

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Your logic here
  return Response.json({ success: true })
}
```

## Error Pages

### /admin/forbidden
Shown when authenticated users try to access routes they don't have permission for.

**Features:**
- Clear error message
- Link to dashboard
- Link to profile
- Information about contacting admin

### /auth/error
Shown when authentication errors occur.

**Supported Error Types:**
- `Configuration` - Server configuration error
- `AccessDenied` - User doesn't have permission
- `Verification` - Token expired or invalid
- `AccountInactive` - Account deactivated
- `SessionExpired` - Session has expired
- `Default` - Generic auth error

**Usage:**
```
/auth/error?error=AccountInactive
/auth/error?error=SessionExpired
```

## Response Codes

### API Routes

- **200** - Success
- **401** - Unauthorized (not authenticated)
- **403** - Forbidden (authenticated but insufficient permissions)
- **404** - Not found
- **500** - Server error

### Page Routes

- **Redirect to /auth/signin** - Not authenticated
- **Redirect to /admin/forbidden** - Insufficient permissions
- **Redirect to /auth/error** - Authentication error

## Testing the Middleware

### 1. Test Unauthenticated Access

```bash
# Try accessing protected route without login
curl http://localhost:3000/admin/dashboard
# Should redirect to /auth/signin
```

### 2. Test Role-Based Access

```bash
# Login as CASHIER and try to access super admin route
# Navigate to /admin/users
# Should redirect to /admin/forbidden
```

### 3. Test API Protection

```bash
# Try POST to protected API without auth
curl -X POST http://localhost:3000/api/products
# Should return 401

# Try with valid session
curl -X POST http://localhost:3000/api/products \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
# Should work if user is ADMIN/SUPER_ADMIN
```

### 4. Test Public Routes

```bash
# These should work without authentication
curl http://localhost:3000/
curl http://localhost:3000/menu
curl http://localhost:3000/api/products  # GET only
```

## Security Best Practices

1. **Never trust client-side checks alone** - Always validate on the server
2. **Use middleware for route-level protection** - Don't rely on component-level checks
3. **Validate permissions in API routes** - Even if middleware passes, double-check in handlers
4. **Log security events** - Track failed auth attempts and permission denials
5. **Keep roles granular** - Use permissions for fine-grained control
6. **Rotate session secrets** - Change NEXTAUTH_SECRET periodically
7. **Monitor for suspicious activity** - Check audit logs regularly

## Common Issues & Solutions

### Issue: Middleware not running
**Solution:** Check that your route matches the middleware config matcher

### Issue: Infinite redirect loop
**Solution:** Ensure public routes are properly defined and `/auth/signin` is public

### Issue: 401 on public API routes
**Solution:** Check that the route is in the `publicRoutes` array or matches public patterns

### Issue: User info headers not available in API route
**Solution:** Ensure middleware is running (check matcher config) and route requires auth

### Issue: Getting 403 instead of redirect on page routes
**Solution:** Check the pathname check logic in middleware

## Environment Variables

Required for middleware to work:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## Future Enhancements

Possible improvements to the middleware:

1. **Rate limiting** - Add rate limiting for API routes
2. **IP whitelisting** - Restrict admin access by IP
3. **Session tracking** - Track concurrent sessions
4. **Geo-blocking** - Restrict access by location
5. **Two-factor authentication** - Add 2FA checks
6. **Device fingerprinting** - Detect suspicious devices
7. **Custom permission checks** - More granular permissions beyond roles

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [AUTH_USAGE.md](./AUTH_USAGE.md) - Authentication hooks and utilities guide
