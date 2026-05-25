// proxy.ts (renamed from middleware.ts for Next.js 16)
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Handle sessionCartId for cart functionality
  const secFetchDest = req.headers.get("sec-fetch-dest") || "";
  const isDocument = secFetchDest === "document"; // main navigation/document
  if (isDocument) {
    if (!req.cookies.get("sessionCartId")) {
      const uuid = crypto.randomUUID();
      res.cookies.set("sessionCartId", uuid, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }
  }

  // Auth protection: allow anonymous access to product and cart pages
  // Only protect clearly account-related areas
  const isAuthPage = req.nextUrl.pathname.startsWith('/sign-in') ||
                     req.nextUrl.pathname.startsWith('/sign-up');
  const isAccountArea = req.nextUrl.pathname.startsWith('/account') ||
                        req.nextUrl.pathname.startsWith('/orders') ||
                        req.nextUrl.pathname.startsWith('/admin') ||
                        req.nextUrl.pathname.startsWith('/crafter') ||
                        req.nextUrl.pathname.startsWith('/user') ||
                        req.nextUrl.pathname.startsWith('/profile') ||
                        req.nextUrl.pathname.startsWith('/shipping-address') ||
                        req.nextUrl.pathname.startsWith('/payment-method') ||
                        req.nextUrl.pathname.startsWith('/place-order') ||
                        req.nextUrl.pathname.startsWith('/checkout');

  // Check for auth session (simplified check)
  const hasAuthSession = req.cookies.get("authjs.session-token") ||
                         req.cookies.get("__Secure-authjs.session-token");

  // Redirect only for protected account areas
  if (isAccountArea && !hasAuthSession && !isAuthPage) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/product/:path*",
    "/cart",
    "/checkout",
    "/account/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/crafter/:path*",
    "/user/:path*",
    "/profile",
    "/sign-in",
    "/sign-up",
    "/reset-password",
    "/shipping-address",
    "/payment-method",
    "/place-order",
    "/checkout",
  ],
};
