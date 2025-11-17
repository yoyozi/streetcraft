import { Button } from "@/components/ui/button";
import Link from 'next/link'
import { EllipsisVertical, ShoppingCart, User, Package, Settings, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { auth } from "@/auth";
import { signOutUser } from "@/lib/actions/user.actions";
import { SignInButton } from "./sign-in-button";
import UserButton from "./user-button";



const Menu = async () => {
    const session = await auth();
    
    // Debug logging
    // if (session?.user) {
    //     console.log('[MENU] User role:', session.user.role);
    // }

    return ( <div className="flex justify-end gap-3">
        <nav className="hidden md:flex w-full max-w-xs gap-1">
                <Button asChild>
                    <Link href='/cart'>
                        <ShoppingCart />
                        Cart
                    </Link>
                </Button>
                <UserButton />
        </nav>
        <nav className="md:hidden">
            <Sheet>
                <SheetTrigger className="align-middle">
                    <EllipsisVertical />
                </SheetTrigger>
                <SheetContent className="flex flex-col items-start overflow-y-auto">
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                        Navigation menu
                    </SheetDescription>
                    <div className="flex flex-col gap-2 w-full mt-6">
                        <Button asChild variant='ghost' className="justify-start">
                            <Link href='/cart'>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Cart
                            </Link>
                        </Button>
                        
                        {!session ? (
                            <div className="border-t pt-4 w-full">
                                <SignInButton />
                            </div>
                        ) : (
                            <>
                                <div className="border-t pt-4 w-full">
                                    <div className="px-3 py-2">
                                        <div className="text-sm font-medium">{session.user?.name}</div>
                                        <div className="text-xs text-muted-foreground">{session.user?.email}</div>
                                    </div>
                                </div>
                                <Button asChild variant='ghost' className="justify-start">
                                    <Link href='/user/profile'>
                                        <User className="mr-2 h-4 w-4" />
                                        User Profile
                                    </Link>
                                </Button>
                                <Button asChild variant='ghost' className="justify-start">
                                    <Link href='/user/orders'>
                                        <Package className="mr-2 h-4 w-4" />
                                        Order History
                                    </Link>
                                </Button>
                                {session?.user?.role === 'admin' && (
                                    <Button asChild variant='ghost' className="justify-start">
                                        <Link href='/admin'>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Admin
                                        </Link>
                                    </Button>
                                )}
                                {session?.user?.role === 'craft' && (
                                    <>
                                        <Button asChild variant='ghost' className="justify-start">
                                            <Link href='/crafter'>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Crafter Dashboard
                                            </Link>
                                        </Button>
                                    </>
                                )}
                                <form action={signOutUser} className="w-full">
                                    <Button type="submit" variant='ghost' className="justify-start w-full">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </nav>
    </div> );
}


export default Menu;