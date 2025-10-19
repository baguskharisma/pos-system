import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { verifyToken, extractTokenFromHeader, TokenType } from "./jwt";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

/**
 * Auth middleware options
 */
export interface AuthMiddlewareOptions {
  allowedRoles?: UserRole[];
  requireEmailVerification?: boolean;
  checkActiveStatus?: boolean;
}

/**
 * Authenticated user context
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  sessionId?: string;
}

/**
 * Result of authentication check
 */
export interface AuthResult {
  authenticated: boolean;
  user?: AuthContext;
  error?: string;
}

/**
 * Middleware to check authentication using NextAuth session
 */
export async function requireAuth(
  options: AuthMiddlewareOptions = {}
): Promise<AuthResult> {
  const {
    allowedRoles,
    requireEmailVerification = false,
    checkActiveStatus = true,
  } = options;

  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return {
        authenticated: false,
        error: "Unauthorized. Please sign in.",
      };
    }

    const user = session.user;

    // Check if user is active
    if (checkActiveStatus && !user.isActive) {
      return {
        authenticated: false,
        error: "Account is inactive. Please contact administrator.",
      };
    }

    // Check role permissions
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        return {
          authenticated: false,
          error: "Forbidden. Insufficient permissions.",
        };
      }
    }

    // Verify user still exists and is active in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        deletedAt: true,
        emailVerified: true,
      },
    });

    if (!dbUser || dbUser.deletedAt) {
      return {
        authenticated: false,
        error: "User account not found or has been deleted.",
      };
    }

    if (checkActiveStatus && !dbUser.isActive) {
      return {
        authenticated: false,
        error: "Account is inactive.",
      };
    }

    if (requireEmailVerification && !dbUser.emailVerified) {
      return {
        authenticated: false,
        error: "Email verification required.",
      };
    }

    return {
      authenticated: true,
      user: {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.name,
        isActive: dbUser.isActive,
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      authenticated: false,
      error: "Authentication failed.",
    };
  }
}

/**
 * Middleware to check authentication using JWT token from Authorization header
 * Useful for API routes that don't use NextAuth sessions
 */
export async function requireApiAuth(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthResult> {
  const {
    allowedRoles,
    requireEmailVerification = false,
    checkActiveStatus = true,
  } = options;

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        authenticated: false,
        error: "Authorization token required.",
      };
    }

    // Verify token
    const payload = await verifyToken(token, TokenType.ACCESS);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        deletedAt: true,
        emailVerified: true,
      },
    });

    if (!user || user.deletedAt) {
      return {
        authenticated: false,
        error: "User account not found or has been deleted.",
      };
    }

    if (checkActiveStatus && !user.isActive) {
      return {
        authenticated: false,
        error: "Account is inactive.",
      };
    }

    if (requireEmailVerification && !user.emailVerified) {
      return {
        authenticated: false,
        error: "Email verification required.",
      };
    }

    // Check role permissions
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        return {
          authenticated: false,
          error: "Forbidden. Insufficient permissions.",
        };
      }
    }

    return {
      authenticated: true,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isActive: user.isActive,
        sessionId: payload.sessionId,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        authenticated: false,
        error: error.message,
      };
    }

    return {
      authenticated: false,
      error: "Authentication failed.",
    };
  }
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await requireAuth(options);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 }
      );
    }

    return handler(request, authResult.user);
  };
}

/**
 * Higher-order function to wrap API routes with JWT authentication
 */
export function withApiAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await requireApiAuth(request, options);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 }
      );
    }

    return handler(request, authResult.user);
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(userRole: UserRole): boolean {
  return hasRole(userRole, ["SUPER_ADMIN", "ADMIN"]);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === "SUPER_ADMIN";
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new window
    const resetTime = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Cleanup old rate limit records (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup rate limits every hour
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 60 * 60 * 1000);
}
