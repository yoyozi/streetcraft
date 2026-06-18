'use client'

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Wallet, Settings } from "lucide-react";

const CrafterNav = ({ className }: { className?: string }) => {
    return (
        <div className={`flex items-center gap-0 ${className ?? ''}`}>
            <Link href="/crafter">
                <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-1 px-2 sm:py-2 sm:px-3">
                    <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[10px] sm:text-xs">Dashboard</span>
                </Button>
            </Link>
            <Link href="/crafter/payments">
                <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-1 px-2 sm:py-2 sm:px-3">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[10px] sm:text-xs">Payments</span>
                </Button>
            </Link>
            <Link href="/crafter/settings">
                <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-1 px-2 sm:py-2 sm:px-3">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[10px] sm:text-xs">Banking</span>
                </Button>
            </Link>
        </div>
    );
};

export default CrafterNav;