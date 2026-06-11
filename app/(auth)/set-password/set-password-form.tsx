'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendPasswordSetupOtp, completePasswordSetup } from '@/lib/actions/password-setup.actions';
import Link from 'next/link';

interface SetPasswordFormProps {
  token: string;
  phone: string;
}

export default function SetPasswordForm({ token, phone }: SetPasswordFormProps) {
  const [step, setStep] = useState<'password' | 'otp' | 'done'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Mask phone for display: 27821234567 → 27***4567
  const maskedPhone = phone.length > 4
    ? phone.slice(0, 2) + '***' + phone.slice(-4)
    : phone;

  const handlePasswordSubmit = () => {
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    startTransition(async () => {
      const result = await sendPasswordSetupOtp(token);
      if (result.success) {
        setStep('otp');
        toast.success('Verification code sent to your phone');
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    });
  };

  const handleOtpSubmit = () => {
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    startTransition(async () => {
      const result = await completePasswordSetup({ token, otp, password });
      if (result.success) {
        setStep('done');
      } else {
        setError(result.error || 'Verification failed');
      }
    });
  };

  if (step === 'done') {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-4xl">✓</div>
        <p className="text-lg font-medium">Password Set!</p>
        <p className="text-sm text-muted-foreground">
          You can now login to your crafter dashboard.
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/sign-in">Login to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="space-y-5">
        <p className="text-center text-sm text-muted-foreground">
          We sent a verification code to {maskedPhone}
        </p>

        <div>
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit code"
            className="text-center text-lg tracking-widest"
          />
        </div>

        <Button onClick={handleOtpSubmit} disabled={isPending} className="w-full" size="lg">
          {isPending ? 'Verifying...' : 'Confirm & Set Password'}
        </Button>

        {error && <p className="text-center text-destructive text-sm">{error}</p>}

        <p className="text-center text-xs text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            className="underline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await sendPasswordSetupOtp(token);
                if (result.success) {
                  toast.success('New code sent');
                } else {
                  toast.error(result.error || 'Failed to resend');
                }
              });
            }}
          >
            Resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
        />
      </div>

      <Button onClick={handlePasswordSubmit} disabled={isPending} className="w-full" size="lg">
        {isPending ? 'Sending verification...' : 'Continue'}
      </Button>

      {error && <p className="text-center text-destructive text-sm">{error}</p>}
    </div>
  );
}
