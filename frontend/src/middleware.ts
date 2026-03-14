import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const sessionCookieName =
  process.env.NEXT_PUBLIC_SESSION_COOKIE ?? "hostinvo_session";

function extractLocale(pathname: string): string | null {
  return (
    routing.locales.find(
      (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    ) ?? null
  );
}

function stripLocale(pathname: string, locale: string): string {
  const withoutLocale = pathname.slice(locale.length + 1);

  return withoutLocale ? `/${withoutLocale}` : "/";
}

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}`;

    return NextResponse.redirect(url);
  }

  const response = intlMiddleware(request);
  const locale = extractLocale(request.nextUrl.pathname);

  if (!locale) {
    return response;
  }

  const localizedPath = stripLocale(request.nextUrl.pathname, locale);
  const hasSession = request.cookies.has(sessionCookieName);
  const isProtected =
    localizedPath === "/dashboard" ||
    localizedPath.startsWith("/dashboard/") ||
    localizedPath === "/portal" ||
    localizedPath.startsWith("/portal/");

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  if (
    hasSession &&
    (localizedPath === "/auth/login" ||
      localizedPath === "/auth/forgot-password" ||
      localizedPath === "/auth/reset-password")
  ) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
