/**
 * Checkout Protection Middleware
 * Redirects unauthenticated users to sign-in with callback URL
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Protects checkout routes - redirects to sign-in if not authenticated
 * @param returnUrl - URL to redirect to after successful sign-in
 */
export async function protectCheckout(returnUrl: string = '/checkout') {
  const session = await auth();
  
  if (!session?.user) {
    // User is not authenticated, redirect to sign-in with callback
    const callbackUrl = encodeURIComponent(returnUrl);
    redirect(`/sign-in?callbackUrl=${callbackUrl}`);
  }
  
  // User is authenticated, allow access
  return session;
}

/**
 * Gets the current callback URL from search params or headers
 */
export function getCallbackUrl(defaultUrl: string = '/'): string {
  const headersList = headers();
  
  // Try to get from referer header first
  const referer = headersList.get('referer');
  if (referer && (referer.includes('/checkout') || referer.includes('/cart'))) {
    return referer;
  }
  
  return defaultUrl;
}

/**
 * Sign-up with callback for checkout flow
 */
export function getSignUpCallbackUrl(callbackUrl?: string): string {
  const signUpUrl = '/sign-up';
  if (callbackUrl && callbackUrl !== '/') {
    return `${signUpUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }
  return signUpUrl;
}
