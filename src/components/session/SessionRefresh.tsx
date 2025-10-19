"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useSession } from "next-auth/react"
import { useIdleTimeout } from "@/hooks/useIdleTimeout"
import { SESSION_CONFIG, getSessionConfig } from "@/lib/session-config"
import { SessionExpiryWarning } from "./SessionExpiryWarning"

interface SessionRefreshProps {
  /**
   * Custom configuration (overrides defaults)
   */
  config?: Partial<typeof SESSION_CONFIG>

  /**
   * Callback when session is refreshed
   */
  onRefresh?: () => void

  /**
   * Callback when session refresh fails
   */
  onRefreshError?: (error: Error) => void

  /**
   * Whether to show debug logs
   * Default: false (true in development)
   */
  debug?: boolean
}

/**
 * SessionRefresh Component
 *
 * Handles automatic session refresh with the following features:
 * - Periodic session refresh (every 5 minutes by default)
 * - Refresh on window focus
 * - Refresh on network reconnect
 * - Idle detection (stops refresh when idle)
 * - Session expiry warning
 * - Debounced refresh calls
 */
export function SessionRefresh({
  config: customConfig,
  onRefresh,
  onRefreshError,
  debug = process.env.NODE_ENV === "development",
}: SessionRefreshProps = {}) {
  const { data: session, update, status } = useSession()
  const config = { ...getSessionConfig(), ...customConfig }

  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)

  const lastRefreshRef = useRef<number>(0)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const expiryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Log helper
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log("[SessionRefresh]", ...args)
    }
  }, [debug])

  // Refresh the session
  const refreshSession = useCallback(async () => {
    // Don't refresh if not authenticated
    if (status !== "authenticated") {
      log("Skipping refresh - not authenticated")
      return
    }

    // Debounce: Don't refresh if we refreshed recently
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshRef.current

    if (timeSinceLastRefresh < config.refreshDebounce) {
      log(`Debounced - last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago`)
      return
    }

    try {
      log("Refreshing session...")
      await update()
      lastRefreshRef.current = now
      onRefresh?.()
      log("Session refreshed successfully")
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error")
      log("Session refresh failed:", err)
      onRefreshError?.(err)
    }
  }, [status, config.refreshDebounce, update, onRefresh, onRefreshError, log])

  // Idle detection
  const { isIdle } = useIdleTimeout({
    timeout: config.idleTimeout,
    enabled: config.enableIdleDetection,
    onIdle: () => {
      log("User is idle - pausing session refresh")
    },
    onActive: () => {
      log("User is active - resuming session refresh")
      refreshSession()
    },
  })

  // Check session expiry and show warning if needed
  useEffect(() => {
    if (!config.enableExpiryWarning || status !== "authenticated") {
      return
    }

    const checkExpiry = () => {
      // In a real implementation, you'd get the token expiry from the session
      // For now, we'll estimate based on last login time
      // This is a simplified version - in production you'd want to decode the JWT

      // Note: This is a placeholder. You would need to add token expiry to the session
      // or decode the JWT to get the actual expiry time

      // For now, just clear the warning
      setShowExpiryWarning(false)
      setTimeUntilExpiry(null)
    }

    // Check every minute
    expiryCheckIntervalRef.current = setInterval(checkExpiry, 60 * 1000)
    checkExpiry()

    return () => {
      if (expiryCheckIntervalRef.current) {
        clearInterval(expiryCheckIntervalRef.current)
      }
    }
  }, [config.enableExpiryWarning, status, session])

  // Auto-refresh interval
  useEffect(() => {
    if (!config.autoRefresh || status !== "authenticated") {
      return
    }

    log(`Setting up auto-refresh every ${config.refreshInterval / 1000}s`)

    // Set up periodic refresh
    refreshIntervalRef.current = setInterval(() => {
      // Don't refresh if user is idle
      if (isIdle && config.enableIdleDetection) {
        log("Skipping refresh - user is idle")
        return
      }

      refreshSession()
    }, config.refreshInterval)

    // Initial refresh
    refreshSession()

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [
    config.autoRefresh,
    config.refreshInterval,
    config.enableIdleDetection,
    status,
    isIdle,
    refreshSession,
    log,
  ])

  // Refresh on window focus
  useEffect(() => {
    if (!config.refreshOnFocus || status !== "authenticated") {
      return
    }

    const handleFocus = () => {
      log("Window focused - refreshing session")
      refreshSession()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [config.refreshOnFocus, status, refreshSession, log])

  // Refresh on network reconnect
  useEffect(() => {
    if (!config.refreshOnReconnect || status !== "authenticated") {
      return
    }

    const handleOnline = () => {
      log("Network reconnected - refreshing session")
      refreshSession()
    }

    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [config.refreshOnReconnect, status, refreshSession, log])

  // Show expiry warning if needed
  if (showExpiryWarning && timeUntilExpiry !== null) {
    return (
      <SessionExpiryWarning
        timeRemaining={timeUntilExpiry}
        onContinue={() => {
          setShowExpiryWarning(false)
          refreshSession()
        }}
        onLogout={() => {
          // Will be handled by parent component
          setShowExpiryWarning(false)
        }}
      />
    )
  }

  // This component doesn't render anything visible
  return null
}
