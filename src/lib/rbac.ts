import type { UserRole } from "@prisma/client";

/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * This module defines permissions and role hierarchies for the POS system.
 */

// ==================== PERMISSIONS ====================

/**
 * All available permissions in the system
 */
export enum Permission {
  // User Management
  USER_VIEW = "user:view",
  USER_CREATE = "user:create",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_MANAGE_ROLES = "user:manage_roles",

  // Product Management
  PRODUCT_VIEW = "product:view",
  PRODUCT_CREATE = "product:create",
  PRODUCT_UPDATE = "product:update",
  PRODUCT_DELETE = "product:delete",
  PRODUCT_MANAGE_INVENTORY = "product:manage_inventory",

  // Inventory Management
  INVENTORY_READ = "inventory:read",
  INVENTORY_UPDATE = "inventory:update",
  INVENTORY_DELETE = "inventory:delete",

  // Category Management
  CATEGORY_VIEW = "category:view",
  CATEGORY_CREATE = "category:create",
  CATEGORY_UPDATE = "category:update",
  CATEGORY_DELETE = "category:delete",

  // Order Management
  ORDER_VIEW = "order:view",
  ORDER_CREATE = "order:create",
  ORDER_UPDATE = "order:update",
  ORDER_DELETE = "order:delete",
  ORDER_CANCEL = "order:cancel",
  ORDER_REFUND = "order:refund",
  ORDER_VIEW_ALL = "order:view_all", // View all orders (not just own)

  // Payment Management
  PAYMENT_VIEW = "payment:view",
  PAYMENT_CREATE = "payment:create",
  PAYMENT_VERIFY = "payment:verify",
  PAYMENT_REFUND = "payment:refund",
  PAYMENT_VIEW_ALL = "payment:view_all",

  // Cash Drawer
  CASH_DRAWER_OPEN = "cash_drawer:open",
  CASH_DRAWER_CLOSE = "cash_drawer:close",
  CASH_DRAWER_VIEW = "cash_drawer:view",
  CASH_DRAWER_VIEW_ALL = "cash_drawer:view_all",

  // Reports & Analytics
  REPORT_SALES = "report:sales",
  REPORT_INVENTORY = "report:inventory",
  REPORT_FINANCIAL = "report:financial",
  REPORT_USER_ACTIVITY = "report:user_activity",
  REPORT_EXPORT = "report:export",

  // System Settings
  SETTINGS_VIEW = "settings:view",
  SETTINGS_UPDATE = "settings:update",
  SETTINGS_MANAGE_SYSTEM = "settings:manage_system",

  // Audit Logs
  AUDIT_VIEW = "audit:view",
  AUDIT_EXPORT = "audit:export",

  // Session Management
  SESSION_VIEW_OWN = "session:view_own",
  SESSION_VIEW_ALL = "session:view_all",
  SESSION_REVOKE_OWN = "session:revoke_own",
  SESSION_REVOKE_ALL = "session:revoke_all",
}

// ==================== ROLE DEFINITIONS ====================

/**
 * Permission sets for each role
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  // Super Admin - Full system access
  SUPER_ADMIN: [
    // All permissions
    ...Object.values(Permission),
  ],

  // Admin - Manage store operations
  ADMIN: [
    // User Management (limited - cannot create users)
    Permission.USER_VIEW,
    Permission.USER_UPDATE,
    // Permission.USER_CREATE removed - only SUPER_ADMIN can create users

    // Product Management
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_MANAGE_INVENTORY,

    // Inventory Management
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,

    // Category Management
    Permission.CATEGORY_VIEW,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,

    // Order Management
    Permission.ORDER_VIEW_ALL,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_CANCEL,
    Permission.ORDER_REFUND,

    // Payment Management
    Permission.PAYMENT_VIEW_ALL,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_VERIFY,
    Permission.PAYMENT_REFUND,

    // Cash Drawer
    Permission.CASH_DRAWER_OPEN,
    Permission.CASH_DRAWER_CLOSE,
    Permission.CASH_DRAWER_VIEW_ALL,

    // Reports
    Permission.REPORT_SALES,
    Permission.REPORT_INVENTORY,
    Permission.REPORT_FINANCIAL,
    Permission.REPORT_USER_ACTIVITY,
    Permission.REPORT_EXPORT,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,

    // Audit
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,

    // Sessions
    Permission.SESSION_VIEW_ALL,
    Permission.SESSION_REVOKE_ALL,
  ],

  // Cashier - Handle sales and orders
  CASHIER: [
    // Product (read only)
    Permission.PRODUCT_VIEW,

    // Inventory (read only)
    Permission.INVENTORY_READ,

    // Category (read only)
    Permission.CATEGORY_VIEW,

    // Order Management
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_CANCEL,

    // Payment Management
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_VERIFY,

    // Cash Drawer
    Permission.CASH_DRAWER_OPEN,
    Permission.CASH_DRAWER_CLOSE,
    Permission.CASH_DRAWER_VIEW,

    // Reports (limited)
    Permission.REPORT_SALES,

    // Sessions (own only)
    Permission.SESSION_VIEW_OWN,
    Permission.SESSION_REVOKE_OWN,
  ],

  // Staff - Basic operations
  STAFF: [
    // Product (read only)
    Permission.PRODUCT_VIEW,

    // Inventory (read only)
    Permission.INVENTORY_READ,

    // Category (read only)
    Permission.CATEGORY_VIEW,

    // Order Management (limited)
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,

    // Sessions (own only)
    Permission.SESSION_VIEW_OWN,
    Permission.SESSION_REVOKE_OWN,
  ],
};

// ==================== ROLE HIERARCHY ====================

/**
 * Role hierarchy (higher roles inherit permissions from lower roles)
 */
export const RoleHierarchy: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  CASHIER: 2,
  STAFF: 1,
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = RolePermissions[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return RolePermissions[role] || [];
}

/**
 * Check if role A is higher than role B in hierarchy
 */
export function isRoleHigher(roleA: UserRole, roleB: UserRole): boolean {
  return RoleHierarchy[roleA] > RoleHierarchy[roleB];
}

/**
 * Check if role A is higher or equal to role B
 */
export function isRoleHigherOrEqual(roleA: UserRole, roleB: UserRole): boolean {
  return RoleHierarchy[roleA] >= RoleHierarchy[roleB];
}

/**
 * Get the highest role from a list
 */
export function getHighestRole(roles: UserRole[]): UserRole | null {
  if (roles.length === 0) return null;

  return roles.reduce((highest, current) => {
    return isRoleHigher(current, highest) ? current : highest;
  });
}

/**
 * Check if a role can manage another role
 * (e.g., can assign/modify users with that role)
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  // Super admin can manage all roles
  if (managerRole === "SUPER_ADMIN") return true;

  // Admin can manage roles below them, but not SUPER_ADMIN
  if (managerRole === "ADMIN") {
    return targetRole !== "SUPER_ADMIN";
  }

  // Others cannot manage roles
  return false;
}

/**
 * Get roles that a user can assign
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  const allRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"];

  return allRoles.filter((role) => canManageRole(userRole, role));
}

/**
 * Check if user can perform action on resource owned by another user
 */
export function canAccessResource(
  userRole: UserRole,
  resourceOwnerId: string,
  currentUserId: string,
  permission: Permission
): boolean {
  // Check if user has the permission
  if (!hasPermission(userRole, permission)) {
    return false;
  }

  // If it's their own resource, they can access it
  if (resourceOwnerId === currentUserId) {
    return true;
  }

  // Check if they have "view all" or "manage all" permissions
  // This is a simplified check - you might want more granular control
  const viewAllPermissions = [
    Permission.ORDER_VIEW_ALL,
    Permission.PAYMENT_VIEW_ALL,
    Permission.CASH_DRAWER_VIEW_ALL,
    Permission.SESSION_VIEW_ALL,
  ];

  return hasAnyPermission(userRole, viewAllPermissions);
}

/**
 * Validate permission string
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permission).includes(permission as Permission);
}

/**
 * Get permission category from permission string
 */
export function getPermissionCategory(permission: Permission): string {
  return permission.split(":")[0];
}

/**
 * Get permission action from permission string
 */
export function getPermissionAction(permission: Permission): string {
  return permission.split(":")[1];
}

/**
 * Get all permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};

  Object.values(Permission).forEach((permission) => {
    const category = getPermissionCategory(permission);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  });

  return grouped;
}

/**
 * Format permission for display
 */
export function formatPermission(permission: Permission): string {
  const [category, action] = permission.split(":");
  const formattedCategory = category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  const formattedAction = action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return `${formattedCategory}: ${formattedAction}`;
}

/**
 * Format role for display
 */
export function formatRole(role: UserRole): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ==================== PERMISSION GROUPS ====================

/**
 * Commonly used permission groups
 */
export const PermissionGroups = {
  // All user-related permissions
  USER_MANAGEMENT: [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
  ],

  // All product-related permissions
  PRODUCT_MANAGEMENT: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_MANAGE_INVENTORY,
  ],

  // All order-related permissions
  ORDER_MANAGEMENT: [
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_CANCEL,
    Permission.ORDER_REFUND,
    Permission.ORDER_VIEW_ALL,
  ],

  // All report permissions
  REPORTING: [
    Permission.REPORT_SALES,
    Permission.REPORT_INVENTORY,
    Permission.REPORT_FINANCIAL,
    Permission.REPORT_USER_ACTIVITY,
    Permission.REPORT_EXPORT,
  ],

  // Read-only permissions
  READ_ONLY: [
    Permission.PRODUCT_VIEW,
    Permission.CATEGORY_VIEW,
    Permission.ORDER_VIEW,
    Permission.PAYMENT_VIEW,
    Permission.SETTINGS_VIEW,
  ],
};
