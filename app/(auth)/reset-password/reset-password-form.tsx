'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { resetPassword } from "@/lib/actions/user.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ResetPasswordForm = ({ searchParams }: { searchParams: Promise<{ token?: string }> }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    searchParams.then(params => {
      setToken(params.token || '');
    });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await resetPassword({ token, newPassword, confirmPassword });
      
      if (result.success) {
        toast.success(result.message);
        // Redirect to sign-in after successful reset
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
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
          <Input 
            id='newPassword' 
            type='password' 
            required 
            autoCapitalize="none"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor='confirmPassword'>Confirm New Password</Label>
          <Input 
            id='confirmPassword' 
            type='password' 
            required 
            autoCapitalize="none"
            placeholder="Confirm your new password"
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