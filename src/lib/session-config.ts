/**
 * Session refresh configuration
 * Configure session refresh intervals, idle timeouts, and warning thresholds
 */

export const SESSION_CONFIG = {
  // Session refresh interval (how often to check and refresh the session)
  // Default: 5 minutes
  refreshInterval: 5 * 60 * 1000, // 5 minutes in milliseconds

  // Idle timeout (how long before considering user inactive)
  // Default: 30 minutes
  idleTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds

  // Warning before expiry (show warning this many seconds before session expires)
  // Default: 5 minutes
  expiryWarning: 5 * 60 * 1000, // 5 minutes in milliseconds

  // Minimum time between refresh calls (debounce)
  // Default: 1 minute
  refreshDebounce: 60 * 1000, // 1 minute in milliseconds

  // Enable automatic session refresh
  autoRefresh: true,

  // Enable idle detection
  enableIdleDetection: true,

  // Enable session expiry warning
  enableExpiryWarning: true,

  // Refresh on window focus
  refreshOnFocus: true,

  // Refresh on network reconnect
  refreshOnReconnect: true,

  // Events that reset the idle timer
  idleEvents: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ] as const,

  // Session durations (should match auth-options.ts)
  shortSessionAge: 86400, // 1 day in seconds
  longSessionAge: 2592000, // 30 days in seconds
} as const

export type SessionConfig = typeof SESSION_CONFIG

/**
 * Get session config with environment variable overrides
 */
export function getSessionConfig(): SessionConfig {
  return {
    ...SESSION_CONFIG,
    // Allow environment variable overrides
    refreshInterval: parseInt(
      process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL ||
      String(SESSION_CONFIG.refreshInterval)
    ),
    idleTimeout: parseInt(
      process.env.NEXT_PUBLIC_IDLE_TIMEOUT ||
      String(SESSION_CONFIG.idleTimeout)
    ),
    expiryWarning: parseInt(
      process.env.NEXT_PUBLIC_EXPIRY_WARNING ||
      String(SESSION_CONFIG.expiryWarning)
    ),
  }
}
