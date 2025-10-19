import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import type { UserRole } from "@prisma/client";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      employeeId?: string | null;
      avatar?: string | null;
      phone?: string | null;
      isActive: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    employeeId?: string | null;
    avatar?: string | null;
    phone?: string | null;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    employeeId?: string | null;
    avatar?: string | null;
    phone?: string | null;
    isActive: boolean;
    sessionId?: string;
    iat?: number;
    exp?: number;
    jti?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            name: true,
            role: true,
            employeeId: true,
            avatar: true,
            phone: true,
            isActive: true,
            lockedUntil: true,
            failedLoginAttempts: true,
            deletedAt: true,
          },
        });

        // Check if user exists
        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Check if user is deleted
        if (user.deletedAt) {
          throw new Error("Account has been deleted");
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is inactive. Please contact administrator");
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - new Date().getTime()) / 60000
          );
          throw new Error(
            `Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s)`
          );
        }

        // Verify password
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Increment failed login attempts
          const failedAttempts = user.failedLoginAttempts + 1;
          const shouldLock = failedAttempts >= 5;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failedAttempts,
              ...(shouldLock && {
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Lock for 15 minutes
              }),
            },
          });

          if (shouldLock) {
            throw new Error(
              "Account locked due to multiple failed login attempts. Try again in 15 minutes"
            );
          }

          throw new Error("Invalid email or password");
        }

        // Reset failed login attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        // Return user object (passwordHash excluded)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
          avatar: user.avatar,
          phone: user.phone,
          isActive: user.isActive,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "2592000", 10), // 30 days default
    updateAge: parseInt(process.env.SESSION_UPDATE_AGE || "86400", 10), // 1 day default
  },
  jwt: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "2592000", 10), // 30 days default
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.avatar = user.avatar;
        token.phone = user.phone;
        token.isActive = user.isActive;

        // Add session metadata
        token.sessionId = crypto.randomUUID();
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Handle session updates
      if (trigger === "update" && session) {
        // Validate user is still active before updating
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isActive: true,
              deletedAt: true,
              role: true,
              name: true,
              avatar: true,
              phone: true,
            },
          });

          if (!dbUser || dbUser.deletedAt || !dbUser.isActive) {
            // User is no longer active or deleted
            throw new Error("User account is no longer active");
          }

          // Update token with latest user data
          token.isActive = dbUser.isActive;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.avatar = dbUser.avatar;
          token.phone = dbUser.phone;
        }

        // Merge session updates
        token = { ...token, ...session };
      }

      // Token rotation: Check if token is old and needs refresh
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number || 0);
      const updateAge = parseInt(process.env.SESSION_UPDATE_AGE || "86400", 10);

      if (tokenAge > updateAge) {
        // Refresh user data from database
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isActive: true,
              deletedAt: true,
              role: true,
              name: true,
              avatar: true,
              phone: true,
              email: true,
              employeeId: true,
            },
          });

          if (dbUser && !dbUser.deletedAt && dbUser.isActive) {
            // Update token with fresh data
            token.isActive = dbUser.isActive;
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.avatar = dbUser.avatar;
            token.phone = dbUser.phone;
            token.email = dbUser.email;
            token.employeeId = dbUser.employeeId;
            token.iat = Math.floor(Date.now() / 1000);
          } else {
            // User is no longer valid
            throw new Error("User account is no longer active");
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.employeeId = token.employeeId as string | null;
        session.user.avatar = token.avatar as string | null;
        session.user.phone = token.phone as string | null;
        session.user.isActive = token.isActive as boolean;
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        // Create audit log for successful login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "USER",
            entityId: user.id,
            metadata: {
              timestamp: new Date().toISOString(),
              isNewUser: isNewUser || false,
              provider: account?.provider || "credentials",
            },
          },
        });

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (error) {
        console.error("SignIn event error:", error);
      }
    },
    async signOut({ token, session }) {
      try {
        // Create audit log for logout
        if (token?.id) {
          await prisma.auditLog.create({
            data: {
              userId: token.id as string,
              action: "LOGOUT",
              entityType: "USER",
              entityId: token.id as string,
              metadata: {
                timestamp: new Date().toISOString(),
                sessionId: token.sessionId,
              },
            },
          });

          // Invalidate session in database if sessionId exists
          if (token.sessionId) {
            await prisma.session.deleteMany({
              where: {
                userId: token.id as string,
                token: token.sessionId as string,
              },
            });
          }
        }
      } catch (error) {
        console.error("SignOut event error:", error);
      }
    },
    async createUser({ user }) {
      try {
        // Log user creation
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_CREATED",
            entityType: "USER",
            entityId: user.id,
            metadata: {
              timestamp: new Date().toISOString(),
              email: user.email,
            },
          },
        });
      } catch (error) {
        console.error("CreateUser event error:", error);
      }
    },
    async updateUser({ user }) {
      try {
        // Log user updates
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_UPDATED",
            entityType: "USER",
            entityId: user.id,
            metadata: {
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error("UpdateUser event error:", error);
      }
    },
    async linkAccount({ user, account, profile }) {
      try {
        // Log account linking
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "ACCOUNT_LINKED",
            entityType: "USER",
            entityId: user.id,
            metadata: {
              timestamp: new Date().toISOString(),
              provider: account.provider,
            },
          },
        });
      } catch (error) {
        console.error("LinkAccount event error:", error);
      }
    },
    async session({ session, token }) {
      // This event is called whenever a session is checked
      // Can be used for session activity tracking
      // Note: Called very frequently, so be careful with database operations
    },
  },
  debug: process.env.NODE_ENV === "development",
};
