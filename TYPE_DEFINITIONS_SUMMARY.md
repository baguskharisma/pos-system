# Type Definitions Summary

Comprehensive TypeScript type definitions untuk authentication dan authorization system.

## 📁 File Structure

```
src/types/
├── auth.d.ts       # Main type definitions (400+ lines)
├── index.ts        # Central export file
├── examples.ts     # Practical usage examples
└── README.md       # Complete documentation
```

## 📋 What's Included

### 1. User Types (10 types)
- `User` - Complete user data
- `PublicUser` - Safe for API responses
- `SessionUser` - Minimal session data
- `UserWithPermissions` - User with permissions array

### 2. Authentication Types (10 types)
- `LoginCredentials` - Login request
- `RegisterData` - Registration request
- `ChangePasswordData` - Password change request
- `ResetPasswordRequest` - Password reset email request
- `ResetPasswordData` - Password reset with token
- `EmailVerificationData` - Email verification

### 3. Response Types (10 types)
- `AuthResponse<T>` - Generic auth response
- `LoginResponse` - Login-specific response
- `RegisterResponse` - Registration response
- `TokenResponse` - JWT token response
- `RefreshTokenResponse` - Token refresh response

### 4. Error Types (5 types)
- `AuthError` - Authentication error
- `ValidationError` - Field validation error
- `AuthErrorResponse` - Error response format

### 5. Session Types (8 types)
- `SessionData` - NextAuth session data
- `SessionInfo` - Complete session info
- `SessionWithUser` - Session with user data
- `ParsedUserAgent` - Browser/OS/Device info
- `SessionStats` - Session statistics

### 6. Permission Types (5 types)
- `PermissionCheckResult` - Permission check result
- `RoleCheckResult` - Role check result
- `RBACContext` - RBAC context for requests

### 7. Audit Log Types (3 types)
- `AuditLogEntry` - Audit log entry
- `AuditLogFilter` - Filter for audit logs

### 8. JWT Types (3 types)
- `JWTPayload` - JWT token payload
- `JWTTokenPair` - Access + refresh tokens

### 9. API Types (6 types)
- `APIContext` - Request context
- `ProtectedAPIHandler` - Handler type
- `APIResponse<T>` - Standard response format
- `PaginationMeta` - Pagination metadata
- `ListResponse<T>` - List with pagination

### 10. Password Types (5 types)
- `PasswordValidationResult` - Validation result
- `PasswordStrengthResult` - Strength calculation
- `PasswordRequirements` - Password rules
- `PasswordCompromiseResult` - Compromise check

### 11. Role Types (5 types)
- `RoleLevel` - Hierarchy level (1-4)
- `RoleInfo` - Complete role information
- `RoleComparisonResult` - Role comparison

### 12. Security Types (5 types)
- `AccountLockoutInfo` - Lockout status
- `SecurityEvent` - Security event logging
- `TwoFactorAuthData` - 2FA data

### 13. User Management Types (6 types)
- `CreateUserRequest` - Create user data
- `UpdateUserRequest` - Update user data
- `UserListFilter` - List filter options
- `UserListResponse` - List response

### 14. Utility Types (4 types)
- `Optional<T, K>` - Make fields optional
- `RequiredFields<T, K>` - Make fields required
- `Nullable<T>` - Make all nullable
- `DeepPartial<T>` - Deep partial

### 15. NextAuth Extensions
- Extended `Session` interface
- Extended `User` interface
- Extended `JWT` interface

## 🚀 Quick Start

### Import Types

```typescript
// Import from central index (recommended)
import type { User, LoginCredentials, APIResponse } from "@/types";

// Or import directly
import type { User } from "@/types/auth.d";
```

### Use in Components

```typescript
import type { SessionUser } from "@/types";

interface Props {
  user: SessionUser;
}

export function UserProfile({ user }: Props) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

### Use in API Routes

```typescript
import type { APIContext, APIResponse, PublicUser } from "@/types";

export const GET = withRBAC(
  async (request, context: APIContext) => {
    const users: PublicUser[] = await getUsers();

    const response: APIResponse<PublicUser[]> = {
      success: true,
      data: users,
    };

    return NextResponse.json(response);
  },
  { permissions: [Permission.USER_VIEW] }
);
```

### Use with Fetch

```typescript
import type { LoginCredentials, LoginResponse } from "@/types";

async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  return response.json();
}
```

## 💡 Key Features

### 1. Type Safety

All authentication operations are fully typed:

```typescript
// ✅ Type-safe
const user: PublicUser = await getUser(id);
console.log(user.email); // OK
console.log(user.password); // Error: Property doesn't exist

// ❌ Unsafe
const user: any = await getUser(id);
console.log(user.anythingGoesHere); // No error (bad!)
```

### 2. Auto-completion

IDE will provide autocomplete for all properties:

```typescript
const user: SessionUser = {
  id: "",
  email: "", // Auto-complete will suggest all required fields
  // ... IDE shows what's missing
};
```

### 3. NextAuth Integration

Types automatically extend NextAuth:

```typescript
import { useSession } from "next-auth/react";

function Component() {
  const { data: session } = useSession();

  // session.user is typed as SessionUser
  console.log(session?.user.role); // ✅ Typed
  console.log(session?.user.permissions); // ❌ Error (not in type)
}
```

### 4. Generic Response Types

Reusable response types:

```typescript
// Works with any data type
const userResponse: APIResponse<User> = {
  success: true,
  data: user,
};

const usersResponse: APIResponse<User[]> = {
  success: true,
  data: [user1, user2],
};

const errorResponse: APIResponse = {
  success: false,
  error: "Not found",
};
```

### 5. Discriminated Unions

Type narrowing with discriminated unions:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handle(result: Result<User>) {
  if (result.success) {
    // TypeScript knows result.data exists
    console.log(result.data.email);
  } else {
    // TypeScript knows result.error exists
    console.log(result.error);
  }
}
```

## 📚 Examples

### Example 1: Login Flow

```typescript
import type {
  LoginCredentials,
  LoginResponse,
  AuthError,
} from "@/types";

async function handleLogin(credentials: LoginCredentials) {
  try {
    const response: LoginResponse = await fetch("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    }).then((r) => r.json());

    if (response.success && response.user) {
      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      // Show error
      setError(response.error || "Login failed");
    }
  } catch (error) {
    setError("Network error");
  }
}
```

### Example 2: User Management

```typescript
import type {
  CreateUserRequest,
  APIResponse,
  PublicUser,
} from "@/types";

async function createUser(data: CreateUserRequest) {
  const response: APIResponse<PublicUser> = await fetch(
    "/api/admin/users",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  ).then((r) => r.json());

  if (response.success && response.data) {
    toast.success(`User ${response.data.name} created`);
  } else {
    toast.error(response.error || "Failed to create user");
  }
}
```

### Example 3: Protected API Handler

```typescript
import type { APIContext, APIResponse, PublicUser } from "@/types";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";

export const GET = withRBAC(
  async (request, context: APIContext) => {
    // context is fully typed
    const userId: string = context.userId;
    const role: UserRole = context.role;

    const users: PublicUser[] = await prisma.user.findMany({
      where: { deletedAt: null },
    });

    const response: APIResponse<PublicUser[]> = {
      success: true,
      data: users,
      message: "Users fetched successfully",
    };

    return NextResponse.json(response);
  },
  { permissions: [Permission.USER_VIEW] }
);
```

## 🔍 Type Checking

### Check if Variable Matches Type

```typescript
import type { PublicUser } from "@/types";

function isPublicUser(user: unknown): user is PublicUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "email" in user &&
    "role" in user
  );
}

// Usage
const data: unknown = await fetch("/api/users").then((r) => r.json());

if (isPublicUser(data)) {
  // TypeScript knows data is PublicUser
  console.log(data.email);
}
```

## 🛠️ Customization

### Extending Types

```typescript
// Add custom fields
interface ExtendedUser extends PublicUser {
  customField: string;
  metadata: Record<string, any>;
}

// Make fields optional
type PartialUser = Partial<User>;

// Make specific fields optional
type UserWithOptionalPhone = Optional<User, "phone" | "avatar">;
```

### Custom Response Types

```typescript
// Create your own response type
interface CustomAPIResponse<T> extends APIResponse<T> {
  timestamp: Date;
  requestId: string;
}
```

## ✅ Benefits

1. **Type Safety** - Catch errors at compile time
2. **Auto-completion** - IDE suggestions for all properties
3. **Refactoring** - Safe to rename/modify types
4. **Documentation** - Types serve as inline documentation
5. **Consistency** - Same types across frontend and backend
6. **Maintainability** - Easy to update and maintain

## 📖 Documentation

For complete documentation, see:
- [Type Definitions README](./src/types/README.md)
- [Usage Examples](./src/types/examples.ts)
- [Auth Types](./src/types/auth.d.ts)

## 🔗 Related Files

- `src/lib/auth-options.ts` - NextAuth configuration
- `src/lib/rbac.ts` - RBAC permissions
- `src/lib/rbac-middleware.ts` - API middleware
- `src/hooks/usePermissions.ts` - Permission hooks
- `src/components/auth/RoleGuard.tsx` - Guard components

## 📝 Notes

- All types are in `.d.ts` format for better IDE support
- Types automatically extend NextAuth's built-in types
- Compatible with Prisma generated types
- Fully documented with JSDoc comments
- Includes 50+ practical examples

## 🎯 Total Count

- **100+ type definitions**
- **50+ examples**
- **15 categories**
- **Full NextAuth integration**
- **Complete RBAC support**

Semua type definitions sudah siap digunakan! 🎉
