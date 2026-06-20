import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/account", "/transaction", "/reports", "/settings", "/subscriptions", "/splits"];

export function middleware(request) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Inngest dev probes — avoid Next.js _not-found crash
  if (
    pathname.startsWith("/.netlify/functions/inngest") ||
    pathname.startsWith("/.redwood/functions/inngest")
  ) {
    return NextResponse.rewrite(
      new URL("/api/inngest", request.url)
    );
  }

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (pathname === "/sign-in" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/transaction/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/subscriptions/:path*",
    "/splits/:path*",
    "/sign-in",
  ],
};
