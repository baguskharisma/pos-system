"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Logout options
 */
export interface LogoutOptions {
  /**
   * Revoke all sessions (logout from all devices)
   * Default: false
   */
  revokeAll?: boolean;

  /**
   * Redirect URL after logout
   * Default: "/auth/signin"
   */
  redirectTo?: string;

  /**
   * Callback URL parameter
   * Default: undefined
   */
  callbackUrl?: string;

  /**
   * Show confirmation dialog
   * Default: false
   */
  confirm?: boolean;

  /**
   * Confirmation message
   * Default: "Are you sure you want to logout?"
   */
  confirmMessage?: string;
}

/**
 * Logout result
 */
export interface LogoutResult {
  success: boolean;
  error?: string;
  revokedSessions?: number;
}

/**
 * Hook for logout functionality
 *
 * @example
 * const { logout, isLoggingOut } = useLogout();
 *
 * // Simple logout
 * await logout();
 *
 * // Logout from all devices
 * await logout({ revokeAll: true });
 *
 * // Logout with redirect
 * await logout({ redirectTo: "/goodbye" });
 */
export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Logout user
   */
  const logout = async (options: LogoutOptions = {}): Promise<LogoutResult> => {
    const {
      revokeAll = false,
      redirectTo = "/auth/signin",
      callbackUrl,
      confirm = false,
      confirmMessage = "Are you sure you want to logout?",
    } = options;

    // Show confirmation dialog if requested
    if (confirm) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return { success: false, error: "Logout cancelled" };
      }
    }

    setIsLoggingOut(true);
    setError(null);

    try {
      // Call logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ revokeAll }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to logout");
      }

      // Sign out from NextAuth
      // This clears the session cookie
      await signOut({
        redirect: false, // Don't redirect yet, we'll handle it
      });

      // Redirect after successful logout
      const finalRedirect = callbackUrl || redirectTo;
      router.push(finalRedirect);

      return {
        success: true,
        revokedSessions: data.revokedSessions,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to logout";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Logout from current device only
   */
  const logoutCurrent = async () => {
    return logout({ revokeAll: false });
  };

  /**
   * Logout from all devices
   */
  const logoutAll = async () => {
    return logout({
      revokeAll: true,
      confirm: true,
      confirmMessage:
        "Are you sure you want to logout from all devices? You will be signed out from all sessions.",
    });
  };

  /**
   * Quick logout (no confirmation)
   */
  const quickLogout = async (redirectTo?: string) => {
    return logout({ redirectTo, confirm: false });
  };

  /**
   * Logout with confirmation
   */
  const logoutWithConfirm = async (message?: string) => {
    return logout({
      confirm: true,
      confirmMessage: message,
    });
  };

  return {
    logout,
    logoutCurrent,
    logoutAll,
    quickLogout,
    logoutWithConfirm,
    isLoggingOut,
    error,
  };
}

/**
 * Simple logout function (for one-off usage)
 *
 * @example
 * import { logoutUser } from "@/hooks/useLogout";
 *
 * await logoutUser();
 * await logoutUser({ revokeAll: true });
 */
export async function logoutUser(
  options: LogoutOptions = {}
): Promise<LogoutResult> {
  const {
    revokeAll = false,
    redirectTo = "/auth/signin",
    callbackUrl,
  } = options;

  try {
    // Call logout API
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ revokeAll }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to logout");
    }

    // Sign out from NextAuth
    await signOut({
      callbackUrl: callbackUrl || redirectTo,
      redirect: true,
    });

    return {
      success: true,
      revokedSessions: data.revokedSessions,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to logout",
    };
  }
}

/**
 * Logout from all devices
 *
 * @example
 * import { logoutAllDevices } from "@/hooks/useLogout";
 *
 * await logoutAllDevices();
 */
export async function logoutAllDevices(): Promise<LogoutResult> {
  return logoutUser({ revokeAll: true });
}

export default useLogout;
