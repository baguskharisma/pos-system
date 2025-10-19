# JWT Configuration Guide

This document explains the JWT (JSON Web Token) authentication strategy implemented in this POS System.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [JWT Features](#jwt-features)
4. [Usage Examples](#usage-examples)
5. [Security Best Practices](#security-best-practices)

## Overview

The application uses a hybrid JWT authentication approach:

- **NextAuth with JWT Strategy**: For web-based session management
- **Custom JWT Utilities**: For API tokens, refresh tokens, and special-purpose tokens

### Key Files

- `src/lib/auth-options.ts` - NextAuth configuration with JWT strategy
- `src/lib/jwt.ts` - Custom JWT utility functions
- `src/lib/auth-middleware.ts` - Authentication middleware for API routes
- `src/lib/password.ts` - Password hashing and validation utilities

## Environment Variables

### Required Variables

Create a `.env` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-jwt-key-min-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key-min-32-characters-long"
JWT_EXPIRATION="30d"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"
JWT_REFRESH_EXPIRATION="90d"

# Session Configuration
SESSION_MAX_AGE="2592000"       # 30 days in seconds
SESSION_UPDATE_AGE="86400"      # 1 day in seconds
```

### Generate Secure Secrets

```bash
# Generate a secret using OpenSSL
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## JWT Features

### 1. Token Types

The system supports multiple token types:

- **ACCESS**: Short-lived tokens for API authentication (default: 30 days)
- **REFRESH**: Long-lived tokens for token rotation (default: 90 days)
- **EMAIL_VERIFICATION**: Single-use tokens for email verification (24 hours)
- **PASSWORD_RESET**: Single-use tokens for password reset (1 hour)
- **API_KEY**: Long-lived tokens for API integrations (365 days)

### 2. Token Rotation

Tokens are automatically refreshed when:
- Token age exceeds `SESSION_UPDATE_AGE` (default: 1 day)
- User data in the database is updated
- Session is manually updated

### 3. Security Features

- **Account Lockout**: After 5 failed login attempts, accounts are locked for 15 minutes
- **Active Status Check**: Tokens are invalidated if user account is deactivated
- **Deleted Account Check**: Tokens are invalidated if user account is deleted
- **Token Expiration**: All tokens have expiration times
- **Secure Hashing**: bcryptjs with 12 salt rounds for password hashing

### 4. Audit Logging

All authentication events are logged:
- Login events
- Logout events
- Failed login attempts
- Password changes
- Profile updates

## Usage Examples

### 1. Protected API Route (NextAuth Session)

```typescript
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(async (request, context) => {
  // context.userId, context.email, context.role are available
  return NextResponse.json({ message: "Protected data" });
});
```

### 2. Protected API Route with Role Check

```typescript
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(
  async (request, context) => {
    return NextResponse.json({ message: "Admin only data" });
  },
  { allowedRoles: ["SUPER_ADMIN", "ADMIN"] }
);
```

### 3. API Route with JWT Token Authentication

```typescript
import { withApiAuth } from "@/lib/auth-middleware";

export const GET = withApiAuth(async (request, context) => {
  return NextResponse.json({ message: "API authenticated" });
});
```

### 4. Manual Authentication Check

```typescript
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth({
    allowedRoles: ["ADMIN"],
    checkActiveStatus: true,
  });

  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  // Use authResult.user
  return NextResponse.json({ user: authResult.user });
}
```

### 5. Create Custom JWT Token

```typescript
import { createToken, TokenType } from "@/lib/jwt";

const token = await createToken(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenType: TokenType.ACCESS,
  },
  { expiresIn: "7d" }
);
```

### 6. Verify Custom JWT Token

```typescript
import { verifyToken, TokenType } from "@/lib/jwt";

try {
  const payload = await verifyToken(token, TokenType.ACCESS);
  console.log(payload.userId, payload.email);
} catch (error) {
  console.error("Token invalid:", error.message);
}
```

### 7. Create Token Pair (Access + Refresh)

```typescript
import { createTokenPair } from "@/lib/jwt";

const { accessToken, refreshToken } = await createTokenPair({
  userId: user.id,
  email: user.email,
  role: user.role,
});
```

### 8. Refresh Access Token

```typescript
import { refreshAccessToken } from "@/lib/jwt";

try {
  const { accessToken, refreshToken } = await refreshAccessToken(oldRefreshToken);
  // Use new tokens
} catch (error) {
  // Refresh token invalid or expired
}
```

### 9. Password Reset Token

```typescript
import { createPasswordResetToken, verifyPasswordResetToken } from "@/lib/jwt";

// Create token
const resetToken = await createPasswordResetToken(user.id, user.email);

// Verify token
const { userId, email } = await verifyPasswordResetToken(resetToken);
```

### 10. Client-Side Usage (NextAuth)

```typescript
import { useSession, signIn, signOut } from "next-auth/react";

function Component() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <button onClick={() => signIn()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <p>Role: {session.user.role}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## Security Best Practices

### 1. Secret Management

- **Never commit secrets to version control**
- Use different secrets for development, staging, and production
- Rotate secrets periodically (every 90 days)
- Use strong, randomly generated secrets (minimum 32 characters)

### 2. Token Expiration

- Keep access token expiration short (hours to days)
- Refresh tokens can be longer (weeks to months)
- Special-purpose tokens should be very short (minutes to hours)

### 3. HTTPS Only

Always use HTTPS in production:

```env
# Production environment
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 4. Rate Limiting

Implement rate limiting on authentication endpoints:

```typescript
import { checkRateLimit } from "@/lib/auth-middleware";

const rateLimit = checkRateLimit(
  request.ip || "unknown",
  100, // max requests
  15 * 60 * 1000 // 15 minutes
);

if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429 }
  );
}
```

### 5. Password Requirements

Default password requirements (configured in `src/lib/password.ts`):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common passwords list

### 6. Account Security

- Failed login lockout after 5 attempts
- 15-minute lockout duration
- Audit logging for all authentication events
- Email verification (configurable)

### 7. Database Security

- Store only password hashes (never plain text)
- Use prepared statements (Prisma handles this)
- Implement soft deletes (deletedAt field)
- Track user sessions in database (optional)

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints (signin, signout, etc.)
- `POST /api/auth/change-password` - Change password (requires authentication)

### User Endpoints

- `GET /api/user/profile` - Get current user profile (requires authentication)
- `PATCH /api/user/profile` - Update profile (requires authentication)

## Testing

### Test Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@possystem.com","password":"Admin123!"}'

# Access protected endpoint
curl http://localhost:3000/api/user/profile \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Test JWT Tokens

```typescript
import { createToken, verifyToken, TokenType } from "@/lib/jwt";

// Create token
const token = await createToken({
  userId: "test-user-id",
  email: "test@example.com",
  role: "CASHIER",
  tokenType: TokenType.ACCESS,
});

console.log("Token:", token);

// Verify token
const payload = await verifyToken(token, TokenType.ACCESS);
console.log("Payload:", payload);
```

## Troubleshooting

### Common Issues

1. **"Invalid token signature"**
   - Check that JWT_SECRET matches between token creation and verification
   - Ensure .env file is loaded correctly

2. **"Token has expired"**
   - Check token expiration settings
   - Implement token refresh logic

3. **"User account is no longer active"**
   - User has been deactivated in database
   - Check user.isActive field

4. **"Account locked due to failed attempts"**
   - Wait for lockout duration to expire
   - Or manually reset failedLoginAttempts in database

5. **Session not persisting**
   - Check NEXTAUTH_SECRET is set
   - Verify cookies are being set correctly
   - Check NEXTAUTH_URL matches your domain

## Migration from Development to Production

1. **Generate new secrets:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variables:**
   ```env
   NEXTAUTH_SECRET="production-secret"
   JWT_SECRET="production-jwt-secret"
   NEXTAUTH_URL="https://yourdomain.com"
   NODE_ENV="production"
   ```

3. **Enable email verification:**
   ```env
   REQUIRE_EMAIL_VERIFICATION="true"
   ```

4. **Configure email provider** (SMTP settings)

5. **Test thoroughly** before deploying

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
