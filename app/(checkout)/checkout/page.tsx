/**
 * Protected Checkout Page
 * Redirects to sign-in if user is not authenticated
 */

import { protectCheckout } from "@/lib/middleware/checkout-protection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Using emojis instead of lucide-react icons due to build issues
import Link from "next/link";

export default async function CheckoutPage() {
  // Protect this route - will redirect to sign-in if not authenticated
  const session = await protectCheckout('/checkout');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛒 Checkout
            </CardTitle>
            <CardDescription>
              Welcome back, {session.user?.name}! Complete your purchase below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600">✓</span>
              <div>
                <p className="font-medium text-green-800">Signed in as {session.user?.email}</p>
                <p className="text-sm text-green-600">Your cart and preferences are saved</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Order Summary</h3>
              {/* Your checkout form would go here */}
              <div className="p-4 border rounded-lg">
                <p className="text-muted-foreground">Checkout form components...</p>
                <p className="text-sm text-muted-foreground">
                  Cart items, shipping, payment, etc.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button size="lg" className="flex-1">
                Complete Purchase
              </Button>
              <Button variant="outline" asChild>
                <Link href="/cart">
                  Back to Cart
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
