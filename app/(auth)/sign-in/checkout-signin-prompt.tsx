'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "./google-signin-button";
import CredentialsSignInForm from "./credentials-signin-form";
import Link from "next/link";
// Icons removed due to build issues

interface CheckoutSignInPromptProps {
  callbackUrl: string;
}

export function CheckoutSignInPrompt({ callbackUrl }: CheckoutSignInPromptProps) {
  const isCheckoutFlow = callbackUrl.includes('/checkout') || callbackUrl.includes('/cart');
  
  if (!isCheckoutFlow) {
    return null; // Only show for checkout flows
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          🛒 Continue to Checkout
        </CardTitle>
        <CardDescription className="text-orange-600">
          Sign in to access your saved information and complete your purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-orange-700">
          <span>• Your cart is saved and will be available after sign-in</span>
        </div>
        
        <div className="flex gap-2">
          <GoogleSignInButton callbackUrl={callbackUrl} />
          <Button variant="outline" asChild>
            <Link href={callbackUrl}>
              ← Continue as Guest
            </Link>
          </Button>
        </div>
        
        <div className="text-center text-sm text-orange-600">
          Or sign in with your email below
        </div>
      </CardContent>
    </Card>
  );
}
