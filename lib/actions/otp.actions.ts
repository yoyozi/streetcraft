'use server';

import { prisma } from '@/lib/prisma';
import { sendOtpSms } from '@/lib/clickatell';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const MAX_OTPS_PER_HOUR = 3;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SEND OTP to a phone number
export async function sendOtp(phone: string) {
  try {
    if (!phone || phone.length < 10) {
      return { success: false, error: 'Invalid phone number' };
    }

    // Normalize
    let normalized = phone.replace(/[\s\-()]/g, '');
    if (normalized.startsWith('+')) normalized = normalized.slice(1);
    if (normalized.startsWith('0')) normalized = '27' + normalized.slice(1);

    // Rate limit: max OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.otp.count({
      where: {
        phone: normalized,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= MAX_OTPS_PER_HOUR) {
      return { success: false, error: 'Too many OTP requests. Please try again later.' };
    }

    // Invalidate any existing unexpired OTPs for this phone
    await prisma.otp.updateMany({
      where: {
        phone: normalized,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      data: { expiresAt: new Date() },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.otp.create({
      data: {
        phone: normalized,
        code,
        expiresAt,
      },
    });

    // Send via Clickatell
    const smsResult = await sendOtpSms(normalized, code);

    if (!smsResult.success) {
      console.error('[OTP] SMS send failed:', smsResult.error);
      return { success: false, error: 'Failed to send OTP. Please try again.' };
    }

    console.log(`[OTP] Sent to ${normalized}`);
    return { success: true };
  } catch (error) {
    console.error('[OTP] Send error:', error);
    return { success: false, error: 'Failed to send OTP' };
  }
}

// VERIFY OTP
export async function verifyOtp(phone: string, code: string) {
  try {
    let normalized = phone.replace(/[\s\-()]/g, '');
    if (normalized.startsWith('+')) normalized = normalized.slice(1);
    if (normalized.startsWith('0')) normalized = '27' + normalized.slice(1);

    const otp = await prisma.otp.findFirst({
      where: {
        phone: normalized,
        code,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return { success: false, error: 'Invalid or expired code' };
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return { success: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    // Mark as verified
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    console.log(`[OTP] Verified for ${normalized}`);
    return { success: true };
  } catch (error) {
    console.error('[OTP] Verify error:', error);
    return { success: false, error: 'Verification failed' };
  }
}
