import Link from 'next/link';
import Menu from './menu';
import { APP_NAME } from '@/lib/constants';
import Search from './search';
import ThemeToggle from '@/components/theme-toggle';

const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                {/* Left side - Logo */}
                <div className="flex items-center gap-3 flex-1">
                    <Link href='/' className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
                            <span className="text-sm font-bold">SC</span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                            {APP_NAME} users
                        </span>
                    </Link>
                </div>

                {/* Center - Search (hidden on mobile) */}
                <div className="hidden md:flex flex-1 max-w-md mx-4">
                    <Search />
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2">
                    {/* Theme toggle */}
                    <ThemeToggle />
                    
                    {/* Menu */}
                    <Menu />
                </div>
            </div>
            
            {/* Mobile search */}
            <div className="md:hidden border-t bg-background/95 px-4 py-4">
                <Search />
            </div>
        </header>
    );
};

export default Header;