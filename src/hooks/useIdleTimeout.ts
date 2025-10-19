"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { SESSION_CONFIG } from "@/lib/session-config"

interface UseIdleTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   * Default: 30 minutes
   */
  timeout?: number

  /**
   * Events that reset the idle timer
   * Default: mousedown, mousemove, keypress, scroll, touchstart, click
   */
  events?: readonly string[]

  /**
   * Callback when user becomes idle
   */
  onIdle?: () => void

  /**
   * Callback when user becomes active after being idle
   */
  onActive?: () => void

  /**
   * Whether to enable idle detection
   * Default: true
   */
  enabled?: boolean
}

/**
 * Hook to detect user inactivity
 * Returns true if user has been idle for the specified timeout
 */
export function useIdleTimeout(options: UseIdleTimeoutOptions = {}) {
  const {
    timeout = SESSION_CONFIG.idleTimeout,
    events = SESSION_CONFIG.idleEvents,
    onIdle,
    onActive,
    enabled = true,
  } = options

  const [isIdle, setIsIdle] = useState(false)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isIdleRef = useRef(false)

  // Reset the idle timer
  const resetIdleTimer = useCallback(() => {
    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    // If user was idle and is now active
    if (isIdleRef.current) {
      isIdleRef.current = false
      setIsIdle(false)
      onActive?.()
    }

    // Set new timer
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true
      setIsIdle(true)
      onIdle?.()
    }, timeout)
  }, [timeout, onIdle, onActive])

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Set initial timer
    resetIdleTimer()

    // Add event listeners
    const eventListener = () => resetIdleTimer()

    events.forEach((event) => {
      window.addEventListener(event, eventListener)
    })

    // Cleanup
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }

      events.forEach((event) => {
        window.removeEventListener(event, eventListener)
      })
    }
  }, [enabled, events, resetIdleTimer])

  return {
    isIdle,
    reset: resetIdleTimer,
  }
}
