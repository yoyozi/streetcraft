'use client'

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/ui/password-input";
import { useState, useEffect } from "react";
import { resetPassword } from "@/lib/actions/user.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const ResetPasswordForm = ({ searchParams }: { searchParams: Promise<{ token?: string }> }) => {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    searchParams.then(params => {
      setToken(params.token ?? '');
    });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Session-based forced reset (no token in URL — already authenticated)
      if (!token && session?.user?.id) {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id, password: newPassword }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Password updated. Please sign in again.');
          setTimeout(() => signOut({ callbackUrl: '/sign-in' }), 1500);
        } else {
          toast.error(data.message || 'Failed to reset password');
        }
        return;
      }

      // Token-based reset (arrived via email link)
      const result = await resetPassword({ token: token!, newPassword, confirmPassword });
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => router.push('/sign-in'), 2000);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Still resolving searchParams or session
  if (token === null || status === 'loading') {
    return <div className="text-center text-sm text-muted-foreground">Loading...</div>;
  }

  // No token AND not authenticated — genuine invalid link
  if (!token && status !== 'authenticated') {
    return (
      <div className="text-center text-destructive">
        Invalid or missing reset token. Please request a new password reset link.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <Label htmlFor='newPassword'>New Password</Label>
          <PasswordInput 
            id='newPassword' 
            placeholder="Enter your new password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor='confirmPassword'>Confirm New Password</Label>
          <PasswordInput 
            id='confirmPassword' 
            placeholder="Confirm your new password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div>
          <Button disabled={isLoading} className='w-full' variant='default'>
            { isLoading ? 'Resetting...' : 'Reset Password' }
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ResetPasswordForm;