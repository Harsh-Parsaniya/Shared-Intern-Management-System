import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth-utils";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for static assets, api, and login
  if (
    pathname.includes("/_next") || 
    pathname.includes("/favicon.ico") ||
    pathname.startsWith("/login") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // 2. Redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Verify token and roles
  const payload = await verifyToken(token) as { role: string } | null;
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  // 4. Role-based checks
  const role = payload.role;

  // Interns can only access /intern/* routes
  if (pathname.startsWith("/intern/") && role !== "intern") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect interns away from admin routes to their own panel
  if (!pathname.startsWith("/intern/") && role === "intern") {
    return NextResponse.redirect(new URL("/intern/dashboard", request.url));
  }

  // Dept users can only access /dept/* routes
  if (pathname.startsWith("/dept") && role !== "department") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect dept users away from admin routes to their own panel
  if (!pathname.startsWith("/dept") && role === "department") {
    return NextResponse.redirect(new URL("/dept/dashboard", request.url));
  }

  // Admin-only routes
  const adminOnlyRoutes = ["/departments", "/settings"];
  if (adminOnlyRoutes.some(route => pathname.startsWith(route)) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Management routes (Admin & Dept only)
  const managementRoutes = ["/interns", "/feedback"];
  if (managementRoutes.some(route => pathname.startsWith(route)) && role === "intern") {
    return NextResponse.redirect(new URL("/intern/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
