# Type Definitions

Comprehensive TypeScript type definitions for authentication and authorization.

## File Structure

```
src/types/
├── auth.d.ts       # Authentication & authorization types
├── index.ts        # Central export
└── README.md       # This file
```

## Usage

### Import Types

```typescript
// Import from index (recommended)
import type { User, SessionUser, LoginCredentials } from "@/types";

// Or import directly from auth.d.ts
import type { User, SessionUser } from "@/types/auth.d";
```

## Available Types

### User Types

#### `User`
Complete user information including all fields.

```typescript
import type { User } from "@/types";

const user: User = {
  id: "uuid",
  email: "user@example.com",
  name: "John Doe",
  role: "CASHIER",
  employeeId: "EMP001",
  avatar: null,
  phone: "+6281234567890",
  isActive: true,
  emailVerified: new Date(),
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

#### `PublicUser`
User without sensitive information (safe for API responses).

```typescript
import type { PublicUser } from "@/types";

const publicUser: PublicUser = {
  id: "uuid",
  email: "user@example.com",
  name: "John Doe",
  role: "CASHIER",
  employeeId: "EMP001",
  avatar: null,
  isActive: true,
};
```

#### `SessionUser`
Minimal user data for session storage.

```typescript
import type { SessionUser } from "@/types";

const sessionUser: SessionUser = {
  id: "uuid",
  email: "user@example.com",
  name: "John Doe",
  role: "CASHIER",
  employeeId: "EMP001",
  avatar: null,
  phone: "+6281234567890",
  isActive: true,
};
```

### Authentication Types

#### `LoginCredentials`
User login data.

```typescript
import type { LoginCredentials } from "@/types";

const credentials: LoginCredentials = {
  email: "user@example.com",
  password: "Password123!",
  rememberMe: true,
};
```

#### `RegisterData`
User registration data.

```typescript
import type { RegisterData } from "@/types";

const registerData: RegisterData = {
  email: "newuser@example.com",
  password: "Password123!",
  name: "New User",
  phone: "+6281234567890",
  role: "STAFF",
  employeeId: "EMP003",
};
```

#### `ChangePasswordData`
Password change request.

```typescript
import type { ChangePasswordData } from "@/types";

const changePassword: ChangePasswordData = {
  currentPassword: "OldPassword123!",
  newPassword: "NewPassword123!",
  confirmPassword: "NewPassword123!",
};
```

### Response Types

#### `AuthResponse`
Generic authentication response.

```typescript
import type { AuthResponse } from "@/types";

const response: AuthResponse<PublicUser> = {
  success: true,
  message: "Login successful",
  data: publicUser,
};

// Error response
const errorResponse: AuthResponse = {
  success: false,
  error: "Invalid credentials",
};
```

#### `LoginResponse`
Login-specific response with tokens.

```typescript
import type { LoginResponse } from "@/types";

const loginResponse: LoginResponse = {
  success: true,
  user: publicUser,
  accessToken: "jwt-token",
  refreshToken: "refresh-token",
  expiresIn: 3600,
};
```

#### `TokenResponse`
Token information.

```typescript
import type { TokenResponse } from "@/types";

const tokenResponse: TokenResponse = {
  accessToken: "jwt-token",
  refreshToken: "refresh-token",
  expiresIn: 3600,
  tokenType: "Bearer",
};
```

### Error Types

#### `AuthError`
Authentication error details.

```typescript
import type { AuthError } from "@/types";

const error: AuthError = {
  code: "INVALID_CREDENTIALS",
  message: "Email or password is incorrect",
  details: ["Password must be at least 8 characters"],
  field: "password",
};
```

#### `ValidationError`
Field validation error.

```typescript
import type { ValidationError } from "@/types";

const validationError: ValidationError = {
  field: "email",
  message: "Email is required",
  code: "REQUIRED",
};
```

### Session Types

#### `SessionInfo`
Complete session information.

```typescript
import type { SessionInfo } from "@/types";

const session: SessionInfo = {
  id: "session-uuid",
  userId: "user-uuid",
  token: "session-token",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  lastActivity: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  isCurrent: true,
};
```

#### `ParsedUserAgent`
Parsed user agent information.

```typescript
import type { ParsedUserAgent } from "@/types";

const userAgent: ParsedUserAgent = {
  browser: "Chrome",
  os: "Windows",
  device: "Desktop",
  raw: "Mozilla/5.0...",
};
```

#### `SessionStats`
Session statistics.

```typescript
import type { SessionStats } from "@/types";

const stats: SessionStats = {
  total: 10,
  active: 3,
  expired: 7,
  lastActivity: new Date(),
};
```

### Permission Types

#### `PermissionCheckResult`
Result of permission check.

```typescript
import type { PermissionCheckResult } from "@/types";

const result: PermissionCheckResult = {
  hasPermission: false,
  missingPermissions: ["user:create", "user:delete"],
  role: "CASHIER",
};
```

#### `RBACContext`
RBAC context for authenticated user.

```typescript
import type { RBACContext } from "@/types";

const rbacContext: RBACContext = {
  userId: "user-uuid",
  email: "user@example.com",
  role: "ADMIN",
  permissions: [Permission.USER_VIEW, Permission.PRODUCT_CREATE],
  isAdmin: true,
  isSuperAdmin: false,
};
```

### API Types

#### `APIContext`
Request context for protected API routes.

```typescript
import type { APIContext } from "@/types";

export const GET = withRBAC(
  async (request, context: APIContext) => {
    // context.userId, context.role available
    return NextResponse.json({ data: "protected" });
  },
  { permissions: [Permission.USER_VIEW] }
);
```

#### `APIResponse`
Standard API response format.

```typescript
import type { APIResponse } from "@/types";

const response: APIResponse<User[]> = {
  success: true,
  data: users,
  message: "Users fetched successfully",
};

// With pagination
const listResponse: APIResponse<User[]> = {
  success: true,
  data: users,
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10,
    hasNext: true,
    hasPrev: false,
  },
};
```

#### `ProtectedAPIHandler`
Type for protected API handlers.

```typescript
import type { ProtectedAPIHandler } from "@/types";

const handler: ProtectedAPIHandler<User[]> = async (request, context) => {
  const users = await getUsers();
  return NextResponse.json({ success: true, data: users });
};

export const GET = withRBAC(handler, {
  permissions: [Permission.USER_VIEW],
});
```

### Password Types

#### `PasswordValidationResult`
Password validation result.

```typescript
import type { PasswordValidationResult } from "@/types";

const validation: PasswordValidationResult = {
  isValid: false,
  errors: [
    "Password must be at least 8 characters",
    "Password must contain uppercase letter",
  ],
};
```

#### `PasswordStrengthResult`
Password strength calculation.

```typescript
import type { PasswordStrengthResult } from "@/types";

const strength: PasswordStrengthResult = {
  score: 3,
  label: "Good",
  feedback: ["Use at least 12 characters for better security"],
};
```

### User Management Types

#### `CreateUserRequest`
Request to create new user.

```typescript
import type { CreateUserRequest } from "@/types";

const request: CreateUserRequest = {
  email: "newuser@example.com",
  password: "Password123!",
  name: "New User",
  phone: "+6281234567890",
  role: "CASHIER",
  employeeId: "EMP005",
  avatar: "https://example.com/avatar.jpg",
};
```

#### `UpdateUserRequest`
Request to update user.

```typescript
import type { UpdateUserRequest } from "@/types";

const request: UpdateUserRequest = {
  name: "Updated Name",
  phone: "+6281234567890",
  role: "ADMIN",
  isActive: true,
};
```

#### `UserListFilter`
User list filtering options.

```typescript
import type { UserListFilter } from "@/types";

const filter: UserListFilter = {
  search: "john",
  role: "CASHIER",
  isActive: true,
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};
```

## Utility Types

### `Optional<T, K>`
Make specific fields optional.

```typescript
import type { Optional } from "@/types";

type PartialUser = Optional<User, "phone" | "avatar" | "employeeId">;
// phone, avatar, employeeId are now optional
```

### `RequiredFields<T, K>`
Make specific fields required.

```typescript
import type { RequiredFields } from "@/types";

type RequiredUser = RequiredFields<User, "phone" | "employeeId">;
// phone and employeeId are now required
```

### `Nullable<T>`
Make all fields nullable.

```typescript
import type { Nullable } from "@/types";

type NullableUser = Nullable<User>;
// All fields can be null
```

### `DeepPartial<T>`
Make all fields (including nested) partial.

```typescript
import type { DeepPartial } from "@/types";

type PartialConfig = DeepPartial<SystemConfig>;
// All fields and nested fields are optional
```

## NextAuth Type Extensions

The types automatically extend NextAuth's built-in types:

```typescript
import { useSession } from "next-auth/react";

function Component() {
  const { data: session } = useSession();

  // session.user has all SessionUser properties
  console.log(session?.user.role); // UserRole
  console.log(session?.user.employeeId); // string | null
  console.log(session?.user.isActive); // boolean
}
```

```typescript
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();

  // session.user is typed as SessionUser
  const userId = session?.user.id;
  const role = session?.user.role;
}
```

## Best Practices

### 1. Use Specific Types

```typescript
// ✅ Good - specific type
const user: PublicUser = await getUser();

// ❌ Bad - too generic
const user: any = await getUser();
```

### 2. Type Guards

```typescript
function isPublicUser(user: unknown): user is PublicUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "email" in user &&
    "role" in user
  );
}
```

### 3. Generic API Responses

```typescript
async function fetchUsers(): Promise<APIResponse<User[]>> {
  const response = await fetch("/api/users");
  return response.json();
}
```

### 4. Discriminated Unions

```typescript
type APIResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult(result: APIResult<User>) {
  if (result.success) {
    // TypeScript knows result.data exists
    console.log(result.data.email);
  } else {
    // TypeScript knows result.error exists
    console.log(result.error);
  }
}
```

## Related Files

- `src/lib/auth-options.ts` - NextAuth configuration
- `src/lib/rbac.ts` - RBAC permissions
- `src/lib/rbac-middleware.ts` - RBAC middleware
- `src/hooks/usePermissions.ts` - Permission hooks
- `src/components/auth/RoleGuard.tsx` - Guard components

## Further Reading

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [NextAuth TypeScript](https://next-auth.js.org/getting-started/typescript)
- [Prisma TypeScript](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/use-custom-model-and-field-names#using-type-utilities)
