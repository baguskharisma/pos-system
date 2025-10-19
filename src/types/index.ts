/**
 * Central type exports
 */

// Re-export all auth types
export * from "./auth.d";

// Re-export Prisma types
export type { UserRole } from "@prisma/client";

// Re-export RBAC types
export type { Permission } from "@/lib/rbac";
