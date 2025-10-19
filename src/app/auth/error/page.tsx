import { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Authentication Error | POS System",
  description: "An authentication error occurred",
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in.",
  },
  Verification: {
    title: "Verification Failed",
    description: "The verification token has expired or has already been used.",
  },
  Default: {
    title: "Authentication Error",
    description: "An error occurred during authentication.",
  },
  AccountInactive: {
    title: "Account Inactive",
    description: "Your account has been deactivated. Please contact your administrator.",
  },
  SessionExpired: {
    title: "Session Expired",
    description: "Your session has expired. Please sign in again.",
  },
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorType = searchParams.error || "Default"
  const errorInfo = errorMessages[errorType] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          {errorInfo.title}
        </h1>

        <p className="text-lg text-slate-600 mb-8">
          {errorInfo.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default">
            <Link href="/auth/signin">
              Try Signing In Again
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/">
              Go to Home
            </Link>
          </Button>
        </div>

        {errorType === "AccountInactive" && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your account has been deactivated. Please contact your system administrator to reactivate your account.
            </p>
          </div>
        )}

        <div className="mt-8">
          <p className="text-xs text-slate-500">
            Error code: {errorType}
          </p>
        </div>
      </div>
    </div>
  )
}
