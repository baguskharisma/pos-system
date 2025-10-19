import { redirect } from "next/navigation"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  // Redirect to the main signin page
  const callbackUrl = searchParams.callbackUrl || "/"
  redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
}
