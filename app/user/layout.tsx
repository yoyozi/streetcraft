import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import Menu from "@/components/shared/header/menu";
import MainNav from "./main-nav";
import ScLogo from "@/components/shared/sc-logo";

export default function UserLayout({
    children,
    }: Readonly<{
        children: React.ReactNode;
    }>) {
    return (
        <>
            <div className="flex flex-col">
                <div className="border-b container mx-auto">
                    <div className="flex items-center h-16 px-4">
                        <Link href="/" className="flex items-center gap-3">
                            <ScLogo />
                            <span className="text-lg font-bold text-primary">
                                {APP_NAME}
                            </span>
                        </Link>
                        {/* MAIN NAV profile and orders of a user */}
                        <MainNav className="mx-6"/>
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