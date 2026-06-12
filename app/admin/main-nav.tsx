'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import { ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type NavLink = { title: string; href: string };
type NavItem = NavLink | { title: string; children: NavLink[] };

const items: NavItem[] = [
    { title: "Overview", href: "/admin" },
    {
        title: "Products",
        children: [
            { title: "List", href: "/admin/products" },
            { title: "Approvals", href: "/admin/image-approvals" },
        ],
    },
    { title: "Categories", href: "/admin/categories" },
    {
        title: "Crafters",
        children: [
            { title: "List", href: "/admin/crafters" },
            { title: "Payments", href: "/admin/crafter-payments" },
        ],
    },
    { title: "Orders", href: "/admin/orders" },
    { title: "Users", href: "/admin/users" },
    { title: "Settings", href: "/admin/settings" },
];

const linkClasses = (active: boolean) =>
    cn(
        "text-sm font-medium transition-colors hover:text-primary",
        active ? "" : "text-muted-foreground"
    );

const MainNav = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const pathname = usePathname();

    return (
        <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
            {items.map((item) => {
                if ("children" in item) {
                    const active = item.children.some((c) => pathname?.startsWith(c.href));
                    return (
                        <DropdownMenu key={item.title}>
                            <DropdownMenuTrigger className={cn(linkClasses(!!active), "flex items-center gap-1 outline-none")}>
                                {item.title}
                                <ChevronDown className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {item.children.map((child) => (
                                    <DropdownMenuItem key={child.href} asChild>
                                        <Link href={child.href}>{child.title}</Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={linkClasses(!!pathname?.startsWith(item.href))}
                    >
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
};

export default MainNav;
