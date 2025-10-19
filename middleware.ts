import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import type { UserRole } from "@prisma/client"

// Define route patterns
const publicRoutes = [
  "/",
  "/menu",
  "/cart",
  "/checkout",
  "/order",
  "/auth/signin",
  "/auth/error",
  "/auth/forgot-password",
  "/login",
  "/api/auth",
  "/api-docs",
]

const adminRoutes = [
  "/admin/dashboard",
  "/admin/pos",
  "/admin/orders",
  "/admin/products",
  "/admin/categories",
  "/admin/reports",
  "/admin/cash-drawer",
  "/admin/inventory",
  "/admin/profile",
]

const superAdminOnlyRoutes = [
  "/admin/users",
  "/admin/settings",
]

const superAdminOnlyApiRoutes = [
  "/api/users",
  "/api/settings",
  "/api/audit-logs",
]

// Helper function to check if path matches a route pattern
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => {
    // Exact match
    if (path === route) return true
    // Prefix match (e.g., /api/auth matches /api/auth/*)
    if (path.startsWith(`${route}/`)) return true
    return false
  })
}

// Helper function to check if route is public
function isPublicRoute(path: string): boolean {
  // Check exact public routes
  if (matchesRoute(path, publicRoutes)) return true

  // Allow order tracking routes: /order/[id] and /order/[id]/receipt
  if (/^\/order\/[^/]+(?:\/receipt)?$/.test(path)) return true

  // Allow public API routes
  if (path.startsWith("/api/auth/")) return true
  if (path === "/api/payment/notification") return true
  if (path.match(/^\/api\/payment\/check-status\/[^/]+$/)) return true

  // Allow GET requests to products and categories API
  // Note: We'll check the method later for these

  return false
}

// Helper function to check if route requires super admin
function requiresSuperAdmin(path: string): boolean {
  if (matchesRoute(path, superAdminOnlyRoutes)) return true
  if (matchesRoute(path, superAdminOnlyApiRoutes)) return true
  return false
}

// Helper function to check if route requires authentication
function requiresAuth(path: string): boolean {
  // Admin routes require auth
  if (path.startsWith("/admin")) return true

  // API routes require auth (except public ones)
  if (path.startsWith("/api") && !isPublicRoute(path)) return true

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes("/images/") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    // Special handling for GET-only public API routes
    if (pathname.startsWith("/api/products") || pathname.startsWith("/api/categories")) {
      if (method === "GET") {
        return NextResponse.next()
      }
      // For non-GET methods, continue to auth check
    } else {
      return NextResponse.next()
    }
  }

  // Check if route requires authentication
  if (requiresAuth(pathname)) {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // If no token, redirect to login
    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: "Unauthorized - Authentication required" },
          { status: 401 }
        )
      }

      // For page routes, redirect to login with callback
      const signInUrl = new URL("/auth/signin", request.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Check if user is active
    if (!token.isActive) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: "Account is inactive" },
          { status: 403 }
        )
      }

      const errorUrl = new URL("/auth/error", request.url)
      errorUrl.searchParams.set("error", "AccountInactive")
      return NextResponse.redirect(errorUrl)
    }

    // Check role-based access for super admin only routes
    if (requiresSuperAdmin(pathname)) {
      const userRole = token.role as UserRole

      if (userRole !== "SUPER_ADMIN") {
        // For API routes, return 403
        if (pathname.startsWith("/api")) {
          return NextResponse.json(
            { error: "Forbidden - Super Admin access required" },
            { status: 403 }
          )
        }

        // For page routes, redirect to forbidden page
        const forbiddenUrl = new URL("/admin/forbidden", request.url)
        return NextResponse.redirect(forbiddenUrl)
      }
    }

    // Additional role checks for specific API routes
    if (pathname.startsWith("/api")) {
      const userRole = token.role as UserRole

      // Check if user has permission for write operations on products/categories
      if (
        (pathname.startsWith("/api/products") || pathname.startsWith("/api/categories")) &&
        (method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH")
      ) {
        if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
          return NextResponse.json(
            { error: "Forbidden - Admin access required" },
            { status: 403 }
          )
        }
      }

      // Check permissions for order operations
      if (pathname.includes("/confirm-payment") || pathname.includes("/update-status")) {
        if (!["SUPER_ADMIN", "ADMIN", "CASHIER"].includes(userRole)) {
          return NextResponse.json(
            { error: "Forbidden - Insufficient permissions" },
            { status: 403 }
          )
        }
      }

      // Check permissions for reports
      if (pathname.startsWith("/api/reports")) {
        if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
          return NextResponse.json(
            { error: "Forbidden - Admin access required" },
            { status: 403 }
          )
        }
      }

      // Check permissions for cash drawer and inventory
      if (pathname.startsWith("/api/cash-drawer") || pathname.startsWith("/api/inventory")) {
        if (!["SUPER_ADMIN", "ADMIN", "CASHIER"].includes(userRole)) {
          return NextResponse.json(
            { error: "Forbidden - Insufficient permissions" },
            { status: 403 }
          )
        }
      }
    }

    // Check role-based access for admin page routes
    if (pathname.startsWith("/admin")) {
      const userRole = token.role as UserRole

      // Reports require admin access
      if (pathname.startsWith("/admin/reports")) {
        if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
          const forbiddenUrl = new URL("/admin/forbidden", request.url)
          return NextResponse.redirect(forbiddenUrl)
        }
      }

      // Products and categories write access require admin
      if (
        (pathname.startsWith("/admin/products/new") ||
         pathname.includes("/products/") && pathname.includes("/edit") ||
         pathname.startsWith("/admin/categories/new") ||
         pathname.includes("/categories/") && pathname.includes("/edit"))
      ) {
        if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
          const forbiddenUrl = new URL("/admin/forbidden", request.url)
          return NextResponse.redirect(forbiddenUrl)
        }
      }
    }

    // Add user info to headers for easy access in route handlers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", token.id as string)
    requestHeaders.set("x-user-role", token.role as string)
    requestHeaders.set("x-user-email", token.email as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Allow all other routes
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
