# RBAC Implementation Summary

Quick reference guide for the Role-Based Access Control system.

## 🎯 Quick Start

### Server-Side Protection

```typescript
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";

export const GET = withRBAC(
  async (request, context) => {
    // Your handler code
    return NextResponse.json({ data: "protected" });
  },
  {
    permissions: [Permission.USER_VIEW],
  }
);
```

### Client-Side Permission Check

```typescript
"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/rbac";

export function MyComponent() {
  const { can } = usePermissions();

  return (
    <div>
      {can(Permission.USER_CREATE) && <CreateButton />}
    </div>
  );
}
```

### Guard Component

```typescript
import { PermissionGuard } from "@/components/auth/RoleGuard";
import { Permission } from "@/lib/rbac";

<PermissionGuard permissions={[Permission.USER_VIEW]}>
  <UserList />
</PermissionGuard>
```

## 📋 Roles

| Role | Level | Description |
|------|-------|-------------|
| SUPER_ADMIN | 4 | Full system access |
| ADMIN | 3 | Manage store operations |
| CASHIER | 2 | Handle sales and orders |
| STAFF | 1 | Basic operations |

## 🔑 Common Permissions

### User Management
- `Permission.USER_VIEW` - View users
- `Permission.USER_CREATE` - Create users (SUPER_ADMIN only)
- `Permission.USER_UPDATE` - Update users
- `Permission.USER_DELETE` - Delete users (SUPER_ADMIN only)

### Product Management
- `Permission.PRODUCT_VIEW` - View products
- `Permission.PRODUCT_CREATE` - Create products
- `Permission.PRODUCT_UPDATE` - Update products
- `Permission.PRODUCT_MANAGE_INVENTORY` - Manage inventory

### Order Management
- `Permission.ORDER_VIEW` - View own orders
- `Permission.ORDER_CREATE` - Create orders
- `Permission.ORDER_VIEW_ALL` - View all orders
- `Permission.ORDER_REFUND` - Process refunds

### Reports
- `Permission.REPORT_SALES` - View sales reports
- `Permission.REPORT_FINANCIAL` - View financial reports
- `Permission.REPORT_EXPORT` - Export reports

## 🛡️ Server-Side Patterns

### 1. Basic Permission

```typescript
export const GET = withRBAC(handler, {
  permissions: [Permission.USER_VIEW],
});
```

### 2. Multiple Permissions (ALL)

```typescript
export const POST = withRBAC(handler, {
  permissions: [Permission.USER_CREATE, Permission.USER_MANAGE_ROLES],
});
```

### 3. Alternative Permissions (ANY)

```typescript
export const GET = withRBAC(handler, {
  anyPermissions: [Permission.ORDER_VIEW, Permission.ORDER_VIEW_ALL],
});
```

### 4. Role-Based

```typescript
import { requireAdmin } from "@/lib/rbac-middleware";

export const DELETE = requireAdmin(handler);
```

### 5. Minimum Role

```typescript
export const GET = withRBAC(handler, {
  minRole: "CASHIER",
});
```

## 💻 Client-Side Patterns

### 1. Hook-Based

```typescript
const { can, isAdmin, role } = usePermissions();

if (can(Permission.USER_DELETE)) {
  // Show delete button
}

if (isAdmin) {
  // Show admin panel
}
```

### 2. Guard Component

```typescript
<PermissionGuard permissions={[Permission.USER_VIEW]}>
  <UserList />
</PermissionGuard>

<AdminGuard>
  <AdminPanel />
</AdminGuard>
```

### 3. Conditional Rendering

```typescript
<Can permission={Permission.USER_CREATE}>
  <CreateButton />
</Can>

<ShowForRoles roles={["ADMIN", "SUPER_ADMIN"]}>
  <AdminTools />
</ShowForRoles>
```

## 🔄 Common Tasks

### Check Permission

```typescript
import { hasPermission } from "@/lib/rbac";

const canDelete = hasPermission(userRole, Permission.USER_DELETE);
```

### Check Role Hierarchy

```typescript
import { isRoleHigher, canManageRole } from "@/lib/rbac";

const isHigher = isRoleHigher("ADMIN", "CASHIER"); // true
const canManage = canManageRole("ADMIN", "SUPER_ADMIN"); // false
```

### Get All Permissions

```typescript
import { getRolePermissions } from "@/lib/rbac";

const permissions = getRolePermissions("CASHIER");
```

### Check Resource Ownership

```typescript
import { canAccessUserResource } from "@/lib/rbac-middleware";

const canAccess = await canAccessUserResource(
  currentUserId,
  resourceOwnerId,
  Permission.ORDER_VIEW_ALL
);
```

## 📁 File Structure

```
src/
├── lib/
│   ├── rbac.ts                  # Permissions & roles
│   └── rbac-middleware.ts       # Server-side middleware
├── hooks/
│   └── usePermissions.ts        # Client-side hooks
├── components/
│   └── auth/
│       └── RoleGuard.tsx        # Guard components
└── app/api/
    ├── admin/users/             # Example: User management
    │   ├── route.ts
    │   └── [id]/route.ts
    └── reports/sales/           # Example: Sales report
        └── route.ts
```

## 🚨 Important Rules

1. **Always protect API routes** - Never skip RBAC middleware
2. **Use permissions, not roles** - Check permissions, not role names
3. **Server-side is mandatory** - Client-side is for UX only
4. **Check resource ownership** - Verify users can only access their resources
5. **Audit permission denials** - Log security-related denials

## 🔍 Debugging

### Check User Permissions

```typescript
import { getRolePermissions } from "@/lib/rbac";

console.log("User permissions:", getRolePermissions(user.role));
```

### Check Specific Permission

```typescript
import { hasPermission } from "@/lib/rbac";

console.log(
  "Can delete users:",
  hasPermission(user.role, Permission.USER_DELETE)
);
```

### Force Session Refresh

```typescript
import { useSession } from "next-auth/react";

const { update } = useSession();
await update(); // Refresh permissions
```

## 📚 Full Documentation

For complete documentation, see [RBAC_GUIDE.md](./RBAC_GUIDE.md)

## 🔗 Related

- [JWT Configuration](./JWT_CONFIGURATION.md)
- [Session Management](./SESSION_MANAGEMENT.md)
- [Password Security](./src/lib/password.ts)
