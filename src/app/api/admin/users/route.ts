import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC, requirePermissions } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { z } from "zod";

/**
 * GET /api/admin/users
 * List all users (Admin only)
 * Requires: USER_VIEW permission
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const search = searchParams.get("search") || "";
      const role = searchParams.get("role") || "";

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ];
      }

      if (role) {
        where.role = role;
      }

      // Get users
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            employeeId: true,
            avatar: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      return NextResponse.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.USER_VIEW],
  }
);

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
 * Requires: USER_CREATE permission
 */
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"]),
  employeeId: z.string().optional(),
});

export const POST = withRBAC(
  async (request, context) => {
    try {
      const body = await request.json();
      const validationResult = createUserSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const { email, password, name, phone, role, employeeId } =
        validationResult.data;

      // Check if user can assign this role
      const { canManageRole } = await import("@/lib/rbac");
      if (!canManageRole(context.role, role)) {
        return NextResponse.json(
          {
            error: "You cannot create users with this role",
            details: ["ADMIN cannot create SUPER_ADMIN users"],
          },
          { status: 403 }
        );
      }

      // Validate password
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          {
            error: "Weak password",
            details: passwordValidation.errors,
          },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          role,
          employeeId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          employeeId: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: "USER_CREATED_BY_ADMIN",
          entityType: "USER",
          entityId: user.id,
          newValue: {
            email: user.email,
            name: user.name,
            role: user.role,
            createdBy: context.userId,
          },
        },
      });

      return NextResponse.json(
        {
          message: "User created successfully",
          user,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Failed to create user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.USER_CREATE],
  }
);
