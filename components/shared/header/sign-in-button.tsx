// components/shared/header/sign-in-button.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const SignInButton = () => {
    const pathname = usePathname();
    const getHref = `/sign-in?callbackUrl=${encodeURIComponent(pathname)}`
    //console.log(pathname);



    return (
        
            <Button asChild>
                <Link href={getHref}>
                    <User className="h-4 w-4" />
                    Sign In
                </Link>
            </Button>
       
    );
};