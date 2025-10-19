import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { revokeSession, getSessionById } from "@/lib/session";

/**
 * DELETE /api/sessions/[id]
 * Revoke a specific session
 * Requires authentication
 */
export const DELETE = withAuth(
  async (request, context, { params }: { params: { id: string } }) => {
    try {
      const sessionId = params.id;

      // Verify the session belongs to the current user
      const session = await getSessionById(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      if (session.userId !== context.userId) {
        return NextResponse.json(
          { error: "Forbidden. You can only revoke your own sessions" },
          { status: 403 }
        );
      }

      // Revoke the session
      const success = await revokeSession(sessionId, context.userId);

      if (!success) {
        return NextResponse.json(
          { error: "Failed to revoke session" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Session revoked successfully",
      });
    } catch (error) {
      console.error("Failed to revoke session:", error);
      return NextResponse.json(
        { error: "Failed to revoke session" },
        { status: 500 }
      );
    }
  }
);
