'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function PasswordResetGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Log every render to debug
  //console.log('[PASSWORD RESET GUARD] Status:', status);
  //console.log('[PASSWORD RESET GUARD] Pathname:', pathname);
  //console.log('[PASSWORD RESET GUARD] Session:', session);
  //console.log('[PASSWORD RESET GUARD] RequirePasswordReset:', session?.user?.requirePasswordReset);

  useEffect(() => {
    //console.log('[PASSWORD RESET GUARD] useEffect triggered');
    
    // Only check if session is loaded and user is authenticated
    if (status === 'authenticated' && session?.user?.requirePasswordReset) {
      console.log('[PASSWORD RESET GUARD] ✅ Conditions met for redirect');
      
      // Don't redirect if already on reset password page
      if (pathname !== '/reset-password') {
        //console.log('[PASSWORD RESET] 🔐 User requires password reset, redirecting...');
        //console.log('[PASSWORD RESET] 📧 User email:', session.user.email);
        //console.log('[PASSWORD RESET] 🎯 Current path:', pathname);
        // Use window.location for immediate redirect
        window.location.href = '/reset-password';
      } else {
        console.log('[PASSWORD RESET GUARD] Already on reset password page');
      }
    } else {
      //console.log('[PASSWORD RESET GUARD] ❌ Conditions NOT met:');
      //console.log('  - Status:', status);
      console.log('  - RequirePasswordReset:', session?.user?.requirePasswordReset);
    }
  }, [session, status, pathname]);

  // If user needs to reset password and not on reset page, show loading
  if (status === 'authenticated' && session?.user?.requirePasswordReset && pathname !== '/reset-password') {
    //console.log('[PASSWORD RESET GUARD] 🔄 Showing redirect loading state');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Password Reset Required</p>
          <p className="text-sm text-muted-foreground mt-2">Redirecting to password reset...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
