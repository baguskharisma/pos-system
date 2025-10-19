import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/profile
 * Get current user profile
 * Requires authentication
 */
export const GET = withAuth(async (request, context) => {
  try {
    // Get user profile from database
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/user/profile
 * Update current user profile
 * Requires authentication
 */
export const PATCH = withAuth(async (request, context) => {
  try {
    const body = await request.json();
    const { name, phone, avatar } = body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: context.userId },
      data: {
        name: name.trim(),
        phone: phone || null,
        avatar: avatar || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        employeeId: true,
        avatar: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: context.userId,
        action: "PROFILE_UPDATED",
        entityType: "USER",
        entityId: context.userId,
        newValue: {
          name: updatedUser.name,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
        },
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
});
