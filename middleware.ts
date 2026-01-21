import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/student-access",
    "/api/auth",
    "/api/notifications",
    "/api/batches",
    "/api/degrees",
    "/api/students",
    "/api/modules",
    "/api/years",
    "/api/semesters",
    "/api/grades",
    "/api/activity",
    "/api/student-access",
    "/admin/reset-password",
    "/api/admin/admins/reset-password",
  ];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // If user is authenticated and trying to access login page, redirect based on role
  if (token && pathname === "/login") {
    if (token.type === "student") {
      // Redirect students to their detail page
      const url = new URL(
        `/${token.batch}/${token.degree}/students/${token.indexNumber}`,
        request.url,
      );
      return NextResponse.redirect(url);
    } else if (token.type === "lecturer") {
      // Redirect lecturers to home
      const url = new URL("/", request.url);
      return NextResponse.redirect(url);
    } else if (token.type === "admin") {
      // Redirect admins to admin panel
      const url = new URL("/admin", request.url);
      return NextResponse.redirect(url);
    }
  }

  // If accessing a public path, allow
  if (isPublicPath) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  if (!token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // Role-based access control
  const userType = token.type as string;

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (userType !== "admin") {
      // Redirect non-admin users to home
      const url = new URL("/", request.url);
      return NextResponse.redirect(url);
    }
  }

  // Student restrictions - can only access their own detail page
  if (userType === "student") {
    // Allow API calls
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    const allowedPath = `/${token.batch}/${token.degree}/students/${token.indexNumber}`;
    // Decode the pathname to handle URL encoding (e.g., "batch%2021" -> "batch 21")
    const decodedPathname = decodeURIComponent(pathname);

    if (
      decodedPathname !== allowedPath &&
      !decodedPathname.startsWith(`/${token.batch}/${token.degree}/photos/`)
    ) {
      // Redirect students trying to access other pages to their own page
      const url = new URL(allowedPath, request.url);
      return NextResponse.redirect(url);
    }
  }

  // Lecturer restrictions - cannot access admin panel (already handled above)
  // Lecturers can access home and students pages

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
  ],
};
