import { swaggerPaths } from "./swagger-paths";

/**
 * OpenAPI/Swagger Configuration
 * API Documentation for POS System
 */
export const getApiDocs = () => {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "POS System API Documentation",
      version: "1.0.0",
      description: `
# POS System API

Complete API documentation for the Point of Sale System.

## Features

- 🔐 **Authentication**: JWT-based authentication with NextAuth
- 👥 **User Management**: Complete CRUD with RBAC
- 🔑 **Session Management**: Multi-device session tracking
- 📊 **Reports**: Sales and analytics endpoints
- 🛡️ **Role-Based Access Control**: 4 roles with 60+ permissions
- 📝 **Audit Logging**: All actions are logged

## Authentication

Most endpoints require authentication. Include the session cookie in your requests.

### Roles

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Management access (cannot create/delete users)
- **CASHIER**: Sales and transaction access
- **STAFF**: Basic access

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Default limits:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
      `,
      contact: {
        name: "API Support",
        email: "support@pos-system.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://pos-system.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "Authentication and authorization endpoints",
      },
      {
        name: "Sessions",
        description: "Session management endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Admin",
        description: "Admin-only endpoints",
      },
      {
        name: "Reports",
        description: "Analytics and reporting endpoints",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
          description: "Session cookie from NextAuth",
        },
      },
      schemas: {
        // User schemas
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            name: {
              type: "string",
              description: "User full name",
            },
            role: {
              type: "string",
              enum: ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"],
              description: "User role",
            },
            employeeId: {
              type: "string",
              nullable: true,
              description: "Employee ID",
            },
            avatar: {
              type: "string",
              nullable: true,
              description: "Avatar URL",
            },
            phone: {
              type: "string",
              nullable: true,
              description: "Phone number",
            },
            isActive: {
              type: "boolean",
              description: "Is user active",
            },
            emailVerified: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Email verification date",
            },
            lastLoginAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Last login timestamp",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
          required: ["id", "email", "name", "role", "isActive"],
        },
        PublicUser: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"] },
            avatar: { type: "string", nullable: true },
            isActive: { type: "boolean" },
          },
          required: ["id", "email", "name", "role", "isActive"],
        },

        // Authentication schemas
        RegisterRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "Password (min 8 characters)",
            },
            name: {
              type: "string",
              minLength: 2,
              description: "Full name",
            },
            employeeId: {
              type: "string",
              nullable: true,
              description: "Employee ID (optional)",
            },
          },
          required: ["email", "password", "name"],
        },
        ChangePasswordRequest: {
          type: "object",
          properties: {
            currentPassword: {
              type: "string",
              description: "Current password",
            },
            newPassword: {
              type: "string",
              minLength: 8,
              description: "New password (min 8 characters)",
            },
          },
          required: ["currentPassword", "newPassword"],
        },
        LogoutRequest: {
          type: "object",
          properties: {
            revokeAll: {
              type: "boolean",
              default: false,
              description: "Logout from all devices",
            },
          },
        },

        // Session schemas
        Session: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            sessionToken: { type: "string" },
            expires: { type: "string", format: "date-time" },
            ipAddress: { type: "string", nullable: true },
            userAgent: { type: "string", nullable: true },
            lastActivityAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SessionInfo: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            ipAddress: { type: "string", nullable: true },
            userAgent: { type: "string", nullable: true },
            browser: { type: "string", nullable: true },
            os: { type: "string", nullable: true },
            device: { type: "string", nullable: true },
            lastActivityAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time" },
            isExpired: { type: "boolean" },
            isCurrent: { type: "boolean" },
          },
        },

        // Response schemas
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            message: { type: "string" },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            field: { type: "string" },
            message: { type: "string" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            errors: {
              type: "array",
              items: { $ref: "#/components/schemas/ValidationError" },
            },
          },
        },

        // Pagination
        PaginationMeta: {
          type: "object",
          properties: {
            total: { type: "number" },
            page: { type: "number" },
            limit: { type: "number" },
            totalPages: { type: "number" },
            hasNext: { type: "boolean" },
            hasPrev: { type: "boolean" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: {} },
            pagination: { $ref: "#/components/schemas/PaginationMeta" },
          },
        },

        // Admin schemas
        CreateUserRequest: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            name: { type: "string", minLength: 2 },
            role: { type: "string", enum: ["ADMIN", "CASHIER", "STAFF"] },
            employeeId: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
          },
          required: ["email", "password", "name", "role"],
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 2 },
            role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"] },
            employeeId: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            isActive: { type: "boolean" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Forbidden" },
                  missingPermissions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Not found" },
                },
              },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    paths: swaggerPaths,
  };

  return spec;
};
