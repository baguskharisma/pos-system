# API Documentation Guide

Complete guide for the POS System REST API with Swagger/OpenAPI documentation.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [Swagger UI](#swagger-ui)

## Overview

The POS System API is a RESTful API that provides:

- 🔐 **Authentication**: JWT-based authentication with NextAuth
- 👥 **User Management**: Complete CRUD operations with RBAC
- 🔑 **Session Management**: Multi-device session tracking
- 📊 **Reports**: Sales and analytics endpoints
- 🛡️ **Role-Based Access Control**: 4 roles with 60+ permissions

### Base URL

```
Development: http://localhost:3000
Production:  https://your-domain.com
```

### API Version

Current version: **1.0.0**

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Getting Started

### 1. Access Swagger UI

Visit the interactive API documentation:

```
http://localhost:3000/api-docs
```

### 2. Get OpenAPI Specification

Download the OpenAPI/Swagger specification:

```bash
curl http://localhost:3000/api/docs > openapi.json
```

### 3. Import to API Client

Import the OpenAPI spec into your favorite API client:
- Postman
- Insomnia
- Paw
- Thunder Client (VS Code)

## Authentication

### Overview

The API uses **cookie-based authentication** with NextAuth and JWT tokens.

### Authentication Flow

1. **Register or Login** → Receive session cookie
2. **Make API requests** → Cookie automatically sent
3. **Session expires** → Re-authenticate

### Roles & Permissions

| Role | Level | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | 4 | Full system access, can create/delete users |
| `ADMIN` | 3 | Management access, cannot create/delete users |
| `CASHIER` | 2 | Sales and transaction access |
| `STAFF` | 1 | Basic access |

### How to Authenticate

#### 1. Register a New User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "employeeId": "EMP001"
}
```

#### 2. Login with NextAuth

Use NextAuth's built-in login:

```javascript
import { signIn } from "next-auth/react";

await signIn("credentials", {
  email: "user@example.com",
  password: "SecurePass123!",
  redirect: false,
});
```

#### 3. Session Cookie

After successful login, the session cookie is automatically set:
- Cookie name: `next-auth.session-token`
- HttpOnly: Yes
- Secure: Yes (production)
- SameSite: Lax

#### 4. Making Authenticated Requests

```bash
# Cookie is automatically sent by browser
GET /api/user/profile
```

For programmatic access:

```javascript
fetch("/api/user/profile", {
  credentials: "include", // Include cookies
});
```

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "employeeId": "EMP001"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STAFF"
  }
}
```

#### POST /api/auth/change-password
Change current user's password.

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### POST /api/auth/logout
Logout current user.

**Request:**
```json
{
  "revokeAll": false  // true to logout from all devices
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "revokedSessions": 1
}
```

### Session Management

#### GET /api/sessions
Get all active sessions for current user.

**Response (200):**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "sess_123",
      "ipAddress": "192.168.1.1",
      "browser": "Chrome",
      "os": "Windows",
      "device": "Desktop",
      "lastActivityAt": "2025-01-18T12:00:00Z",
      "expiresAt": "2025-02-18T12:00:00Z",
      "isCurrent": true
    }
  ],
  "total": 1
}
```

#### DELETE /api/sessions
Revoke all sessions except current.

**Response (200):**
```json
{
  "success": true,
  "message": "All other sessions revoked",
  "revokedCount": 2
}
```

#### DELETE /api/sessions/{id}
Revoke a specific session.

**Response (200):**
```json
{
  "success": true,
  "message": "Session revoked"
}
```

### User Management

#### GET /api/user/profile
Get current user's profile.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "employeeId": "EMP001",
    "phone": "+1234567890",
    "isActive": true,
    "lastLoginAt": "2025-01-18T12:00:00Z"
  }
}
```

#### PATCH /api/user/profile
Update current user's profile.

**Request:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated",
  "user": { /* updated user */ }
}
```

### Admin Endpoints

#### GET /api/admin/users
List all users (Admin/Super Admin only).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name or email
- `role` (string): Filter by role
- `isActive` (boolean): Filter by active status

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "ADMIN",
      "isActive": true
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST /api/admin/users
Create new user (Super Admin only).

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "New User",
  "role": "CASHIER",
  "employeeId": "EMP002",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": { /* created user */ }
}
```

#### GET /api/admin/users/{id}
Get user by ID (Admin/Super Admin only).

**Response (200):**
```json
{
  "success": true,
  "user": { /* user details */ }
}
```

#### PATCH /api/admin/users/{id}
Update user (requires permissions).

**Request:**
```json
{
  "name": "Updated Name",
  "role": "ADMIN",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated",
  "user": { /* updated user */ }
}
```

#### DELETE /api/admin/users/{id}
Delete user (Super Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Reports

#### GET /api/reports/sales
Get sales analytics (role-based access).

**Query Parameters:**
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)
- `groupBy` (string): Group by (day, week, month)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSales": 150000,
    "totalOrders": 50,
    "averageOrderValue": 3000,
    "period": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-31T23:59:59Z"
    }
  },
  "role": "ADMIN"
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or invalid request |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

With validation errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

With missing permissions:

```json
{
  "success": false,
  "error": "Forbidden",
  "missingPermissions": ["user:create", "user:delete"]
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authenticated users**: 100 requests/minute
- **Unauthenticated users**: 20 requests/minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642521600
```

## Examples

### Example 1: Complete Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "SecurePass123!",
    name: "John Doe",
  }),
});

const { user } = await registerResponse.json();
console.log("Registered:", user);

// 2. Login with NextAuth
import { signIn } from "next-auth/react";

await signIn("credentials", {
  email: "john@example.com",
  password: "SecurePass123!",
  redirect: false,
});

// 3. Access protected endpoint
const profileResponse = await fetch("/api/user/profile", {
  credentials: "include",
});

const { user: profile } = await profileResponse.json();
console.log("Profile:", profile);

// 4. Logout
await fetch("/api/auth/logout", {
  method: "POST",
  credentials: "include",
});
```

### Example 2: Admin User Management

```javascript
// List users with pagination
const response = await fetch(
  "/api/admin/users?page=1&limit=10&search=john&role=ADMIN",
  {
    credentials: "include",
  }
);

const { users, pagination } = await response.json();

console.log(`Found ${pagination.total} users`);
console.log(`Page ${pagination.page} of ${pagination.totalPages}`);

// Create new user (Super Admin only)
const createResponse = await fetch("/api/admin/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email: "newuser@example.com",
    password: "SecurePass123!",
    name: "New User",
    role: "CASHIER",
  }),
});

const { user: newUser } = await createResponse.json();

// Update user
const updateResponse = await fetch(`/api/admin/users/${newUser.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    name: "Updated Name",
    isActive: true,
  }),
});
```

### Example 3: Session Management

```javascript
// Get all active sessions
const sessionsResponse = await fetch("/api/sessions", {
  credentials: "include",
});

const { sessions, total } = await sessionsResponse.json();

console.log(`You have ${total} active sessions`);

sessions.forEach((session) => {
  console.log(
    `${session.browser} on ${session.os} - ${session.isCurrent ? "Current" : "Other"}`
  );
});

// Revoke a specific session
const sessionId = sessions.find((s) => !s.isCurrent)?.id;

if (sessionId) {
  await fetch(`/api/sessions/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
  });
}

// Logout from all devices
await fetch("/api/auth/logout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ revokeAll: true }),
});
```

### Example 4: Sales Reports

```javascript
// Get sales report for current month
const startDate = new Date();
startDate.setDate(1);
startDate.setHours(0, 0, 0, 0);

const endDate = new Date();
endDate.setMonth(endDate.getMonth() + 1);
endDate.setDate(0);
endDate.setHours(23, 59, 59, 999);

const reportResponse = await fetch(
  `/api/reports/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&groupBy=day`,
  {
    credentials: "include",
  }
);

const { data, role } = await reportResponse.json();

console.log(`Total Sales: $${data.totalSales}`);
console.log(`Total Orders: ${data.totalOrders}`);
console.log(`Average Order: $${data.averageOrderValue}`);
console.log(`Report accessed as: ${role}`);
```

## Swagger UI

### Accessing Swagger UI

Visit the interactive API documentation:

```
http://localhost:3000/api-docs
```

### Features

- 📖 **Complete API Reference**: All endpoints documented
- 🧪 **Try It Out**: Test endpoints directly from the browser
- 📋 **Code Examples**: Auto-generated code snippets
- 🔍 **Search & Filter**: Quickly find endpoints
- 📊 **Schema Browser**: Explore data models
- 🎨 **Beautiful UI**: Clean, professional interface

### Using Swagger UI

1. **Browse Endpoints**: Click on any endpoint to expand details
2. **Try It Out**: Click "Try it out" button
3. **Fill Parameters**: Enter required parameters
4. **Execute**: Click "Execute" to send the request
5. **View Response**: See the response body, headers, and status

### Authentication in Swagger

Since the API uses cookie-based authentication:

1. First, login using NextAuth in your app
2. The session cookie will be automatically sent with Swagger requests
3. You can test authenticated endpoints directly

### Exporting OpenAPI Spec

Download the OpenAPI specification:

```bash
# JSON format
curl http://localhost:3000/api/docs > openapi.json

# Use in other tools
npx swagger-cli validate openapi.json
```

## Best Practices

### 1. Always Handle Errors

```javascript
try {
  const response = await fetch("/api/user/profile");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error("API Error:", error);
  // Handle error appropriately
}
```

### 2. Check Permissions Client-Side

```javascript
import { usePermissions } from "@/hooks/usePermissions";

function AdminPanel() {
  const { can, isSuperAdmin } = usePermissions();

  if (!can("user:view")) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {isSuperAdmin && <CreateUserButton />}
    </div>
  );
}
```

### 3. Use TypeScript Types

```typescript
import type { User, APIResponse } from "@/types/auth";

const getProfile = async (): Promise<User> => {
  const response = await fetch("/api/user/profile");
  const data: APIResponse<User> = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.data!;
};
```

### 4. Implement Retry Logic

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

## Support

### Issues & Questions

- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Email: support@pos-system.com
- Documentation: [Full docs](http://localhost:3000/api-docs)

### Resources

- [NextAuth Documentation](https://next-auth.js.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices](https://restfulapi.net/)

---

**API Version**: 1.0.0
**Last Updated**: January 2025
**License**: MIT
