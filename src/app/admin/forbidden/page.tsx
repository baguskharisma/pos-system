import { Metadata } from "next"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Access Denied | POS System",
  description: "You don't have permission to access this page",
}

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <ShieldAlert className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Access Denied
        </h1>

        <p className="text-lg text-slate-600 mb-2">
          You don't have permission to access this page.
        </p>

        <p className="text-sm text-slate-500 mb-8">
          This page requires elevated privileges. Please contact your administrator if you believe you should have access.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default">
            <Link href="/admin/dashboard">
              Go to Dashboard
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/profile">
              View Profile
            </Link>
          </Button>
        </div>

        <div className="mt-8 p-4 bg-slate-100 rounded-lg">
          <p className="text-xs text-slate-600">
            If you need access to this resource, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
