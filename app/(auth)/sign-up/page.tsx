import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import SignUpForm from "./signup-form";
import ScLogo from "@/components/shared/sc-logo";
// for the redirect
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Some metaData
export const metadata: Metadata = {
    title: 'Sign Up'
};


export default async function SignUpPage(props: {
    searchParams: Promise<{ callbackUrl?: string }>
}) {
    const searchParams = await props.searchParams;
    const callbackUrl = searchParams?.callbackUrl;
    console.log("[SIGNUP/PAGE] callbackUrl ------", callbackUrl);

    const session = await auth();

    if (session) {
        return redirect(callbackUrl || '/');
    }



    return ( 
        <div className="w-full max-w-md mx-auto">
            <Card>
                <CardHeader className="space-y-4">
                    <Link href='/' className="flex-center">
                        <ScLogo size="lg" />
                    </Link>
                    <CardTitle className="text-center">Create an account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SignUpForm />
                </CardContent>
            </Card>
        </div> 
    );
};

