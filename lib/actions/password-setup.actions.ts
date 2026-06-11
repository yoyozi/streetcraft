'use server';

import { prisma } from '@/lib/prisma';
import { hashSync } from 'bcrypt-ts-edge';
import { sendOtp, verifyOtp } from './otp.actions';

// Validate password setup token and return user info
export async function validateSetupToken(token: string) {
  try {
    if (!token) {
      return { success: false, error: 'Invalid token' };
    }

    const user = await prisma.user.findUnique({
      where: { passwordSetupToken: token },
      select: { id: true, name: true, crafterProfile: { select: { mobile: true } } },
    });

    if (!user) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const mobile = user.crafterProfile?.mobile;
    if (!mobile) {
      return { success: false, error: 'No mobile number linked to this account' };
    }

    return {
      success: true,
      data: {
        name: user.name,
        phone: mobile,
      },
    };
  } catch {
    return { success: false, error: 'Failed to validate token' };
  }
}

// Send OTP for password setup verification
export async function sendPasswordSetupOtp(token: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { passwordSetupToken: token },
      select: { crafterProfile: { select: { mobile: true } } },
    });

    const mobile = user?.crafterProfile?.mobile;
    if (!mobile) {
      return { success: false, error: 'Invalid token' };
    }

    return await sendOtp(mobile);
  } catch {
    return { success: false, error: 'Failed to send verification code' };
  }
}

// Verify OTP and set password
export async function completePasswordSetup(data: {
  token: string;
  otp: string;
  password: string;
}) {
  try {
    const { token, otp, password } = data;

    if (!token || !otp || !password) {
      return { success: false, error: 'All fields are required' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const user = await prisma.user.findUnique({
      where: { passwordSetupToken: token },
      select: { id: true, crafterProfile: { select: { mobile: true } } },
    });

    const mobile = user?.crafterProfile?.mobile;
    if (!user || !mobile) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Verify OTP
    const otpResult = await verifyOtp(mobile, otp);
    if (!otpResult.success) {
      return { success: false, error: otpResult.error || 'Invalid verification code' };
    }

    // Set password and clear token
    const hashedPassword = hashSync(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordSetupToken: null,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to set password' };
  }
}
