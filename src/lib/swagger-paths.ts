/**
 * OpenAPI Path Definitions
 * All API endpoint documentation
 */

export const swaggerPaths = {
  "/api/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a new user",
      description: "Create a new user account. Password must meet strength requirements.",
      operationId: "register",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
            examples: {
              default: {
                summary: "Register new user",
                value: {
                  email: "user@example.com",
                  password: "SecurePass123!",
                  name: "John Doe",
                  employeeId: "EMP001",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User registered successfully" },
                  user: { $ref: "#/components/schemas/PublicUser" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        409: {
          description: "Email already exists",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Email already exists" },
                },
              },
            },
          },
        },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/auth/change-password": {
    post: {
      tags: ["Authentication"],
      summary: "Change user password",
      description: "Change the password for the currently authenticated user",
      operationId: "changePassword",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
            examples: {
              default: {
                summary: "Change password",
                value: {
                  currentPassword: "OldPass123!",
                  newPassword: "NewSecurePass456!",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Password changed successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Password changed successfully" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: {
          description: "Current password is incorrect",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Current password is incorrect" },
                },
              },
            },
          },
        },
        500: { $ref: "#/components/responses/UnauthorizedError" },
      },
    },
  },

  "/api/auth/logout": {
    post: {
      tags: ["Authentication"],
      summary: "Logout user",
      description: "Logout the current user and optionally revoke all sessions",
      operationId: "logout",
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LogoutRequest" },
            examples: {
              currentDevice: {
                summary: "Logout current device",
                value: { revokeAll: false },
              },
              allDevices: {
                summary: "Logout all devices",
                value: { revokeAll: true },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Logged out successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Logged out successfully" },
                  revokedSessions: { type: "number", example: 1 },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    get: {
      tags: ["Authentication"],
      summary: "Logout user (GET method)",
      description: "Alternative logout endpoint for compatibility",
      operationId: "logoutGet",
      responses: {
        200: {
          description: "Logged out successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Logged out successfully" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
      },
    },
  },

  "/api/sessions": {
    get: {
      tags: ["Sessions"],
      summary: "Get all active sessions",
      description: "Retrieve all active sessions for the current user",
      operationId: "getSessions",
      responses: {
        200: {
          description: "Sessions retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  sessions: {
                    type: "array",
                    items: { $ref: "#/components/schemas/SessionInfo" },
                  },
                  total: { type: "number", example: 3 },
                  stats: {
                    type: "object",
                    properties: {
                      total: { type: "number" },
                      active: { type: "number" },
                      expired: { type: "number" },
                    },
                  },
                },
              },
              examples: {
                default: {
                  summary: "Active sessions",
                  value: {
                    success: true,
                    sessions: [
                      {
                        id: "sess_123",
                        userId: "user_456",
                        ipAddress: "192.168.1.1",
                        browser: "Chrome",
                        os: "Windows",
                        device: "Desktop",
                        lastActivityAt: "2025-01-18T12:00:00Z",
                        expiresAt: "2025-02-18T12:00:00Z",
                        isExpired: false,
                        isCurrent: true,
                      },
                    ],
                    total: 1,
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Sessions"],
      summary: "Revoke all sessions except current",
      description: "Revoke all other sessions, keeping only the current session active",
      operationId: "revokeAllSessions",
      responses: {
        200: {
          description: "Sessions revoked successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "All other sessions revoked" },
                  revokedCount: { type: "number", example: 2 },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/sessions/{id}": {
    delete: {
      tags: ["Sessions"],
      summary: "Revoke specific session",
      description: "Revoke a specific session by ID",
      operationId: "revokeSession",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Session ID",
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Session revoked successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Session revoked" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        403: {
          description: "Cannot revoke session",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Cannot revoke this session" },
                },
              },
            },
          },
        },
        404: { $ref: "#/components/responses/NotFoundError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/user/profile": {
    get: {
      tags: ["Users"],
      summary: "Get current user profile",
      description: "Retrieve the profile of the currently authenticated user",
      operationId: "getUserProfile",
      responses: {
        200: {
          description: "Profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        404: { $ref: "#/components/responses/NotFoundError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Users"],
      summary: "Update current user profile",
      description: "Update profile information for the currently authenticated user",
      operationId: "updateUserProfile",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 2 },
                phone: { type: "string", nullable: true },
                avatar: { type: "string", nullable: true },
              },
            },
            examples: {
              default: {
                summary: "Update profile",
                value: {
                  name: "John Updated",
                  phone: "+1234567890",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Profile updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Profile updated" },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "List all users",
      description: "Get a paginated list of all users. Requires ADMIN or SUPER_ADMIN role.",
      operationId: "listUsers",
      parameters: [
        {
          name: "page",
          in: "query",
          description: "Page number",
          schema: { type: "number", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          description: "Items per page",
          schema: { type: "number", default: 10 },
        },
        {
          name: "search",
          in: "query",
          description: "Search by name or email",
          schema: { type: "string" },
        },
        {
          name: "role",
          in: "query",
          description: "Filter by role",
          schema: {
            type: "string",
            enum: ["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"],
          },
        },
        {
          name: "isActive",
          in: "query",
          description: "Filter by active status",
          schema: { type: "boolean" },
        },
      ],
      responses: {
        200: {
          description: "Users retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  users: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PublicUser" },
                  },
                  pagination: { $ref: "#/components/schemas/PaginationMeta" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        403: { $ref: "#/components/responses/ForbiddenError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Admin"],
      summary: "Create new user",
      description: "Create a new user. Requires SUPER_ADMIN role.",
      operationId: "createUser",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUserRequest" },
            examples: {
              default: {
                summary: "Create user",
                value: {
                  email: "newuser@example.com",
                  password: "SecurePass123!",
                  name: "New User",
                  role: "CASHIER",
                  employeeId: "EMP002",
                  phone: "+1234567890",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User created successfully" },
                  user: { $ref: "#/components/schemas/PublicUser" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        403: { $ref: "#/components/responses/ForbiddenError" },
        409: {
          description: "Email already exists",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Email already exists" },
                },
              },
            },
          },
        },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/admin/users/{id}": {
    get: {
      tags: ["Admin"],
      summary: "Get user by ID",
      description: "Retrieve a specific user by ID. Requires ADMIN or SUPER_ADMIN role.",
      operationId: "getUserById",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "User ID",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: {
          description: "User retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        403: { $ref: "#/components/responses/ForbiddenError" },
        404: { $ref: "#/components/responses/NotFoundError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Admin"],
      summary: "Update user",
      description: "Update a user's information. Requires appropriate permissions.",
      operationId: "updateUser",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "User ID",
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRequest" },
            examples: {
              default: {
                summary: "Update user",
                value: {
                  name: "Updated Name",
                  role: "ADMIN",
                  isActive: true,
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User updated" },
                  user: { $ref: "#/components/schemas/PublicUser" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        403: { $ref: "#/components/responses/ForbiddenError" },
        404: { $ref: "#/components/responses/NotFoundError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Admin"],
      summary: "Delete user",
      description: "Delete a user. Requires SUPER_ADMIN role.",
      operationId: "deleteUser",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "User ID",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: {
          description: "User deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User deleted successfully" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        403: { $ref: "#/components/responses/ForbiddenError" },
        404: { $ref: "#/components/responses/NotFoundError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/reports/sales": {
    get: {
      tags: ["Reports"],
      summary: "Get sales report",
      description: "Retrieve sales analytics. Access level depends on user role.",
      operationId: "getSalesReport",
      parameters: [
        {
          name: "startDate",
          in: "query",
          description: "Start date (ISO 8601)",
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "endDate",
          in: "query",
          description: "End date (ISO 8601)",
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "groupBy",
          in: "query",
          description: "Group results by",
          schema: {
            type: "string",
            enum: ["day", "week", "month"],
            default: "day",
          },
        },
      ],
      responses: {
        200: {
          description: "Sales report retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      totalSales: { type: "number", example: 150000 },
                      totalOrders: { type: "number", example: 50 },
                      averageOrderValue: { type: "number", example: 3000 },
                      period: {
                        type: "object",
                        properties: {
                          start: { type: "string", format: "date-time" },
                          end: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                  role: { type: "string", example: "ADMIN" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/UnauthorizedError" },
        403: { $ref: "#/components/responses/ForbiddenError" },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
};
