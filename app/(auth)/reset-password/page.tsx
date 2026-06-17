import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";
import ScLogo from "@/components/shared/sc-logo";

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set your new password',
};

export default function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <Link href='/' className="flex-center">
            <ScLogo size="lg" />
          </Link>
          <CardTitle className="text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm searchParams={props.searchParams} />
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