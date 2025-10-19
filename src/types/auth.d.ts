import type { UserRole } from "@prisma/client";
import type { Permission } from "@/lib/rbac";

/**
 * Authentication and Authorization Type Definitions
 */

// ==================== USER TYPES ====================

/**
 * Base user information
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string | null;
  avatar?: string | null;
  phone?: string | null;
  isActive: boolean;
  emailVerified?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User without sensitive information
 */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string | null;
  avatar?: string | null;
  isActive: boolean;
}

/**
 * User for session (minimal data)
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string | null;
  avatar?: string | null;
  phone?: string | null;
  isActive: boolean;
}

/**
 * User with permissions
 */
export interface UserWithPermissions extends SessionUser {
  permissions: Permission[];
}

// ==================== AUTHENTICATION TYPES ====================

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  employeeId?: string;
}

/**
 * Change password data
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Reset password data
 */
export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Email verification data
 */
export interface EmailVerificationData {
  token: string;
}

// ==================== RESPONSE TYPES ====================

/**
 * Generic auth response
 */
export interface AuthResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Login response
 */
export interface LoginResponse extends AuthResponse {
  user?: PublicUser;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Registration response
 */
export interface RegisterResponse extends AuthResponse {
  user?: PublicUser;
}

/**
 * Token response
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: "Bearer";
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ==================== ERROR TYPES ====================

/**
 * Auth error
 */
export interface AuthError {
  code: string;
  message: string;
  details?: string[];
  field?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Auth error response
 */
export interface AuthErrorResponse {
  error: string;
  message?: string;
  errors?: ValidationError[];
  statusCode?: number;
}

// ==================== SESSION TYPES ====================

/**
 * Session data
 */
export interface SessionData {
  user: SessionUser;
  expires: string;
  accessToken?: string;
}

/**
 * Session info
 */
export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
  isCurrent?: boolean;
}

/**
 * Session with user info
 */
export interface SessionWithUser extends SessionInfo {
  user: PublicUser;
}

/**
 * Parsed user agent
 */
export interface ParsedUserAgent {
  browser?: string;
  os?: string;
  device?: string;
  raw?: string;
}

/**
 * Session statistics
 */
export interface SessionStats {
  total: number;
  active: number;
  expired: number;
  lastActivity?: Date;
}

// ==================== PERMISSION TYPES ====================

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  missingPermissions?: Permission[];
  role?: UserRole;
}

/**
 * Role check result
 */
export interface RoleCheckResult {
  hasRole: boolean;
  userRole?: UserRole;
  requiredRoles?: UserRole[];
}

/**
 * RBAC context
 */
export interface RBACContext {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// ==================== AUDIT LOG TYPES ====================

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Audit log filter
 */
export interface AuditLogFilter {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ==================== JWT TYPES ====================

/**
 * JWT payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenType: "access" | "refresh" | "email_verification" | "password_reset" | "api_key";
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

/**
 * JWT token pair
 */
export interface JWTTokenPair {
  accessToken: string;
  refreshToken: string;
}

// ==================== NEXTAUTH EXTENSIONS ====================

/**
 * Extended NextAuth session
 */
declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    employeeId?: string | null;
    avatar?: string | null;
    phone?: string | null;
    isActive: boolean;
  }
}

/**
 * Extended NextAuth JWT
 */
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    employeeId?: string | null;
    avatar?: string | null;
    phone?: string | null;
    isActive: boolean;
    sessionId?: string;
    iat?: number;
    exp?: number;
    jti?: string;
  }
}

// ==================== API REQUEST/RESPONSE TYPES ====================

/**
 * API context (for middleware)
 */
export interface APIContext {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  sessionId?: string;
}

/**
 * Protected API handler
 */
export type ProtectedAPIHandler<T = any> = (
  request: Request,
  context: APIContext
) => Promise<Response> | Response;

/**
 * API response format
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: ValidationError[];
  pagination?: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/**
 * List response
 */
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ==================== PASSWORD TYPES ====================

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  score: number; // 0-4
  label: string; // "Very Weak", "Weak", "Fair", "Good", "Strong"
  feedback: string[];
}

/**
 * Password requirements
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Password compromise check result
 */
export interface PasswordCompromiseResult {
  isCompromised: boolean;
  reason?: string;
}

// ==================== ROLE TYPES ====================

/**
 * Role hierarchy level
 */
export type RoleLevel = 1 | 2 | 3 | 4;

/**
 * Role info
 */
export interface RoleInfo {
  role: UserRole;
  level: RoleLevel;
  name: string;
  description: string;
  permissions: Permission[];
}

/**
 * Role comparison result
 */
export interface RoleComparisonResult {
  roleA: UserRole;
  roleB: UserRole;
  isHigher: boolean;
  isEqual: boolean;
  isLower: boolean;
  canManage: boolean;
}

// ==================== ACCOUNT SECURITY TYPES ====================

/**
 * Account lockout info
 */
export interface AccountLockoutInfo {
  isLocked: boolean;
  lockedUntil?: Date;
  failedAttempts: number;
  remainingTime?: number; // in seconds
}

/**
 * Security event
 */
export interface SecurityEvent {
  type: "login" | "logout" | "failed_login" | "password_change" | "permission_denied";
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Two-factor authentication data
 */
export interface TwoFactorAuthData {
  enabled: boolean;
  method?: "totp" | "sms" | "email";
  verified?: boolean;
}

// ==================== USER MANAGEMENT TYPES ====================

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  employeeId?: string;
  avatar?: string;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  role?: UserRole;
  employeeId?: string;
  avatar?: string;
  isActive?: boolean;
}

/**
 * User list filter
 */
export interface UserListFilter {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "createdAt" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

/**
 * User list response
 */
export interface UserListResponse {
  users: PublicUser[];
  pagination: PaginationMeta;
}

// ==================== HELPER TYPES ====================

/**
 * Optional fields
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required fields
 */
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Nullable fields
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Deep partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ==================== EXPORT ALL ====================

export type {
  UserRole,
  Permission,
};
