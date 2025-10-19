/**
 * Auth Components - Central Export
 */

// Logout Components
export {
  LogoutButton,
  LogoutAllButton,
  QuickLogoutButton,
  LogoutLink,
  LogoutMenuItem,
  LogoutWithIcon,
} from "./LogoutButton";

// Role Guards
export {
  RoleGuard,
  PermissionGuard,
  AdminGuard,
  SuperAdminGuard,
  Can,
  Cannot,
  ShowForRoles,
  HideForRoles,
} from "./RoleGuard";

// Re-export types
export type { LogoutOptions, LogoutResult } from "@/hooks/useLogout";
