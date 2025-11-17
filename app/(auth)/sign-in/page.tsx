import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import CredentialsSignInForm from "./credentials-signin-form";
import { GoogleSignInButton } from "./google-signin-button";
import { GitHubSignInButton } from "./github-signin-button";
import { CheckoutSignInPrompt } from "./checkout-signin-prompt";
// for the redirect
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Some metaData
export const metadata: Metadata = {
};

export default async function SignInPage(props: {
    searchParams: Promise<{ callbackUrl?: string }>
}) {
    const searchParams = await props.searchParams
    const callbackUrl = searchParams?.callbackUrl || '/';
    console.log("[SIGNIN/PAGE] callbackUrl ------", callbackUrl);

    const session = await auth();

    if (session) {
        return redirect(callbackUrl || '/');
    }

 
    return ( 
        <div className="w-full max-w-md mx-auto">
            <Card>
                <CardHeader className="space-y-4">
                    <Link href='/' className="flex-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
                            <span className="text-2xl font-bold">SC</span>
                        </div>
                    </Link>
                    <CardTitle className="text-center">Sign In</CardTitle>
                    <CardDescription className="text-center">
                        Sing in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CheckoutSignInPrompt callbackUrl={callbackUrl} />
                    
                    <GoogleSignInButton callbackUrl={callbackUrl} />
                    <GitHubSignInButton callbackUrl={callbackUrl} />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    <CredentialsSignInForm callbackUrl={callbackUrl}/>
                </CardContent>
            </Card>
        </div> 
    );
};



