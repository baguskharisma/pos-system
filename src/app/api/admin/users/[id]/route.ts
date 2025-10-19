import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission, canManageRole } from "@/lib/rbac";
import { z } from "zod";

/**
 * GET /api/admin/users/[id]
 * Get user by ID
 * Requires: USER_VIEW permission
 */
export const GET = withRBAC(
  async (request, context, { params }: { params: { id: string } }) => {
    try {
      const userId = params.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
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
          failedLoginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.USER_VIEW],
  }
);

/**
 * PATCH /api/admin/users/[id]
 * Update user
 * Requires: USER_UPDATE permission
 */
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "CASHIER", "STAFF"]).optional(),
  employeeId: z.string().optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().optional(),
});

export const PATCH = withRBAC(
  async (request, context, { params }: { params: { id: string } }) => {
    try {
      const userId = params.id;
      const body = await request.json();

      const validationResult = updateUserSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, deletedAt: true },
      });

      if (!targetUser || targetUser.deletedAt) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if user can manage the target user's role
      if (!canManageRole(context.role, targetUser.role)) {
        return NextResponse.json(
          { error: "You cannot modify users with this role" },
          { status: 403 }
        );
      }

      // If trying to change role, check if user can assign new role
      if (data.role && !canManageRole(context.role, data.role)) {
        return NextResponse.json(
          { error: "You cannot assign this role" },
          { status: 403 }
        );
      }

      // Get old values for audit log
      const oldUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          phone: true,
          role: true,
          employeeId: true,
          isActive: true,
        },
      });

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          employeeId: true,
          isActive: true,
          avatar: true,
          updatedAt: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: "USER_UPDATED_BY_ADMIN",
          entityType: "USER",
          entityId: userId,
          oldValue: oldUser,
          newValue: data,
        },
      });

      return NextResponse.json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.USER_UPDATE],
  }
);

/**
 * DELETE /api/admin/users/[id]
 * Delete user (soft delete)
 * Requires: USER_DELETE permission
 */
export const DELETE = withRBAC(
  async (request, context, { params }: { params: { id: string } }) => {
    try {
      const userId = params.id;

      // Prevent self-deletion
      if (userId === context.userId) {
        return NextResponse.json(
          { error: "You cannot delete your own account" },
          { status: 400 }
        );
      }

      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, deletedAt: true, email: true, name: true },
      });

      if (!targetUser || targetUser.deletedAt) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if user can delete the target user's role
      if (!canManageRole(context.role, targetUser.role)) {
        return NextResponse.json(
          { error: "You cannot delete users with this role" },
          { status: 403 }
        );
      }

      // Soft delete user
      await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      // Revoke all user sessions
      await prisma.session.deleteMany({
        where: { userId },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: "USER_DELETED_BY_ADMIN",
          entityType: "USER",
          entityId: userId,
          oldValue: {
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
          },
          metadata: {
            deletedBy: context.userId,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.USER_DELETE],
  }
);
