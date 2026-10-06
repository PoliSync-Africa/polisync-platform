import { NextResponse } from "next/server";

const RETAINED_PRODUCT_ROUTES = [
  "/calendar",
  "/personal",
  "/weather",
  "/messages",
  "/notifications",
  "/ai-analyzer",
  "/command-center",
  "/war-room",
];

const ELECTION_ROUTES = [
  "/dashboard",
  "/elections",
  "/results",
  "/submit-result",
  "/integrity",
  "/party",
  "/presidential-candidate",
  "/parliamentary-candidate",
  "/pink-sheet",
  "/observer/elections",
  "/observer/results",
  "/super-admin",
  "/profile",
  "/settings/security",
  "/login",
  "/register",
  "/forgot-password",
  "/invite",
  "/role-invite",
  "/privacy",
  "/policies",
];

const BLOCKED_WORKSPACE_PREFIXES = [
  "/campaigns",
  "/research",
  "/field-work",
  "/notes",
  "/news",
  "/electionos",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  if (BLOCKED_WORKSPACE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/elections";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") return NextResponse.next();

  if (RETAINED_PRODUCT_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/")) || ELECTION_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
