'use client'

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Wallet } from "lucide-react";

const CrafterNav = () => {
    return (
        <div className="border-b">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/crafter">
                        <Button variant="ghost">
                            <LayoutDashboard className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/crafter/payments">
                        <Button variant="ghost">
                            <Wallet className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CrafterNav;