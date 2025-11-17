import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import Menu from "@/components/shared/header/menu";
import CrafterNav from "./crafter-nav";
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
                <div className="border-b container mx-auto bg-red-50">
                    <div className="flex items-center h-16 px-4">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
                                <span className="text-sm font-bold">SC</span>
                            </div>
                            <span className="text-lg font-bold text-primary">
                                {APP_NAME} crafters
                            </span>
                        </Link>
                        {/* NAV for CRAFTER */}
                        <CrafterNav className="mx-6"/>
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