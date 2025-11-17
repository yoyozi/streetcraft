import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/assets/styles/globals.css';
import { APP_NAME, APP_DESCRIPTION, SERVER_URL } from '@/lib/constants';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import PasswordResetGuard from '@/components/shared/password-reset-guard';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* SVG favicon with automatic light/dark mode support */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Fallback ICO for older browsers */}
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className}`}>
          <Providers>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange>
              <PasswordResetGuard>
                <main className="min-h-screen">
                  {children}
                </main>
              </PasswordResetGuard>
              <Toaster />
            </ThemeProvider>
          </Providers>
      </body>
    </html>
  );
}