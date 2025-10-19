/**
 * Runtime type guards for authentication types
 *
 * TypeScript types are erased at runtime, so we need runtime checks
 * to validate data from external sources (API, user input, etc.)
 */

import type {
  User,
  PublicUser,
  SessionUser,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  SessionInfo,
  APIResponse,
} from "@/types/auth.d";
import type { UserRole } from "@prisma/client";

// ==================== USER TYPE GUARDS ====================

/**
 * Check if value is a valid User
 */
export function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) return false;

  const user = value as any;

  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string" &&
    isUserRole(user.role) &&
    typeof user.isActive === "boolean" &&
    user.createdAt instanceof Date &&
    user.updatedAt instanceof Date
  );
}

/**
 * Check if value is a valid PublicUser
 */
export function isPublicUser(value: unknown): value is PublicUser {
  if (typeof value !== "object" || value === null) return false;

  const user = value as any;

  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string" &&
    isUserRole(user.role) &&
    typeof user.isActive === "boolean" &&
    (user.employeeId === null ||
      user.employeeId === undefined ||
      typeof user.employeeId === "string") &&
    (user.avatar === null ||
      user.avatar === undefined ||
      typeof user.avatar === "string")
  );
}

/**
 * Check if value is a valid SessionUser
 */
export function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== "object" || value === null) return false;

  const user = value as any;

  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string" &&
    isUserRole(user.role) &&
    typeof user.isActive === "boolean"
  );
}

/**
 * Check if value is a valid UserRole
 */
export function isUserRole(value: unknown): value is UserRole {
  return (
    value === "SUPER_ADMIN" ||
    value === "ADMIN" ||
    value === "CASHIER" ||
    value === "STAFF"
  );
}

// ==================== AUTH TYPE GUARDS ====================

/**
 * Check if value is valid LoginCredentials
 */
export function isLoginCredentials(value: unknown): value is LoginCredentials {
  if (typeof value !== "object" || value === null) return false;

  const creds = value as any;

  return (
    typeof creds.email === "string" &&
    typeof creds.password === "string" &&
    (creds.rememberMe === undefined || typeof creds.rememberMe === "boolean")
  );
}

/**
 * Check if value is valid RegisterData
 */
export function isRegisterData(value: unknown): value is RegisterData {
  if (typeof value !== "object" || value === null) return false;

  const data = value as any;

  return (
    typeof data.email === "string" &&
    typeof data.password === "string" &&
    typeof data.name === "string" &&
    (data.phone === undefined || typeof data.phone === "string") &&
    (data.role === undefined || isUserRole(data.role)) &&
    (data.employeeId === undefined || typeof data.employeeId === "string")
  );
}

/**
 * Check if value is valid ChangePasswordData
 */
export function isChangePasswordData(
  value: unknown
): value is ChangePasswordData {
  if (typeof value !== "object" || value === null) return false;

  const data = value as any;

  return (
    typeof data.currentPassword === "string" &&
    typeof data.newPassword === "string" &&
    typeof data.confirmPassword === "string"
  );
}

// ==================== SESSION TYPE GUARDS ====================

/**
 * Check if value is valid SessionInfo
 */
export function isSessionInfo(value: unknown): value is SessionInfo {
  if (typeof value !== "object" || value === null) return false;

  const session = value as any;

  return (
    typeof session.id === "string" &&
    typeof session.userId === "string" &&
    typeof session.token === "string" &&
    session.lastActivity instanceof Date &&
    session.expiresAt instanceof Date &&
    session.createdAt instanceof Date
  );
}

// ==================== RESPONSE TYPE GUARDS ====================

/**
 * Check if value is valid APIResponse
 */
export function isAPIResponse<T = any>(
  value: unknown,
  dataValidator?: (data: any) => data is T
): value is APIResponse<T> {
  if (typeof value !== "object" || value === null) return false;

  const response = value as any;

  if (typeof response.success !== "boolean") return false;

  if (response.success) {
    // Success response should have data
    if (dataValidator && response.data !== undefined) {
      return dataValidator(response.data);
    }
    return true;
  } else {
    // Error response should have error
    return typeof response.error === "string";
  }
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate password strength (basic)
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/**
 * Validate phone number (Indonesian format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Simple validation for Indonesian phone numbers
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ""));
}

// ==================== ASSERTION HELPERS ====================

/**
 * Assert that value is User, throw if not
 */
export function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new TypeError("Value is not a valid User");
  }
}

/**
 * Assert that value is PublicUser, throw if not
 */
export function assertPublicUser(value: unknown): asserts value is PublicUser {
  if (!isPublicUser(value)) {
    throw new TypeError("Value is not a valid PublicUser");
  }
}

/**
 * Assert that value is UserRole, throw if not
 */
export function assertUserRole(value: unknown): asserts value is UserRole {
  if (!isUserRole(value)) {
    throw new TypeError(
      `Value is not a valid UserRole. Got: ${value}. Expected: SUPER_ADMIN, ADMIN, CASHIER, or STAFF`
    );
  }
}

/**
 * Assert that value is valid email, throw if not
 */
export function assertValidEmail(email: string): asserts email is string {
  if (!isValidEmail(email)) {
    throw new TypeError(`Invalid email format: ${email}`);
  }
}

/**
 * Assert that value is valid UUID, throw if not
 */
export function assertValidUUID(id: string): asserts id is string {
  if (!isValidUUID(id)) {
    throw new TypeError(`Invalid UUID format: ${id}`);
  }
}

// ==================== SAFE PARSING ====================

/**
 * Safely parse and validate User
 */
export function parseUser(value: unknown): User | null {
  try {
    if (isUser(value)) return value;
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parse and validate PublicUser
 */
export function parsePublicUser(value: unknown): PublicUser | null {
  try {
    if (isPublicUser(value)) return value;
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parse and validate SessionUser
 */
export function parseSessionUser(value: unknown): SessionUser | null {
  try {
    if (isSessionUser(value)) return value;
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parse and validate UserRole
 */
export function parseUserRole(value: unknown): UserRole | null {
  try {
    if (isUserRole(value)) return value;
    return null;
  } catch {
    return null;
  }
}

// ==================== ARRAY TYPE GUARDS ====================

/**
 * Check if value is array of PublicUser
 */
export function isPublicUserArray(value: unknown): value is PublicUser[] {
  return Array.isArray(value) && value.every(isPublicUser);
}

/**
 * Check if value is array of SessionInfo
 */
export function isSessionInfoArray(value: unknown): value is SessionInfo[] {
  return Array.isArray(value) && value.every(isSessionInfo);
}

// ==================== OBJECT VALIDATION ====================

/**
 * Check if object has required keys
 */
export function hasRequiredKeys<T extends string>(
  obj: unknown,
  keys: T[]
): obj is Record<T, unknown> {
  if (typeof obj !== "object" || obj === null) return false;

  return keys.every((key) => key in obj);
}

/**
 * Check if all values in object match predicate
 */
export function allValuesMatch<T>(
  obj: Record<string, unknown>,
  predicate: (value: unknown) => value is T
): obj is Record<string, T> {
  return Object.values(obj).every(predicate);
}

// ==================== EXAMPLE USAGE ====================

/*
// Usage in API routes
export async function POST(request: Request) {
  const body = await request.json();

  // Type guard
  if (!isLoginCredentials(body)) {
    return NextResponse.json(
      { error: "Invalid login credentials" },
      { status: 400 }
    );
  }

  // body is now typed as LoginCredentials
  const { email, password } = body;

  // ... rest of login logic
}

// Usage with assertion
export async function createUser(data: unknown) {
  assertPublicUser(data); // Throws if invalid

  // data is now typed as PublicUser
  await prisma.user.create({ data });
}

// Usage with safe parsing
export function handleUserData(data: unknown) {
  const user = parsePublicUser(data);

  if (!user) {
    console.error("Invalid user data");
    return;
  }

  // user is PublicUser
  console.log(user.email);
}

// Usage with validation
if (!isValidEmail(email)) {
  throw new Error("Invalid email");
}

if (!isStrongPassword(password)) {
  throw new Error("Password too weak");
}
*/

export default {
  // User guards
  isUser,
  isPublicUser,
  isSessionUser,
  isUserRole,

  // Auth guards
  isLoginCredentials,
  isRegisterData,
  isChangePasswordData,

  // Session guards
  isSessionInfo,

  // Response guards
  isAPIResponse,

  // Validation helpers
  isValidEmail,
  isValidUUID,
  isStrongPassword,
  isValidPhoneNumber,

  // Assertions
  assertUser,
  assertPublicUser,
  assertUserRole,
  assertValidEmail,
  assertValidUUID,

  // Safe parsing
  parseUser,
  parsePublicUser,
  parseSessionUser,
  parseUserRole,

  // Array guards
  isPublicUserArray,
  isSessionInfoArray,

  // Object validation
  hasRequiredKeys,
  allValuesMatch,
};
