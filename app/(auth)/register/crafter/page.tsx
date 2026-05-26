import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CrafterRegisterForm from "./register-form";

export const metadata: Metadata = {
  title: 'Register as Crafter',
};

export default async function CrafterRegisterPage(props: {
  searchParams: Promise<{ code?: string }>;
}) {
  const searchParams = await props.searchParams;
  const code = searchParams?.code;

  if (!code) {
    notFound();
  }

  // Validate invite code
  const invite = await prisma.crafterInvite.findUnique({
    where: { inviteCode: code },
  });

  if (!invite) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <Link href="/" className="flex-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
                <span className="text-2xl font-bold">SC</span>
              </div>
            </Link>
            <CardTitle className="text-center">Invalid Invite</CardTitle>
            <CardDescription className="text-center">
              This invite link is invalid or has expired. Please contact the admin for a new invite.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invite.status === 'REGISTERED') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <Link href="/" className="flex-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
                <span className="text-2xl font-bold">SC</span>
              </div>
            </Link>
            <CardTitle className="text-center">Already Registered</CardTitle>
            <CardDescription className="text-center">
              This invite has already been used. You can{' '}
              <Link href="/sign-in" className="underline">sign in</Link> to your account.
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
          <CardTitle className="text-center">Register as Crafter</CardTitle>
          <CardDescription className="text-center">
            Welcome {invite.name}! Tell us about yourself and your craft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CrafterRegisterForm inviteCode={code} name={invite.name} mobile={invite.mobile} />
        </CardContent>
      </Card>
    </div>
  );
}
