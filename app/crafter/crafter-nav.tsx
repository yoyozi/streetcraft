'use client'

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CrafterNav = () => {
    return (
        <div className="border-b">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/crafter">
                        <Button variant="ghost">Dashboard</Button>
                    </Link>
                    <Link href="/crafter/payments">
                        <Button variant="ghost">Payments</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CrafterNav;