import Link from 'next/link';
import Menu from './menu';
import { APP_NAME } from '@/lib/constants';
import Search from './search';
import ThemeToggle from '@/components/theme-toggle';
import ScLogo from '@/components/shared/sc-logo';

const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] h-16 items-center gap-2 px-4 md:px-8">
                {/* Left — Logo, pinned left */}
                <Link href='/' className="flex items-center gap-2 justify-self-start">
                    <ScLogo />
                    <span className="hidden sm:block text-lg font-bold text-primary whitespace-nowrap">
                        {APP_NAME}
                    </span>
                </Link>

                {/* Centre — Search, desktop only */}
                <div className="hidden md:flex justify-center">
                    <div className="w-full max-w-lg">
                        <Search />
                    </div>
                </div>

                {/* Right — Actions, pinned right */}
                <div className="flex items-center gap-2 justify-self-end">
                    <ThemeToggle />
                    <Menu />
                </div>
            </div>

            {/* Mobile search row — full width, below the logo/actions bar */}
            <div className="md:hidden border-t px-4 py-2 bg-background/95">
                <Search />
            </div>
        </header>
    );
};

export default Header;