import Link from "next/link";
import { auth } from "@/auth";
import { signOutUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger  } from "@/components/ui/dropdown-menu";
import { SignInButton } from "./sign-in-button";


// We need to get the session to be able to swap the buttons, hence we need async

const UserButton = async () => {

    const session = await auth();

    if (!session) { 
        return <SignInButton />;
    }

    // we use the ? so it doesnt throw error if session.user is not 
    // present, ?? if null set to empty string
    const firstInitial = session.user?.name?.charAt(0).toUpperCase() ?? 'U';


    return <div className="flex gap-2 items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center">
                            <Button variant='ghost' className='relative w-8 h-8 
                            rounded-full ml-2 flex items-center justify-center bg-gray-200'>
                                {firstInitial}
                            </Button>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align='end' forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium leading-none">
                                    {session.user?.name}
                                </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <div className="text-sm text-muted-foreground leading-none">
                                    {session.user?.email}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuItem>
                            <Link href='/user/profile' className="w-full">
                                User profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href='/user/orders' className="w-full">
                                    Order history
                            </Link>
                        </DropdownMenuItem>

                        { session?.user?.role === 'admin' && (
                             <DropdownMenuItem>
                                 <Link href='/admin' className="w-full">
                                     Admin
                                 </Link>
                             </DropdownMenuItem>
                        )}

                        { session?.user?.role === 'craft' && (
                             <DropdownMenuItem>
                                 <Link href='/crafter' className="w-full">
                                     Crafter Dashboard
                                 </Link>
                             </DropdownMenuItem>
                        )}

                        <DropdownMenuItem className='p-0 mb-1'>
                            <form action={ signOutUser } className="w-full">
                                <Button className="w-full py-4 px-2 h4 justify-start" variant='ghost'>
                                    Sign Out
                                </Button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
}

export default UserButton;