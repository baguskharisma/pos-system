import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import {
  getUserSessions,
  revokeAllUserSessionsExcept,
  getUserSessionStats,
  parseUserAgent,
} from "@/lib/session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * GET /api/sessions
 * Get all active sessions for the current user
 * Requires authentication
 */
export const GET = withAuth(async (request, context) => {
  try {
    // Get all user sessions
    const sessions = await getUserSessions(context.userId);

    // Get current session
    const currentSession = await getServerSession(authOptions);
    const currentSessionId = currentSession?.user?.id;

    // Format sessions with additional info
    const formattedSessions = sessions.map((session) => {
      const parsedUA = parseUserAgent(session.userAgent);

      return {
        id: session.id,
        token: session.token,
        ipAddress: session.ipAddress,
        browser: parsedUA.browser,
        os: parsedUA.os,
        device: parsedUA.device,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        isCurrent: session.token === currentSessionId,
      };
    });

    // Get session statistics
    const stats = await getUserSessionStats(context.userId);

    return NextResponse.json({
      sessions: formattedSessions,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/sessions
 * Revoke all sessions except the current one
 * Requires authentication
 */
export const DELETE = withAuth(async (request, context) => {
  try {
    // Get current session
    const currentSession = await getServerSession(authOptions);
    const currentSessionId = currentSession?.user?.id;

    // Revoke all other sessions
    const revokedCount = await revokeAllUserSessionsExcept(
      context.userId,
      currentSessionId
    );

    return NextResponse.json({
      message: `Successfully revoked ${revokedCount} session(s)`,
      revokedCount,
    });
  } catch (error) {
    console.error("Failed to revoke sessions:", error);
    return NextResponse.json(
      { error: "Failed to revoke sessions" },
      { status: 500 }
    );
  }
});
