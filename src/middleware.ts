import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Allow access to auth pages and public routes
    if (
      pathname.startsWith("/auth/") ||
      pathname === "/" ||
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/icons/") ||
      pathname.startsWith("/manifest")
    ) {
      return NextResponse.next();
    }

    // Redirect to signin if not authenticated
    if (!token) {
      if (process.env.APP_DEBUG === "1") {
        console.log("[Middleware] Unauthenticated redirect", { path: pathname });
      }
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Role-based access control for dashboard routes
    if (pathname.startsWith("/dashboard/")) {
      const userType = token.userType as string;
      const dashboardType = pathname.split("/")[2]; // Extract dashboard type from URL

      // Redirect to correct dashboard if accessing wrong one
      if (dashboardType && dashboardType !== userType?.toLowerCase()) {
        return NextResponse.redirect(
          new URL(`/dashboard/${userType?.toLowerCase()}`, req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow public routes
        if (
          pathname.startsWith("/auth/") ||
          pathname === "/" ||
          pathname.startsWith("/api/auth/") ||
          pathname.startsWith("/_next/") ||
          pathname.startsWith("/favicon") ||
          pathname.startsWith("/icons/") ||
          pathname.startsWith("/manifest")
        ) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, manifest, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest|sw.js|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
