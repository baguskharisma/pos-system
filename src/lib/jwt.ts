import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * JWT Configuration
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-key"
);

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-refresh-secret"
);

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "30d";
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || "90d";

/**
 * JWT Token Types
 */
export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh",
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  API_KEY = "api_key",
}

/**
 * Custom JWT Payload
 */
export interface CustomJWTPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: TokenType;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parse time string to seconds
 * Supports: 30d, 7d, 24h, 60m, 3600s
 */
function parseTimeToSeconds(time: string): number {
  const match = time.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}

/**
 * Create a JWT token
 */
export async function createToken(
  payload: Omit<CustomJWTPayload, "iat" | "exp" | "jti">,
  options: {
    expiresIn?: string;
    tokenType?: TokenType;
  } = {}
): Promise<string> {
  const { expiresIn = JWT_EXPIRATION, tokenType = TokenType.ACCESS } = options;

  const secret = tokenType === TokenType.REFRESH ? JWT_REFRESH_SECRET : JWT_SECRET;
  const expirationSeconds = parseTimeToSeconds(expiresIn);

  const token = await new SignJWT({ ...payload, tokenType })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirationSeconds)
    .setJti(crypto.randomUUID())
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
  token: string,
  tokenType: TokenType = TokenType.ACCESS
): Promise<CustomJWTPayload> {
  try {
    const secret = tokenType === TokenType.REFRESH ? JWT_REFRESH_SECRET : JWT_SECRET;

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    // Verify token type matches
    if (payload.tokenType !== tokenType) {
      throw new Error("Invalid token type");
    }

    return payload as CustomJWTPayload;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("exp")) {
        throw new Error("Token has expired");
      }
      if (error.message.includes("signature")) {
        throw new Error("Invalid token signature");
      }
    }
    throw new Error("Invalid token");
  }
}

/**
 * Create access and refresh token pair
 */
export async function createTokenPair(payload: {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    createToken(
      { ...payload, tokenType: TokenType.ACCESS },
      { expiresIn: JWT_EXPIRATION }
    ),
    createToken(
      { ...payload, tokenType: TokenType.REFRESH },
      { expiresIn: JWT_REFRESH_EXPIRATION, tokenType: TokenType.REFRESH }
    ),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Verify refresh token
  const payload = await verifyToken(refreshToken, TokenType.REFRESH);

  // Create new token pair
  return createTokenPair({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
  });
}

/**
 * Create email verification token
 */
export async function createEmailVerificationToken(
  userId: string,
  email: string
): Promise<string> {
  return createToken(
    {
      userId,
      email,
      role: "unverified",
      tokenType: TokenType.EMAIL_VERIFICATION,
    },
    { expiresIn: "24h", tokenType: TokenType.EMAIL_VERIFICATION }
  );
}

/**
 * Verify email verification token
 */
export async function verifyEmailVerificationToken(
  token: string
): Promise<{ userId: string; email: string }> {
  const payload = await verifyToken(token, TokenType.EMAIL_VERIFICATION);
  return {
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * Create password reset token
 */
export async function createPasswordResetToken(
  userId: string,
  email: string
): Promise<string> {
  return createToken(
    {
      userId,
      email,
      role: "password_reset",
      tokenType: TokenType.PASSWORD_RESET,
    },
    { expiresIn: "1h", tokenType: TokenType.PASSWORD_RESET }
  );
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ userId: string; email: string }> {
  const payload = await verifyToken(token, TokenType.PASSWORD_RESET);
  return {
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * Create API key token (long-lived)
 */
export async function createApiKeyToken(
  userId: string,
  email: string,
  role: string
): Promise<string> {
  return createToken(
    {
      userId,
      email,
      role,
      tokenType: TokenType.API_KEY,
    },
    { expiresIn: "365d", tokenType: TokenType.API_KEY }
  );
}

/**
 * Decode token without verification (use with caution)
 */
export function decodeToken(token: string): CustomJWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    return payload as CustomJWTPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (without verification)
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  return decoded.exp * 1000 < Date.now();
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Get time until token expiration in seconds
 */
export function getTimeUntilExpiration(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const timeRemaining = Math.floor((expirationTime - currentTime) / 1000);

  return timeRemaining > 0 ? timeRemaining : 0;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
