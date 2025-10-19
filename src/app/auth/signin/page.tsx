import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/login/LoginForm"

export const metadata: Metadata = {
  title: "Sign In | POS System",
  description: "Sign in to your account",
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  const callbackUrl = searchParams.callbackUrl || "/"

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <LoginForm callbackUrl={callbackUrl} />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">
                  Need help?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-slate-900 hover:text-slate-700"
              >
                Forgot your password?
              </Link>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Contact your administrator if you need assistance accessing your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
