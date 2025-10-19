import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/request-helpers"
import { getCurrentUser } from "@/lib/auth-utils"

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 *
 * This endpoint demonstrates two ways to get user info:
 * 1. From middleware headers (fast, but limited info)
 * 2. From session/database (slower, but complete info)
 */
export async function GET() {
  try {
    // Method 1: Get user from middleware headers (fast)
    const userFromHeaders = await getAuthenticatedUser()

    if (!userFromHeaders) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Method 2: Get full user from session (slower but complete)
    const fullUser = await getCurrentUser()

    if (!fullUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        role: fullUser.role,
        avatar: fullUser.avatar,
        phone: fullUser.phone,
        isActive: fullUser.isActive,
        employeeId: fullUser.employeeId,
      },
      // Also include the quick header info for comparison
      headerInfo: userFromHeaders,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
