import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleHigherOrEqual,
  canManageRole,
} from "./rbac";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";
import type { AuthContext } from "./auth-middleware";

/**
 * RBAC Middleware Options
 */
export interface RBACOptions {
  // Required permissions (user must have ALL of these)
  permissions?: Permission[];

  // Alternative permissions (user must have ANY of these)
  anyPermissions?: Permission[];

  // Required roles (user must have ONE of these)
  roles?: UserRole[];

  // Minimum role level required
  minRole?: UserRole;

  // Check if user can manage the target role
  canManageRole?: UserRole;

  // Custom permission check function
  customCheck?: (context: AuthContext) => Promise<boolean>;

  // Error messages
  forbiddenMessage?: string;
  unauthorizedMessage?: string;
}

/**
 * RBAC Result
 */
export interface RBACResult {
  authorized: boolean;
  user?: AuthContext;
  error?: string;
  missingPermissions?: Permission[];
}

/**
 * Check if user has required RBAC permissions
 */
export async function checkRBAC(options: RBACOptions = {}): Promise<RBACResult> {
  const {
    permissions = [],
    anyPermissions = [],
    roles = [],
    minRole,
    canManageRole: targetRole,
    customCheck,
    forbiddenMessage = "Forbidden. Insufficient permissions.",
    unauthorizedMessage = "Unauthorized. Please sign in.",
  } = options;

  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return {
        authorized: false,
        error: unauthorizedMessage,
      };
    }

    const user = session.user;

    // Check if user is active
    if (!user.isActive) {
      return {
        authorized: false,
        error: "Account is inactive.",
      };
    }

    const authContext: AuthContext = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isActive: user.isActive,
    };

    // Check specific roles
    if (roles.length > 0 && !roles.includes(user.role)) {
      return {
        authorized: false,
        error: forbiddenMessage,
      };
    }

    // Check minimum role level
    if (minRole && !isRoleHigherOrEqual(user.role, minRole)) {
      return {
        authorized: false,
        error: forbiddenMessage,
      };
    }

    // Check if user can manage target role
    if (targetRole && !canManageRole(user.role, targetRole)) {
      return {
        authorized: false,
        error: `You cannot manage users with ${targetRole} role.`,
      };
    }

    // Check required permissions (must have ALL)
    if (permissions.length > 0) {
      const missingPermissions = permissions.filter(
        (permission) => !hasPermission(user.role, permission)
      );

      if (missingPermissions.length > 0) {
        return {
          authorized: false,
          error: forbiddenMessage,
          missingPermissions,
        };
      }
    }

    // Check alternative permissions (must have ANY)
    if (anyPermissions.length > 0) {
      if (!hasAnyPermission(user.role, anyPermissions)) {
        return {
          authorized: false,
          error: forbiddenMessage,
          missingPermissions: anyPermissions,
        };
      }
    }

    // Custom check
    if (customCheck) {
      const customResult = await customCheck(authContext);
      if (!customResult) {
        return {
          authorized: false,
          error: forbiddenMessage,
        };
      }
    }

    return {
      authorized: true,
      user: authContext,
    };
  } catch (error) {
    console.error("RBAC check error:", error);
    return {
      authorized: false,
      error: "Authorization check failed.",
    };
  }
}

/**
 * Higher-order function to wrap API routes with RBAC
 */
export function withRBAC(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options: RBACOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const result = await checkRBAC(options);

    if (!result.authorized || !result.user) {
      const status = result.error?.includes("Unauthorized") ? 401 : 403;

      return NextResponse.json(
        {
          error: result.error || "Access denied",
          missingPermissions: result.missingPermissions,
        },
        { status }
      );
    }

    // Merge auth context with Next.js route context (which includes params)
    const mergedContext = {
      ...result.user,
      ...context,
    };

    return handler(request, mergedContext);
  };
}

/**
 * Require specific permissions
 */
export function requirePermissions(...permissions: Permission[]) {
  return (
    handler: (request: NextRequest, context: AuthContext) => Promise<Response>
  ) => {
    return withRBAC(handler, { permissions });
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (
    handler: (request: NextRequest, context: AuthContext) => Promise<Response>
  ) => {
    return withRBAC(handler, { anyPermissions: permissions });
  };
}

/**
 * Require specific roles
 */
export function requireRoles(...roles: UserRole[]) {
  return (
    handler: (request: NextRequest, context: AuthContext) => Promise<Response>
  ) => {
    return withRBAC(handler, { roles });
  };
}

/**
 * Require minimum role level
 */
export function requireMinRole(minRole: UserRole) {
  return (
    handler: (request: NextRequest, context: AuthContext) => Promise<Response>
  ) => {
    return withRBAC(handler, { minRole });
  };
}

/**
 * Admin only access
 */
export function requireAdmin(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withRBAC(handler, {
    roles: ["SUPER_ADMIN", "ADMIN"],
  });
}

/**
 * Super admin only access
 */
export function requireSuperAdmin(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withRBAC(handler, {
    roles: ["SUPER_ADMIN"],
  });
}

/**
 * Check if authenticated user can access a resource owned by another user
 */
export async function canAccessUserResource(
  authenticatedUserId: string,
  resourceOwnerId: string,
  requiredPermission: Permission
): Promise<boolean> {
  // User can always access their own resources
  if (authenticatedUserId === resourceOwnerId) {
    return true;
  }

  // Get authenticated user's role
  const user = await prisma.user.findUnique({
    where: { id: authenticatedUserId },
    select: { role: true },
  });

  if (!user) {
    return false;
  }

  // Check if user has permission to access others' resources
  return hasPermission(user.role, requiredPermission);
}

/**
 * Middleware to check resource ownership
 */
export function requireResourceOwnership(
  getResourceOwnerId: (request: NextRequest) => Promise<string | null>,
  viewAllPermission: Permission
) {
  return (
    handler: (request: NextRequest, context: AuthContext) => Promise<Response>
  ) => {
    return async (request: NextRequest, routeContext?: any): Promise<Response> => {
      const result = await checkRBAC({});

      if (!result.authorized || !result.user) {
        return NextResponse.json(
          { error: result.error || "Unauthorized" },
          { status: 401 }
        );
      }

      // Get resource owner ID
      const ownerId = await getResourceOwnerId(request);

      if (!ownerId) {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        );
      }

      // Check if user can access this resource
      const canAccess = await canAccessUserResource(
        result.user.userId,
        ownerId,
        viewAllPermission
      );

      if (!canAccess) {
        return NextResponse.json(
          { error: "Forbidden. You can only access your own resources." },
          { status: 403 }
        );
      }

      // Merge auth context with Next.js route context
      const mergedContext = {
        ...result.user,
        ...routeContext,
      };

      return handler(request, mergedContext);
    };
  };
}

/**
 * Check permissions without throwing errors (for conditional rendering)
 */
export async function checkUserPermissions(
  userId: string,
  permissions: Permission[]
): Promise<{ hasPermission: boolean; role: UserRole | null }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true, deletedAt: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      return { hasPermission: false, role: null };
    }

    const hasAllPerms = permissions.every((permission) =>
      hasPermission(user.role, permission)
    );

    return { hasPermission: hasAllPerms, role: user.role };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return { hasPermission: false, role: null };
  }
}

/**
 * Audit log for permission denials
 */
async function logPermissionDenial(
  userId: string,
  attemptedAction: string,
  requiredPermissions: Permission[]
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PERMISSION_DENIED",
        entityType: "SECURITY",
        metadata: {
          attemptedAction,
          requiredPermissions,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to log permission denial:", error);
  }
}

/**
 * Middleware with permission denial logging
 */
export function withRBACAndAudit(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options: RBACOptions & { auditAction?: string } = {}
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const result = await checkRBAC(options);

    if (!result.authorized) {
      // Log permission denial
      if (result.user && options.auditAction) {
        await logPermissionDenial(
          result.user.userId,
          options.auditAction,
          result.missingPermissions || []
        );
      }

      const status = result.error?.includes("Unauthorized") ? 401 : 403;
      return NextResponse.json(
        {
          error: result.error || "Access denied",
          missingPermissions: result.missingPermissions,
        },
        { status }
      );
    }

    // Merge auth context with Next.js route context (which includes params)
    const mergedContext = {
      ...result.user!,
      ...context,
    };

    return handler(request, mergedContext);
  };
}
