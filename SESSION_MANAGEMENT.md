# Session Management Guide

Complete guide to session management, callbacks, and tracking in the POS System.

## Table of Contents

1. [Overview](#overview)
2. [Session Callbacks](#session-callbacks)
3. [Session Utilities](#session-utilities)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Configuration](#configuration)
7. [Security Features](#security-features)

## Overview

The POS System uses NextAuth with JWT strategy combined with database session tracking for comprehensive session management. This hybrid approach provides:

- **JWT-based authentication** for stateless API requests
- **Database session tracking** for activity monitoring and revocation
- **Audit logging** for all authentication events
- **Concurrent session management** with configurable limits
- **Device and location tracking** for security

### Key Files

- `src/lib/auth-options.ts` - NextAuth configuration with enhanced callbacks
- `src/lib/session.ts` - Session management utilities
- `src/app/api/sessions/*` - Session management API endpoints

## Session Callbacks

NextAuth provides various callbacks that are executed at different stages of the authentication lifecycle.

### JWT Callback

Called whenever a JWT token is created or updated.

```typescript
callbacks: {
  async jwt({ token, user, trigger, session, account }) {
    // On sign in - populate token with user data
    if (user) {
      token.id = user.id;
      token.email = user.email;
      token.role = user.role;
      token.sessionId = crypto.randomUUID();
      token.iat = Math.floor(Date.now() / 1000);
    }

    // On session update - refresh user data
    if (trigger === "update" && session) {
      // Validate user is still active
      // Update token with latest data
    }

    // Token rotation - refresh if old
    const tokenAge = Math.floor(Date.now() / 1000) - (token.iat || 0);
    if (tokenAge > SESSION_UPDATE_AGE) {
      // Refresh user data from database
    }

    return token;
  }
}
```

**When it's called:**
- On sign in
- On session access (getServerSession, useSession)
- On session update (update())
- On token refresh

### Session Callback

Called whenever a session is accessed.

```typescript
callbacks: {
  async session({ session, token }) {
    // Populate session with token data
    if (token && session.user) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.role = token.role;
      // ... other fields
    }
    return session;
  }
}
```

**When it's called:**
- On every `getServerSession()` call
- On every `useSession()` hook update
- Very frequently - avoid heavy operations

### Events

NextAuth events provide hooks for important authentication lifecycle events.

#### signIn Event

```typescript
events: {
  async signIn({ user, account, profile, isNewUser }) {
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        metadata: { timestamp, isNewUser, provider }
      }
    });

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
  }
}
```

#### signOut Event

```typescript
events: {
  async signOut({ token, session }) {
    // Log logout
    await prisma.auditLog.create({
      data: {
        userId: token.id,
        action: "LOGOUT",
        metadata: { sessionId: token.sessionId }
      }
    });

    // Revoke session in database
    await prisma.session.deleteMany({
      where: { token: token.sessionId }
    });
  }
}
```

#### Other Events

- `createUser` - When a new user is created
- `updateUser` - When user data is updated
- `linkAccount` - When OAuth account is linked
- `session` - On every session check (use sparingly)

## Session Utilities

The `src/lib/session.ts` file provides comprehensive session management functions.

### Client Information

```typescript
import { getClientIp, getClientUserAgent, parseUserAgent } from "@/lib/session";

// Get client IP
const ip = getClientIp();

// Get user agent
const userAgent = getClientUserAgent();

// Parse user agent
const { browser, os, device } = parseUserAgent(userAgent);
```

### Session CRUD Operations

```typescript
import {
  createOrUpdateSession,
  getUserSessions,
  getSessionById,
  revokeSession,
} from "@/lib/session";

// Create or update session
const session = await createOrUpdateSession(
  userId,
  sessionId,
  expiresAt
);

// Get all user sessions
const sessions = await getUserSessions(userId);

// Get specific session
const session = await getSessionById(sessionId);

// Revoke session
await revokeSession(sessionId, userId);
```

### Bulk Operations

```typescript
import {
  revokeAllUserSessions,
  revokeAllUserSessionsExcept,
  cleanupExpiredSessions,
} from "@/lib/session";

// Revoke all sessions
const count = await revokeAllUserSessions(userId);

// Revoke all except current
const count = await revokeAllUserSessionsExcept(userId, currentSessionId);

// Cleanup expired sessions
const count = await cleanupExpiredSessions();
```

### Session Validation

```typescript
import {
  isSessionValid,
  updateSessionActivity,
  extendSession,
} from "@/lib/session";

// Check if session is valid
const valid = await isSessionValid(sessionId, userId);

// Update last activity
await updateSessionActivity(sessionId, userId);

// Extend session expiration
await extendSession(sessionId, userId, 3600); // Add 1 hour
```

### Concurrent Sessions

```typescript
import {
  getConcurrentSessionsLimit,
  enforceConcurrentSessionsLimit,
} from "@/lib/session";

// Get configured limit
const limit = getConcurrentSessionsLimit(); // From env

// Enforce limit (removes oldest sessions)
const removedCount = await enforceConcurrentSessionsLimit(
  userId,
  currentSessionId
);
```

### Session Statistics

```typescript
import { getUserSessionStats } from "@/lib/session";

const stats = await getUserSessionStats(userId);
// {
//   total: 10,
//   active: 3,
//   expired: 7,
//   lastActivity: Date
// }
```

## API Endpoints

### GET /api/sessions

Get all active sessions for the current user.

**Authentication:** Required

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "token": "session-token",
      "ipAddress": "192.168.1.1",
      "browser": "Chrome",
      "os": "Windows",
      "device": "Desktop",
      "lastActivity": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-02-15T10:30:00Z",
      "createdAt": "2024-01-15T09:00:00Z",
      "isCurrent": true
    }
  ],
  "stats": {
    "total": 5,
    "active": 3,
    "expired": 2,
    "lastActivity": "2024-01-15T10:30:00Z"
  }
}
```

### DELETE /api/sessions

Revoke all sessions except the current one.

**Authentication:** Required

**Response:**
```json
{
  "message": "Successfully revoked 2 session(s)",
  "revokedCount": 2
}
```

### DELETE /api/sessions/[id]

Revoke a specific session.

**Authentication:** Required

**Parameters:**
- `id` - Session ID to revoke

**Response:**
```json
{
  "message": "Session revoked successfully"
}
```

## Usage Examples

### 1. Display Active Sessions (React Component)

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function ActiveSessions() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (session) {
      fetch("/api/sessions")
        .then((res) => res.json())
        .then((data) => setSessions(data.sessions));
    }
  }, [session]);

  const revokeSession = async (sessionId: string) => {
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    // Refresh sessions list
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(data.sessions);
  };

  return (
    <div>
      <h2>Active Sessions</h2>
      {sessions.map((sess) => (
        <div key={sess.id}>
          <p>
            {sess.browser} on {sess.os} ({sess.device})
          </p>
          <p>IP: {sess.ipAddress}</p>
          <p>Last active: {new Date(sess.lastActivity).toLocaleString()}</p>
          {!sess.isCurrent && (
            <button onClick={() => revokeSession(sess.id)}>
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 2. Sign Out All Other Devices

```typescript
async function signOutOtherDevices() {
  const response = await fetch("/api/sessions", {
    method: "DELETE",
  });

  const data = await response.json();
  alert(data.message);
}
```

### 3. Session Activity Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateSessionActivity } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (token?.id && token?.sessionId) {
    // Update session activity asynchronously
    updateSessionActivity(
      token.sessionId as string,
      token.id as string
    ).catch(console.error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

### 4. Force User to Re-authenticate

```typescript
import { revokeAllUserSessions } from "@/lib/session";

async function forceReauth(userId: string) {
  // Revoke all sessions
  await revokeAllUserSessions(userId);

  // User will be forced to sign in again
}
```

### 5. Check for Suspicious Activity

```typescript
import { getUserSessions, parseUserAgent } from "@/lib/session";

async function checkSuspiciousActivity(userId: string) {
  const sessions = await getUserSessions(userId);

  // Check for sessions from multiple locations
  const uniqueIPs = new Set(sessions.map((s) => s.ipAddress));

  if (uniqueIPs.size > 3) {
    // Alert user about multiple locations
    await sendSecurityAlert(userId, "Multiple login locations detected");
  }

  // Check for unusual devices
  const devices = sessions.map((s) => parseUserAgent(s.userAgent));
  // Implement your logic...
}
```

### 6. Session Expiration Warning

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function SessionExpirationWarning() {
  const { data: session } = useSession();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      // Calculate time until expiration
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const remaining = Math.floor((expiresAt - now) / 1000);

      setTimeLeft(remaining);

      // Show warning when 5 minutes left
      if (remaining < 300 && remaining > 0) {
        // Show warning toast
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  if (!timeLeft || timeLeft > 300) return null;

  return (
    <div className="session-warning">
      Your session will expire in {Math.floor(timeLeft / 60)} minutes
    </div>
  );
}
```

## Configuration

### Environment Variables

```env
# Session Configuration
SESSION_MAX_AGE="2592000"               # 30 days in seconds
SESSION_UPDATE_AGE="86400"              # 1 day in seconds
MAX_CONCURRENT_SESSIONS="5"             # Max sessions per user

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Adjust Session Lifetime

**Short sessions (1 day):**
```env
SESSION_MAX_AGE="86400"
SESSION_UPDATE_AGE="3600"
```

**Long sessions (90 days):**
```env
SESSION_MAX_AGE="7776000"
SESSION_UPDATE_AGE="86400"
```

### Concurrent Sessions Limit

```env
# Allow only 1 session (single device)
MAX_CONCURRENT_SESSIONS="1"

# Allow 3 sessions
MAX_CONCURRENT_SESSIONS="3"

# Unlimited sessions
MAX_CONCURRENT_SESSIONS="999"
```

## Security Features

### 1. Automatic Session Cleanup

Expired sessions are automatically cleaned up every hour:

```typescript
// Runs automatically in src/lib/session.ts
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
```

### 2. Session Validation on Each Request

The JWT callback validates user status on every request:
- Checks if user is active
- Checks if user is deleted
- Refreshes user data periodically

### 3. IP Address Tracking

All sessions track the originating IP address:
```typescript
const ipAddress = getClientIp();
// Checks x-forwarded-for, x-real-ip, cf-connecting-ip
```

### 4. Device Fingerprinting

User agent is parsed to identify:
- Browser (Chrome, Firefox, Safari, etc.)
- Operating System (Windows, macOS, Linux, etc.)
- Device Type (Desktop, Mobile, Tablet)

### 5. Audit Logging

All session events are logged:
- LOGIN
- LOGOUT
- SESSION_REVOKED
- ALL_SESSIONS_REVOKED

### 6. Concurrent Session Enforcement

Oldest sessions are automatically removed when limit is exceeded:
```typescript
await enforceConcurrentSessionsLimit(userId, currentSessionId);
```

### 7. Session Hijacking Prevention

- Sessions tied to IP address and user agent
- Session tokens are unique and random
- JWT tokens include session ID for tracking
- Sessions can be revoked immediately

## Best Practices

### 1. Session Activity Updates

Update session activity on important actions:
```typescript
await updateSessionActivity(sessionId, userId);
```

### 2. Security Notifications

Notify users of new logins:
```typescript
events: {
  async signIn({ user }) {
    await sendEmail({
      to: user.email,
      subject: "New login detected",
      body: `New login from ${ip} using ${browser}`,
    });
  }
}
```

### 3. Periodic Session Review

Prompt users to review their active sessions:
```typescript
// Show on settings page
const sessions = await getUserSessions(userId);
// Display for user review
```

### 4. Sensitive Operations

Require re-authentication for sensitive operations:
```typescript
async function deleteAccount(userId: string) {
  // Check if session is recent
  const session = await getSessionById(sessionId);
  const sessionAge = Date.now() - session.lastActivity.getTime();

  if (sessionAge > 5 * 60 * 1000) {
    // Session older than 5 minutes
    throw new Error("Please re-authenticate");
  }

  // Proceed with deletion
}
```

### 5. Monitor for Anomalies

```typescript
async function monitorSessions(userId: string) {
  const sessions = await getUserSessions(userId);

  // Check for multiple countries
  const ips = sessions.map((s) => s.ipAddress);
  const countries = await getCountriesFromIPs(ips);

  if (countries.size > 2) {
    // Potential account compromise
    await alertSecurityTeam(userId);
  }
}
```

## Troubleshooting

### Sessions not being tracked

**Issue:** Sessions aren't appearing in database

**Solution:** Ensure session creation is called on sign in:
```typescript
await createOrUpdateSession(userId, sessionId, expiresAt);
```

### Session callback too slow

**Issue:** App feels sluggish due to database queries

**Solution:** The session callback is called frequently. Move heavy operations to events:
```typescript
// ❌ Don't do this in session callback
callbacks: {
  async session({ session, token }) {
    await heavyDatabaseQuery(); // Too slow!
    return session;
  }
}

// ✅ Do this in events instead
events: {
  async signIn({ user }) {
    await heavyDatabaseQuery(); // Only on sign in
  }
}
```

### Expired sessions not cleaning up

**Issue:** Old sessions accumulating in database

**Solution:** Ensure cleanup function is running:
```typescript
// Check if it's running
cleanupExpiredSessions().then((count) => {
  console.log(`Cleaned up ${count} sessions`);
});
```

### Token rotation not working

**Issue:** User data not refreshing

**Solution:** Check SESSION_UPDATE_AGE and token.iat:
```typescript
console.log("Token age:", tokenAge);
console.log("Update age:", updateAge);
// Token should refresh when tokenAge > updateAge
```

## Advanced Topics

### Custom Session Storage

Extend the Session model for additional fields:

```prisma
model Session {
  // ... existing fields
  deviceId      String?
  country       String?
  city          String?
  lastLatitude  Float?
  lastLongitude Float?
}
```

### Session Broadcasting

Notify other sessions when one logs out:
```typescript
// Use WebSockets or Server-Sent Events
// to notify other tabs/devices
```

### Session Persistence

Allow users to choose "Remember me":
```typescript
// Extend session maxAge based on user preference
const maxAge = rememberMe ? 90 * 24 * 60 * 60 : 24 * 60 * 60;
```

## Related Documentation

- [JWT Configuration Guide](./JWT_CONFIGURATION.md)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Security Best Practices](./SECURITY.md)
