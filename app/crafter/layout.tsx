import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import Menu from "@/components/shared/header/menu";
import CrafterNav from "./crafter-nav";
import ScLogo from "@/components/shared/sc-logo";
import { verifyCrafter } from '@/lib/actions/auth-actions';


export default async function CrafterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await verifyCrafter();
    return (
        <>
            <div className="flex flex-col ">
                <div className="border-b w-full bg-red-50">
                    <div className="container mx-auto flex items-center h-16 px-4">
                        <Link href="/" className="flex items-center gap-3">
                            <ScLogo />
                            <span className="hidden sm:inline text-lg font-bold text-primary">
                                {APP_NAME}
                            </span>
                        </Link>
                        {/* NAV for CRAFTER */}
                        <CrafterNav className="mx-1 sm:mx-6"/>
                        <div className="ml-auto items-center flex space-x-4">

                            <Menu /> 
                        </div> 
                    </div>
                </div>
                <div className="flex-1 space-y-4 p-8 pt-6 container mx-auto">
                    {children}
                </div>
            </div>
        </>
    );
}