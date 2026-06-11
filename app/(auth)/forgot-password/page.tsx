import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <Link href='/' className="flex-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
              <span className="text-2xl font-bold">SC</span>
            </div>
          </Link>
          <CardTitle className="text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email or mobile number to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <div className="mt-4 text-center">
            <Link href="/sign-in" className='link text-sm'>
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}