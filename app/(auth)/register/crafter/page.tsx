import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ScLogo from "@/components/shared/sc-logo";
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
              <ScLogo size="lg" />
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
              <ScLogo size="lg" />
            </Link>
            <CardTitle className="text-center">Application Submitted</CardTitle>
            <CardDescription className="text-center">
              Your application has been received. We&apos;ll review your work and contact you via SMS.
              If you&apos;re already registered, you can{' '}
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
            <ScLogo size="lg" />
          </Link>
          <CardTitle className="text-center">Register as Crafter</CardTitle>
        </CardHeader>
        <CardContent>
          <CrafterRegisterForm inviteCode={code} name={invite.name} mobile={invite.mobile} />
        </CardContent>
      </Card>
    </div>
  );
}
