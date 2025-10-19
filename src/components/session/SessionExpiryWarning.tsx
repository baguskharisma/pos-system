"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SessionExpiryWarningProps {
  /**
   * Time remaining in milliseconds
   */
  timeRemaining: number

  /**
   * Callback when user clicks continue
   */
  onContinue: () => void

  /**
   * Callback when user clicks logout
   */
  onLogout?: () => void
}

/**
 * SessionExpiryWarning Component
 *
 * Displays a modal warning when the session is about to expire
 * Allows user to continue (which refreshes the session) or logout
 */
export function SessionExpiryWarning({
  timeRemaining: initialTimeRemaining,
  onContinue,
  onLogout,
}: SessionExpiryWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining)

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1000
        // Auto-logout if time runs out
        if (next <= 0) {
          handleLogout()
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    onLogout?.()
    await signOut({ callbackUrl: "/auth/signin" })
  }

  const handleContinue = () => {
    onContinue()
  }

  // Format time remaining
  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
          {/* Icon and Title */}
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Session Expiring Soon
              </h2>
              <p className="text-sm text-slate-600">
                Your session is about to expire
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 font-mono">
                  {formattedTime}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {minutes === 0 && seconds <= 30
                    ? "Logging out soon..."
                    : "Time remaining"}
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-600 text-center">
            You will be automatically logged out when the timer reaches zero.
            Click "Continue Session" to stay logged in.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1"
            >
              Logout Now
            </Button>
            <Button
              onClick={handleContinue}
              variant="default"
              className="flex-1"
            >
              Continue Session
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
