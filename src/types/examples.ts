/**
 * Type Usage Examples
 *
 * This file contains practical examples of using the auth types.
 * These examples are for reference only and should not be imported.
 */

import type {
  User,
  PublicUser,
  SessionUser,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  AuthResponse,
  LoginResponse,
  TokenResponse,
  SessionInfo,
  APIContext,
  APIResponse,
  ProtectedAPIHandler,
  CreateUserRequest,
  UpdateUserRequest,
  UserListFilter,
  PasswordValidationResult,
  PermissionCheckResult,
  RBACContext,
} from "./auth.d";
import type { UserRole } from "@prisma/client";
import { Permission } from "@/lib/rbac";

// ==================== USER EXAMPLES ====================

/**
 * Example: Complete user object
 */
const fullUser: User = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "john.doe@example.com",
  name: "John Doe",
  role: "CASHIER",
  employeeId: "EMP001",
  avatar: "https://example.com/avatar.jpg",
  phone: "+6281234567890",
  isActive: true,
  emailVerified: new Date("2024-01-15T10:00:00Z"),
  lastLoginAt: new Date("2024-01-20T14:30:00Z"),
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-20T14:30:00Z"),
};

/**
 * Example: Public user (safe for API responses)
 */
const publicUser: PublicUser = {
  id: fullUser.id,
  email: fullUser.email,
  name: fullUser.name,
  role: fullUser.role,
  employeeId: fullUser.employeeId,
  avatar: fullUser.avatar,
  isActive: fullUser.isActive,
};

/**
 * Example: Session user (minimal data)
 */
const sessionUser: SessionUser = {
  id: fullUser.id,
  email: fullUser.email,
  name: fullUser.name,
  role: fullUser.role,
  employeeId: fullUser.employeeId,
  avatar: fullUser.avatar,
  phone: fullUser.phone,
  isActive: fullUser.isActive,
};

// ==================== AUTH REQUEST EXAMPLES ====================

/**
 * Example: Login credentials
 */
const loginCredentials: LoginCredentials = {
  email: "user@example.com",
  password: "SecurePassword123!",
  rememberMe: true,
};

/**
 * Example: Registration data
 */
const registerData: RegisterData = {
  email: "newuser@example.com",
  password: "SecurePassword123!",
  name: "New User",
  phone: "+6281234567890",
  role: "STAFF",
  employeeId: "EMP005",
};

/**
 * Example: Change password data
 */
const changePasswordData: ChangePasswordData = {
  currentPassword: "OldPassword123!",
  newPassword: "NewSecurePassword123!",
  confirmPassword: "NewSecurePassword123!",
};

// ==================== RESPONSE EXAMPLES ====================

/**
 * Example: Successful login response
 */
const successLoginResponse: LoginResponse = {
  success: true,
  message: "Login successful",
  user: publicUser,
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresIn: 3600,
};

/**
 * Example: Failed login response
 */
const failedLoginResponse: LoginResponse = {
  success: false,
  error: "Invalid email or password",
};

/**
 * Example: Token response
 */
const tokenResponse: TokenResponse = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresIn: 3600,
  tokenType: "Bearer",
};

/**
 * Example: Generic auth response with data
 */
const authResponse: AuthResponse<PublicUser> = {
  success: true,
  message: "User created successfully",
  data: publicUser,
};

/**
 * Example: Generic auth response with error
 */
const authErrorResponse: AuthResponse = {
  success: false,
  error: "Validation failed",
};

// ==================== SESSION EXAMPLES ====================

/**
 * Example: Session information
 */
const sessionInfo: SessionInfo = {
  id: "session-550e8400-e29b-41d4-a716-446655440000",
  userId: fullUser.id,
  token: "session-token-abc123",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  lastActivity: new Date("2024-01-20T14:30:00Z"),
  expiresAt: new Date("2024-02-20T14:30:00Z"),
  createdAt: new Date("2024-01-20T10:00:00Z"),
  isCurrent: true,
};

// ==================== API EXAMPLES ====================

/**
 * Example: API Context in middleware
 */
const apiContext: APIContext = {
  userId: fullUser.id,
  email: fullUser.email,
  role: fullUser.role,
  name: fullUser.name,
  isActive: fullUser.isActive,
  sessionId: sessionInfo.id,
};

/**
 * Example: Successful API response
 */
const apiSuccessResponse: APIResponse<PublicUser[]> = {
  success: true,
  data: [publicUser],
  message: "Users fetched successfully",
};

/**
 * Example: API response with pagination
 */
const apiPaginatedResponse: APIResponse<PublicUser[]> = {
  success: true,
  data: [publicUser],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10,
    hasNext: true,
    hasPrev: false,
  },
};

/**
 * Example: API error response
 */
const apiErrorResponse: APIResponse = {
  success: false,
  error: "User not found",
};

/**
 * Example: Protected API handler
 */
const protectedHandler: ProtectedAPIHandler<PublicUser[]> = async (
  request,
  context
) => {
  // Use context.userId, context.role, etc.
  const users = [publicUser]; // Fetch users from database

  return new Response(
    JSON.stringify({
      success: true,
      data: users,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};

// ==================== USER MANAGEMENT EXAMPLES ====================

/**
 * Example: Create user request
 */
const createUserRequest: CreateUserRequest = {
  email: "newuser@example.com",
  password: "SecurePassword123!",
  name: "New User",
  phone: "+6281234567890",
  role: "CASHIER",
  employeeId: "EMP010",
  avatar: "https://example.com/avatar.jpg",
};

/**
 * Example: Update user request
 */
const updateUserRequest: UpdateUserRequest = {
  name: "Updated Name",
  phone: "+6289876543210",
  role: "ADMIN",
  isActive: true,
};

/**
 * Example: User list filter
 */
const userListFilter: UserListFilter = {
  search: "john",
  role: "CASHIER",
  isActive: true,
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};

// ==================== PERMISSION EXAMPLES ====================

/**
 * Example: Permission check result (success)
 */
const hasPermissionResult: PermissionCheckResult = {
  hasPermission: true,
  role: "ADMIN",
};

/**
 * Example: Permission check result (failure)
 */
const noPermissionResult: PermissionCheckResult = {
  hasPermission: false,
  missingPermissions: [Permission.USER_CREATE, Permission.USER_DELETE],
  role: "CASHIER",
};

/**
 * Example: RBAC context
 */
const rbacContext: RBACContext = {
  userId: fullUser.id,
  email: fullUser.email,
  role: "ADMIN",
  permissions: [
    Permission.USER_VIEW,
    Permission.USER_UPDATE,
    Permission.PRODUCT_CREATE,
    Permission.ORDER_VIEW_ALL,
  ],
  isAdmin: true,
  isSuperAdmin: false,
};

// ==================== PASSWORD EXAMPLES ====================

/**
 * Example: Valid password
 */
const validPasswordResult: PasswordValidationResult = {
  isValid: true,
  errors: [],
};

/**
 * Example: Invalid password
 */
const invalidPasswordResult: PasswordValidationResult = {
  isValid: false,
  errors: [
    "Password must be at least 8 characters",
    "Password must contain uppercase letter",
    "Password must contain special character",
  ],
};

// ==================== FUNCTION EXAMPLES ====================

/**
 * Example: Type-safe login function
 */
async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  return response.json();
}

/**
 * Example: Type-safe user creation
 */
async function createUser(
  data: CreateUserRequest
): Promise<AuthResponse<PublicUser>> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Example: Type-safe user list fetch
 */
async function fetchUsers(
  filter: UserListFilter
): Promise<APIResponse<PublicUser[]>> {
  const params = new URLSearchParams(filter as any);
  const response = await fetch(`/api/admin/users?${params}`);

  return response.json();
}

/**
 * Example: Type guard for checking user type
 */
function isPublicUser(user: unknown): user is PublicUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "email" in user &&
    "name" in user &&
    "role" in user &&
    "isActive" in user
  );
}

/**
 * Example: Type guard for checking role
 */
function hasRole(user: SessionUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

/**
 * Example: Type-safe API handler with context
 */
function createProtectedHandler<T>(
  handler: (context: APIContext) => Promise<T>
): ProtectedAPIHandler<T> {
  return async (request, context) => {
    try {
      const data = await handler(context);
      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

/**
 * Example: Usage of createProtectedHandler
 */
const getUsersHandler = createProtectedHandler<PublicUser[]>(
  async (context) => {
    // Access context.userId, context.role
    // Fetch users from database
    return [publicUser];
  }
);

// ==================== DISCRIMINATED UNION EXAMPLES ====================

/**
 * Example: Result type with discriminated union
 */
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Example: Using result type
 */
async function getUserById(id: string): Promise<Result<PublicUser, string>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      return { success: false, error: "User not found" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Example: Handling result with type narrowing
 */
async function handleGetUser(id: string) {
  const result = await getUserById(id);

  if (result.success) {
    // TypeScript knows result.data exists and is PublicUser
    console.log(result.data.email);
  } else {
    // TypeScript knows result.error exists and is string
    console.error(result.error);
  }
}

// ==================== EXPORT (for documentation only) ====================

export type {
  // These are just examples, actual types should be imported from auth.d.ts
};
