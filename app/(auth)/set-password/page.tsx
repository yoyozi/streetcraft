import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { validateSetupToken } from "@/lib/actions/password-setup.actions";
import SetPasswordForm from "./set-password-form";

export const metadata: Metadata = {
  title: 'Set Your Password',
};

export default async function SetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <Link href="/" className="flex-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
                <span className="text-2xl font-bold">SC</span>
              </div>
            </Link>
            <CardTitle className="text-center">Invalid Link</CardTitle>
            <CardDescription className="text-center">
              This password setup link is invalid. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const result = await validateSetupToken(token);

  if (!result.success || !result.data) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <Link href="/" className="flex-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
                <span className="text-2xl font-bold">SC</span>
              </div>
            </Link>
            <CardTitle className="text-center">Link Expired</CardTitle>
            <CardDescription className="text-center">
              This password setup link has already been used or has expired. 
              If you already set your password, you can{' '}
              <Link href="/sign-in" className="underline">sign in</Link>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
              <span className="text-2xl font-bold">SC</span>
            </div>
          </Link>
          <CardTitle className="text-center">Set Your Password</CardTitle>
          <CardDescription className="text-center">
            Welcome {result.data.name}! Set a password to access your crafter dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm token={token} phone={result.data.phone} />
        </CardContent>
      </Card>
    </div>
  );
}
