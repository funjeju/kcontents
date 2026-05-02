import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = ["/me", "/billing", "/settings"];
const AUTH_PATHS = ["/login", "/signup", "/onboarding"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Strip locale prefix for path checks (/ko/scenarios → /scenarios)
  const localeMatch = pathname.match(/^\/(ko|en)(\/.*)?$/);
  const pathnameWithoutLocale = localeMatch ? (localeMatch[2] ?? "/") : pathname;

  const isProtected = PROTECTED_PATHS.some((p) => pathnameWithoutLocale.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathnameWithoutLocale.startsWith(p));

  const session = req.cookies.get("session")?.value;

  if (isProtected && !session) {
    const locale = localeMatch?.[1] ?? routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && session && !pathnameWithoutLocale.startsWith("/onboarding")) {
    const locale = localeMatch?.[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/scenarios/recommended`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
