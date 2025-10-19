import { prisma } from "./prisma";
import { headers } from "next/headers";

/**
 * Session management utilities
 */

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface SessionWithUser extends SessionInfo {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(): string | null {
  const headersList = headers();

  // Check various headers for IP address
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headersList.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

/**
 * Get client user agent from request headers
 */
export function getClientUserAgent(): string | null {
  const headersList = headers();
  return headersList.get("user-agent");
}

/**
 * Parse user agent to extract device and browser info
 */
export function parseUserAgent(userAgent: string | null): {
  browser?: string;
  os?: string;
  device?: string;
} {
  if (!userAgent) return {};

  const result: { browser?: string; os?: string; device?: string } = {};

  // Browser detection
  if (userAgent.includes("Chrome")) result.browser = "Chrome";
  else if (userAgent.includes("Firefox")) result.browser = "Firefox";
  else if (userAgent.includes("Safari")) result.browser = "Safari";
  else if (userAgent.includes("Edge")) result.browser = "Edge";
  else if (userAgent.includes("Opera")) result.browser = "Opera";

  // OS detection
  if (userAgent.includes("Windows")) result.os = "Windows";
  else if (userAgent.includes("Mac OS")) result.os = "macOS";
  else if (userAgent.includes("Linux")) result.os = "Linux";
  else if (userAgent.includes("Android")) result.os = "Android";
  else if (userAgent.includes("iOS")) result.os = "iOS";

  // Device detection
  if (userAgent.includes("Mobile")) result.device = "Mobile";
  else if (userAgent.includes("Tablet")) result.device = "Tablet";
  else result.device = "Desktop";

  return result;
}

/**
 * Create or update a session in the database
 */
export async function createOrUpdateSession(
  userId: string,
  sessionId: string,
  expiresAt: Date
): Promise<SessionInfo> {
  const ipAddress = getClientIp();
  const userAgent = getClientUserAgent();

  // Check if session already exists
  const existingSession = await prisma.session.findFirst({
    where: {
      userId,
      token: sessionId,
    },
  });

  if (existingSession) {
    // Update existing session
    const updated = await prisma.session.update({
      where: { id: existingSession.id },
      data: {
        lastActivity: new Date(),
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      token: updated.token,
      ipAddress: updated.ipAddress,
      userAgent: updated.userAgent,
      lastActivity: updated.lastActivity,
      expiresAt: updated.expiresAt,
      createdAt: updated.createdAt,
    };
  }

  // Create new session
  const session = await prisma.session.create({
    data: {
      userId,
      token: sessionId,
      ipAddress,
      userAgent,
      lastActivity: new Date(),
      expiresAt,
    },
  });

  return {
    id: session.id,
    userId: session.userId,
    token: session.token,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionWithUser[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { lastActivity: "desc" },
  });

  return sessions.map((session) => ({
    id: session.id,
    userId: session.userId,
    token: session.token,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    user: session.user,
  }));
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<SessionInfo | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;

  return {
    id: session.id,
    userId: session.userId,
    token: session.token,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string, userId?: string): Promise<boolean> {
  try {
    const where: any = { id: sessionId };
    if (userId) {
      where.userId = userId;
    }

    await prisma.session.delete({ where });

    // Log session revocation
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SESSION_REVOKED",
          entityType: "SESSION",
          entityId: sessionId,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to revoke session:", error);
    return false;
  }
}

/**
 * Revoke all sessions for a user except the current one
 */
export async function revokeAllUserSessionsExcept(
  userId: string,
  currentSessionId?: string
): Promise<number> {
  try {
    const where: any = { userId };
    if (currentSessionId) {
      where.NOT = { token: currentSessionId };
    }

    const result = await prisma.session.deleteMany({ where });

    // Log session revocation
    await prisma.auditLog.create({
      data: {
        userId,
        action: "ALL_SESSIONS_REVOKED",
        entityType: "SESSION",
        entityId: userId,
        metadata: {
          timestamp: new Date().toISOString(),
          count: result.count,
          exceptSession: currentSessionId || null,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("Failed to revoke sessions:", error);
    return 0;
  }
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  return revokeAllUserSessionsExcept(userId);
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} expired sessions`);
    }

    return result.count;
  } catch (error) {
    console.error("Failed to cleanup expired sessions:", error);
    return 0;
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    await prisma.session.updateMany({
      where: {
        token: sessionId,
        userId,
      },
      data: {
        lastActivity: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to update session activity:", error);
    return false;
  }
}

/**
 * Get session statistics for a user
 */
export async function getUserSessionStats(userId: string): Promise<{
  total: number;
  active: number;
  expired: number;
  lastActivity?: Date;
}> {
  const now = new Date();

  const [total, active, lastSession] = await Promise.all([
    prisma.session.count({ where: { userId } }),
    prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: now },
      },
    }),
    prisma.session.findFirst({
      where: { userId },
      orderBy: { lastActivity: "desc" },
      select: { lastActivity: true },
    }),
  ]);

  return {
    total,
    active,
    expired: total - active,
    lastActivity: lastSession?.lastActivity,
  };
}

/**
 * Check if session is valid
 */
export async function isSessionValid(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const session = await prisma.session.findFirst({
    where: {
      token: sessionId,
      userId,
      expiresAt: { gt: new Date() },
    },
  });

  return !!session;
}

/**
 * Extend session expiration
 */
export async function extendSession(
  sessionId: string,
  userId: string,
  additionalSeconds: number
): Promise<boolean> {
  try {
    const session = await prisma.session.findFirst({
      where: { token: sessionId, userId },
    });

    if (!session) return false;

    const newExpiresAt = new Date(session.expiresAt.getTime() + additionalSeconds * 1000);

    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });

    return true;
  } catch (error) {
    console.error("Failed to extend session:", error);
    return false;
  }
}

/**
 * Get concurrent sessions limit from environment or default
 */
export function getConcurrentSessionsLimit(): number {
  return parseInt(process.env.MAX_CONCURRENT_SESSIONS || "5", 10);
}

/**
 * Enforce concurrent sessions limit
 * Removes oldest sessions if limit is exceeded
 */
export async function enforceConcurrentSessionsLimit(
  userId: string,
  currentSessionId?: string
): Promise<number> {
  const limit = getConcurrentSessionsLimit();

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivity: "desc" },
  });

  if (sessions.length <= limit) {
    return 0;
  }

  // Keep the most recent sessions up to the limit
  const sessionsToKeep = currentSessionId
    ? sessions.filter((s) => s.token === currentSessionId).slice(0, 1).concat(
        sessions.filter((s) => s.token !== currentSessionId).slice(0, limit - 1)
      )
    : sessions.slice(0, limit);

  const sessionIdsToKeep = sessionsToKeep.map((s) => s.id);

  const result = await prisma.session.deleteMany({
    where: {
      userId,
      id: { notIn: sessionIdsToKeep },
    },
  });

  return result.count;
}

// Cleanup expired sessions periodically (every hour)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
