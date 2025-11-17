'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

import Link from 'next/link';

export default function ResetPasswordPage() {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if not authenticated or doesn't need password reset
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('[RESET PASSWORD] No session, redirecting to sign-in');
      window.location.href = '/sign-in';
    } else if (status === 'authenticated' && !session?.user?.requirePasswordReset) {
      console.log('[RESET PASSWORD] No password reset required, redirecting to home');
      // Redirect based on role
      if (session?.user?.role === 'craft') {
        window.location.href = '/crafter';
      } else {
        window.location.href = '/';
      }
    }
  }, [status, session]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (status === 'unauthenticated' || !session?.user?.requirePasswordReset) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to reset password');  // Shows error toast
        setIsSubmitting(false);  // Re-enables the submit button
        return;  // Exits the handleSubmit function
      }

      toast.success('Password reset');
      
      // Sign out to clear the old session with requirePasswordReset flag
      // Then redirect to sign-in, which will create a fresh session
      setTimeout(async () => {
        await signOut({ redirect: false });
        window.location.href = '/sign-in';
      }, 1000);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('An error occurred while resetting password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <Link href='/' className="flex-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground transition-all hover:scale-105">
              <span className="text-2xl font-bold">SC</span>
            </div>
          </Link>
          <CardTitle className="text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            You are required to change your password before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
