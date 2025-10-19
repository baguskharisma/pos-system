# Role-Based Access Control (RBAC) Guide

Complete guide to the RBAC system implementation in the POS application.

## Table of Contents

1. [Overview](#overview)
2. [Roles and Permissions](#roles-and-permissions)
3. [Server-Side Usage](#server-side-usage)
4. [Client-Side Usage](#client-side-usage)
5. [API Examples](#api-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The POS System implements a comprehensive Role-Based Access Control (RBAC) system with:

- **4 role levels**: SUPER_ADMIN, ADMIN, CASHIER, STAFF
- **60+ granular permissions** across all system resources
- **Server-side enforcement** via middleware
- **Client-side guards** for conditional rendering
- **Audit logging** for permission denials
- **Role hierarchy** for inheritance and management

### Key Files

- `src/lib/rbac.ts` - Permission and role definitions
- `src/lib/rbac-middleware.ts` - Server-side middleware
- `src/hooks/usePermissions.ts` - Client-side permission hooks
- `src/components/auth/RoleGuard.tsx` - React guard components

## Roles and Permissions

### Role Hierarchy

```
SUPER_ADMIN (Level 4) - Full system access
    ↓
ADMIN (Level 3) - Manage store operations
    ↓
CASHIER (Level 2) - Handle sales and orders
    ↓
STAFF (Level 1) - Basic operations
```

### Permission Categories

#### User Management
```typescript
Permission.USER_VIEW              // View users
Permission.USER_CREATE            // Create users
Permission.USER_UPDATE            // Update users
Permission.USER_DELETE            // Delete users
Permission.USER_MANAGE_ROLES      // Assign roles
```

#### Product Management
```typescript
Permission.PRODUCT_VIEW                 // View products
Permission.PRODUCT_CREATE               // Create products
Permission.PRODUCT_UPDATE               // Update products
Permission.PRODUCT_DELETE               // Delete products
Permission.PRODUCT_MANAGE_INVENTORY     // Manage inventory
```

#### Order Management
```typescript
Permission.ORDER_VIEW          // View own orders
Permission.ORDER_CREATE        // Create orders
Permission.ORDER_UPDATE        // Update orders
Permission.ORDER_DELETE        // Delete orders
Permission.ORDER_CANCEL        // Cancel orders
Permission.ORDER_REFUND        // Process refunds
Permission.ORDER_VIEW_ALL      // View all orders
```

#### Payment Management
```typescript
Permission.PAYMENT_VIEW           // View own payments
Permission.PAYMENT_CREATE         // Create payments
Permission.PAYMENT_VERIFY         // Verify payments
Permission.PAYMENT_REFUND         // Process refunds
Permission.PAYMENT_VIEW_ALL       // View all payments
```

#### Reports & Analytics
```typescript
Permission.REPORT_SALES             // View sales reports
Permission.REPORT_INVENTORY         // View inventory reports
Permission.REPORT_FINANCIAL         // View financial reports
Permission.REPORT_USER_ACTIVITY     // View user activity
Permission.REPORT_EXPORT            // Export reports
```

#### Settings & System
```typescript
Permission.SETTINGS_VIEW             // View settings
Permission.SETTINGS_UPDATE           // Update settings
Permission.SETTINGS_MANAGE_SYSTEM    // System configuration
```

### Role Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | CASHIER | STAFF |
|------------|-------------|-------|---------|-------|
| USER_CREATE | ✅ | ❌ | ❌ | ❌ |
| USER_UPDATE | ✅ | ✅ | ❌ | ❌ |
| USER_DELETE | ✅ | ❌ | ❌ | ❌ |
| PRODUCT_CREATE | ✅ | ✅ | ❌ | ❌ |
| PRODUCT_VIEW | ✅ | ✅ | ✅ | ✅ |
| ORDER_CREATE | ✅ | ✅ | ✅ | ✅ |
| ORDER_VIEW_ALL | ✅ | ✅ | ❌ | ❌ |
| PAYMENT_VERIFY | ✅ | ✅ | ✅ | ❌ |
| REPORT_FINANCIAL | ✅ | ✅ | ❌ | ❌ |
| SETTINGS_UPDATE | ✅ | ✅ | ❌ | ❌ |

## Server-Side Usage

### 1. Basic Permission Check

```typescript
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";

export const GET = withRBAC(
  async (request, context) => {
    // context.userId, context.role available
    return NextResponse.json({ data: "protected" });
  },
  {
    permissions: [Permission.USER_VIEW],
  }
);
```

### 2. Multiple Permissions (Require ALL)

```typescript
export const POST = withRBAC(
  async (request, context) => {
    // User must have BOTH permissions
    return NextResponse.json({ created: true });
  },
  {
    permissions: [Permission.USER_CREATE, Permission.USER_MANAGE_ROLES],
  }
);
```

### 3. Alternative Permissions (Require ANY)

```typescript
export const GET = withRBAC(
  async (request, context) => {
    // User must have AT LEAST ONE permission
    return NextResponse.json({ data: "report" });
  },
  {
    anyPermissions: [
      Permission.REPORT_SALES,
      Permission.REPORT_INVENTORY,
      Permission.REPORT_FINANCIAL,
    ],
  }
);
```

### 4. Role-Based Access

```typescript
import { requireAdmin, requireSuperAdmin } from "@/lib/rbac-middleware";

// Admin or Super Admin only
export const DELETE = requireAdmin(async (request, context) => {
  return NextResponse.json({ deleted: true });
});

// Super Admin only
export const POST = requireSuperAdmin(async (request, context) => {
  return NextResponse.json({ created: true });
});
```

### 5. Minimum Role Level

```typescript
export const GET = withRBAC(
  async (request, context) => {
    // User must be at least CASHIER level
    return NextResponse.json({ data: "cashier+" });
  },
  {
    minRole: "CASHIER",
  }
);
```

### 6. Custom Permission Check

```typescript
export const GET = withRBAC(
  async (request, context) => {
    return NextResponse.json({ data: "custom" });
  },
  {
    permissions: [Permission.ORDER_VIEW],
    customCheck: async (context) => {
      // Additional custom validation
      const hasActiveShift = await checkActiveShift(context.userId);
      return hasActiveShift;
    },
  }
);
```

### 7. Resource Ownership Check

```typescript
import { requireResourceOwnership } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";

export const GET = requireResourceOwnership(
  async (request) => {
    // Extract order owner ID from request
    const orderId = request.nextUrl.pathname.split("/").pop();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { cashierId: true },
    });
    return order?.cashierId || null;
  },
  Permission.ORDER_VIEW_ALL // Permission needed to view others' resources
)(async (request, context) => {
  // User can access their own orders
  // OR has ORDER_VIEW_ALL permission
  return NextResponse.json({ order: "data" });
});
```

### 8. Permission Decorators

```typescript
import {
  requirePermissions,
  requireAnyPermission,
  requireRoles,
} from "@/lib/rbac-middleware";

// Single decorator style
export const POST = requirePermissions(Permission.USER_CREATE)(
  async (request, context) => {
    return NextResponse.json({ created: true });
  }
);

// Multiple decorators can be chained
export const DELETE = requireRoles("SUPER_ADMIN", "ADMIN")(
  async (request, context) => {
    return NextResponse.json({ deleted: true });
  }
);
```

### 9. Role Management Checks

```typescript
import { canManageRole, getAssignableRoles } from "@/lib/rbac";

export const POST = withRBAC(async (request, context) => {
  const { targetRole } = await request.json();

  // Check if user can assign this role
  if (!canManageRole(context.role, targetRole)) {
    return NextResponse.json(
      { error: "Cannot assign this role" },
      { status: 403 }
    );
  }

  // Get all roles this user can assign
  const assignableRoles = getAssignableRoles(context.role);

  return NextResponse.json({ assignableRoles });
});
```

## Client-Side Usage

### 1. Permission Hook

```typescript
"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/rbac";

export function UserManagement() {
  const { can, isAdmin, role } = usePermissions();

  return (
    <div>
      <h1>User Management</h1>

      {can(Permission.USER_CREATE) && (
        <button>Create User</button>
      )}

      {can(Permission.USER_DELETE) && (
        <button>Delete User</button>
      )}

      {isAdmin && <AdminPanel />}

      <p>Your role: {role}</p>
    </div>
  );
}
```

### 2. Permission Guard Components

```typescript
import { PermissionGuard, Can } from "@/components/auth/RoleGuard";
import { Permission } from "@/lib/rbac";

export function Dashboard() {
  return (
    <div>
      {/* Show only if user has permission */}
      <PermissionGuard permissions={[Permission.USER_VIEW]}>
        <UserList />
      </PermissionGuard>

      {/* Shorter syntax with Can component */}
      <Can permission={Permission.PRODUCT_CREATE}>
        <CreateProductButton />
      </Can>

      {/* With fallback */}
      <Can
        permission={Permission.REPORT_FINANCIAL}
        fallback={<p>Access denied</p>}
      >
        <FinancialReport />
      </Can>
    </div>
  );
}
```

### 3. Role Guard Components

```typescript
import {
  RoleGuard,
  AdminGuard,
  SuperAdminGuard,
} from "@/components/auth/RoleGuard";

export function Settings() {
  return (
    <div>
      {/* Show for specific roles */}
      <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
        <AdminSettings />
      </RoleGuard>

      {/* Shorter syntax for admins */}
      <AdminGuard>
        <AdminPanel />
      </AdminGuard>

      {/* Super admin only */}
      <SuperAdminGuard>
        <SystemSettings />
      </SuperAdminGuard>
    </div>
  );
}
```

### 4. Conditional Rendering

```typescript
import { ShowForRoles, HideForRoles } from "@/components/auth/RoleGuard";

export function Navigation() {
  return (
    <nav>
      <a href="/">Home</a>

      {/* Show only for specific roles */}
      <ShowForRoles roles={["CASHIER", "ADMIN"]}>
        <a href="/orders">Orders</a>
      </ShowForRoles>

      {/* Hide for specific roles */}
      <HideForRoles roles={["STAFF"]}>
        <a href="/reports">Reports</a>
      </HideForRoles>
    </nav>
  );
}
```

### 5. Multiple Permission Checks

```typescript
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/rbac";

export function OrderActions() {
  const { can, canAny, canAll } = usePermissions();

  // Check multiple permissions (must have ALL)
  const canManageOrders = canAll([
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
  ]);

  // Check multiple permissions (must have ANY)
  const canViewOrders = canAny([
    Permission.ORDER_VIEW,
    Permission.ORDER_VIEW_ALL,
  ]);

  return (
    <div>
      {canViewOrders && <OrderList />}
      {canManageOrders && <OrderManagementPanel />}
    </div>
  );
}
```

### 6. Role Hierarchy Checks

```typescript
import { usePermissions } from "@/hooks/usePermissions";

export function UserForm({ targetUser }) {
  const { isHigherRole, canManage } = usePermissions();

  // Check if current user's role is higher
  const canEdit = isHigherRole(targetUser.role);

  // Check if can manage this role
  const canAssignRole = canManage(targetUser.role);

  return (
    <form>
      <input disabled={!canEdit} />
      {canAssignRole && <RoleSelect />}
    </form>
  );
}
```

### 7. Loading and Error States

```typescript
import { usePermissions } from "@/hooks/usePermissions";

export function ProtectedPage() {
  const { isAuthenticated, isLoading, can } = usePermissions();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  if (!can(Permission.USER_VIEW)) {
    return <div>Access denied</div>;
  }

  return <div>Protected content</div>;
}
```

## API Examples

### Example 1: User Management API

```typescript
// GET /api/admin/users - List users
export const GET = withRBAC(
  async (request, context) => {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
    });
    return NextResponse.json({ users });
  },
  { permissions: [Permission.USER_VIEW] }
);

// POST /api/admin/users - Create user
export const POST = withRBAC(
  async (request, context) => {
    const data = await request.json();
    const user = await prisma.user.create({ data });
    return NextResponse.json({ user }, { status: 201 });
  },
  { permissions: [Permission.USER_CREATE] }
);

// DELETE /api/admin/users/[id] - Delete user
export const DELETE = withRBAC(
  async (request, context, { params }) => {
    const { id } = params;

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    // Check if can manage this role
    if (!canManageRole(context.role, targetUser.role)) {
      return NextResponse.json(
        { error: "Cannot delete users with this role" },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  },
  { permissions: [Permission.USER_DELETE] }
);
```

### Example 2: Sales Report with Role-Based Filtering

```typescript
// Cashiers see only their sales
// Admins see all sales
export const GET = withRBAC(
  async (request, context) => {
    const where: any = { status: "COMPLETED" };

    // Role-based filtering
    if (context.role === "CASHIER") {
      where.cashierId = context.userId;
    }

    const orders = await prisma.order.findMany({ where });
    return NextResponse.json({ orders });
  },
  { permissions: [Permission.REPORT_SALES] }
);
```

### Example 3: Multi-Level Access

```typescript
export const GET = withRBAC(
  async (request, context) => {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted");

    // Only admins can see deleted records
    const where: any = {};
    if (includeDeleted !== "true" || context.role === "CASHIER") {
      where.deletedAt = null;
    }

    const products = await prisma.product.findMany({ where });
    return NextResponse.json({ products });
  },
  {
    anyPermissions: [
      Permission.PRODUCT_VIEW,
      Permission.PRODUCT_MANAGE_INVENTORY,
    ],
  }
);
```

## Best Practices

### 1. Always Use Permissions, Not Roles

❌ **Bad:**
```typescript
if (user.role === "ADMIN") {
  // Allow action
}
```

✅ **Good:**
```typescript
if (hasPermission(user.role, Permission.USER_DELETE)) {
  // Allow action
}
```

### 2. Server-Side Enforcement is Mandatory

Always protect API routes with RBAC middleware:

```typescript
// ✅ Protected
export const DELETE = withRBAC(
  async (request, context) => {
    // ...
  },
  { permissions: [Permission.USER_DELETE] }
);

// ❌ Not protected - security vulnerability!
export async function DELETE(request: NextRequest) {
  // Anyone can delete!
}
```

### 3. Client-Side Guards are for UX Only

Client-side guards improve UX but don't provide security:

```typescript
// Client-side: Hide button (UX)
<Can permission={Permission.USER_DELETE}>
  <DeleteButton />
</Can>

// Server-side: Enforce permission (Security)
export const DELETE = withRBAC(
  handler,
  { permissions: [Permission.USER_DELETE] }
);
```

### 4. Use Granular Permissions

Prefer specific permissions over broad ones:

```typescript
// ✅ Granular
permissions: [Permission.ORDER_REFUND]

// ❌ Too broad
permissions: [Permission.ORDER_UPDATE]
```

### 5. Check Resource Ownership

For user-specific resources, verify ownership:

```typescript
export const GET = withRBAC(async (request, context) => {
  const orderId = params.id;
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  // Check ownership
  if (
    order.cashierId !== context.userId &&
    !hasPermission(context.role, Permission.ORDER_VIEW_ALL)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
});
```

### 6. Audit Permission Denials

Log when permissions are denied:

```typescript
import { withRBACAndAudit } from "@/lib/rbac-middleware";

export const DELETE = withRBACAndAudit(
  handler,
  {
    permissions: [Permission.USER_DELETE],
    auditAction: "DELETE_USER",
  }
);
```

### 7. Handle Permission Updates

When roles/permissions change:

```typescript
// After updating user role
await prisma.user.update({
  where: { id: userId },
  data: { role: newRole },
});

// Force token refresh
await prisma.session.deleteMany({
  where: { userId },
});

// User will get new permissions on next sign-in
```

## Troubleshooting

### Permission Denied But User Should Have Access

1. **Check user's role:**
   ```typescript
   const user = await prisma.user.findUnique({
     where: { id: userId },
     select: { role: true },
   });
   console.log("User role:", user.role);
   ```

2. **Check role permissions:**
   ```typescript
   import { getRolePermissions } from "@/lib/rbac";
   console.log("Permissions:", getRolePermissions(user.role));
   ```

3. **Verify permission check:**
   ```typescript
   import { hasPermission } from "@/lib/rbac";
   console.log(
     "Has permission:",
     hasPermission(user.role, Permission.USER_VIEW)
   );
   ```

### Client-Side Permissions Not Updating

The session may be cached. Force refresh:

```typescript
import { useSession } from "next-auth/react";

const { update } = useSession();
await update(); // Force session refresh
```

### User Can't Manage Certain Roles

Check role hierarchy:

```typescript
import { canManageRole } from "@/lib/rbac";

// Admins cannot manage SUPER_ADMIN
console.log(canManageRole("ADMIN", "SUPER_ADMIN")); // false

// Super admins can manage all roles
console.log(canManageRole("SUPER_ADMIN", "ADMIN")); // true
```

### Permission Checks Slow

Permissions are computed from roles, not stored. For better performance:

1. Cache role permissions:
   ```typescript
   const userPermissions = useMemo(
     () => getRolePermissions(role),
     [role]
   );
   ```

2. Use specific permission checks:
   ```typescript
   // ✅ Fast
   if (can(Permission.USER_VIEW)) { }

   // ❌ Slower
   if (canAll([Permission.USER_VIEW, Permission.USER_CREATE, ...])) { }
   ```

## Testing RBAC

### Unit Tests

```typescript
import { hasPermission, canManageRole } from "@/lib/rbac";
import { Permission } from "@/lib/rbac";

describe("RBAC", () => {
  it("super admin has all permissions", () => {
    expect(hasPermission("SUPER_ADMIN", Permission.USER_DELETE)).toBe(true);
  });

  it("cashier cannot delete users", () => {
    expect(hasPermission("CASHIER", Permission.USER_DELETE)).toBe(false);
  });

  it("admin cannot manage super admin", () => {
    expect(canManageRole("ADMIN", "SUPER_ADMIN")).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { testApiHandler } from "next-test-api-route-handler";

describe("User Management API", () => {
  it("allows admin to create users", async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ email: "test@example.com" }),
        });

        expect(res.status).toBe(201);
      },
    });
  });

  it("denies cashier from creating users", async () => {
    // Similar test with cashier token
    expect(res.status).toBe(403);
  });
});
```

## Related Documentation

- [JWT Configuration Guide](./JWT_CONFIGURATION.md)
- [Session Management Guide](./SESSION_MANAGEMENT.md)
- [API Documentation](./API_DOCUMENTATION.md)
