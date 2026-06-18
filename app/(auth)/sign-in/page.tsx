import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import CredentialsSignInForm from "./credentials-signin-form";
import ScLogo from "@/components/shared/sc-logo";
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
        const role = session.user?.role;
        if (role === 'craft' && !callbackUrl.startsWith('/crafter')) {
            return redirect('/crafter');
        }
        if (role === 'admin' && !callbackUrl.startsWith('/admin')) {
            return redirect('/admin');
        }
        return redirect(callbackUrl || '/');
    }

 
    return ( 
        <div className="w-full max-w-md mx-auto">
            <Card>
                <CardHeader className="space-y-4">
                    <Link href='/' className="flex-center">
                        <ScLogo size="lg" />
                    </Link>
                    <CardTitle className="text-center">Sign in to your account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CheckoutSignInPrompt callbackUrl={callbackUrl} />
                    
                    <div className="grid grid-cols-2 gap-2">
                        <GoogleSignInButton callbackUrl={callbackUrl} />
                        <GitHubSignInButton callbackUrl={callbackUrl} />
                    </div>
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



