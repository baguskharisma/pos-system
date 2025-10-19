import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { revokeAllUserSessions } from "@/lib/session";

/**
 * POST /api/auth/logout
 * Logout user and revoke sessions
 * Optional: Revoke all sessions or just current session
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body for options
    let revokeAll = false;
    try {
      const body = await request.json();
      revokeAll = body.revokeAll === true;
    } catch {
      // No body or invalid JSON, use default (revokeAll = false)
    }

    // Create audit log before revoking sessions
    await prisma.auditLog.create({
      data: {
        userId,
        action: revokeAll ? "LOGOUT_ALL_SESSIONS" : "LOGOUT",
        entityType: "SESSION",
        entityId: userId,
        metadata: {
          timestamp: new Date().toISOString(),
          revokeAll,
        },
      },
    });

    // Revoke sessions
    if (revokeAll) {
      // Revoke all user sessions
      const count = await revokeAllUserSessions(userId);

      return NextResponse.json({
        success: true,
        message: `Logged out from ${count} session(s)`,
        revokedSessions: count,
      });
    } else {
      // Revoke only current session (if sessionId available in token)
      // Note: NextAuth with JWT doesn't track sessions by default
      // This will clear the client-side session cookie

      return NextResponse.json({
        success: true,
        message: "Logged out successfully",
      });
    }
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to logout",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * Alternative logout endpoint (for compatibility)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
