'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkAdminAuth } from './auth-actions';
import { sendCrafterInviteSms } from '@/lib/clickatell';
import { randomBytes } from 'crypto';

// Generate a short invite code (8 chars, URL-safe)
function generateInviteCode(): string {
  return randomBytes(4).toString('hex'); // e.g. "a3f9b2c1"
}

// Normalize SA mobile: accepts "082...", "+2782...", "2782..." → "2782..."
function normalizeMobile(input: string): string {
  let mobile = input.replace(/[\s\-()]/g, '');
  if (mobile.startsWith('+')) mobile = mobile.slice(1);
  if (mobile.startsWith('0')) mobile = '27' + mobile.slice(1);
  return mobile;
}

// CREATE INVITE & SEND SMS (Admin only)
export async function createCrafterInvite(data: { name: string; mobile: string }) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: 'Name is required (min 2 characters)' };
    }

    const mobile = normalizeMobile(data.mobile);
    if (mobile.length < 11 || !mobile.startsWith('27')) {
      return { success: false, error: 'Invalid SA mobile number. Use format: 0821234567 or +27821234567' };
    }

    // Check if invite already exists for this number
    const existing = await prisma.crafterInvite.findUnique({
      where: { mobile },
    });

    if (existing) {
      return { success: false, error: `An invite already exists for ${mobile} (status: ${existing.status})` };
    }

    // Get admin user id from session
    const { auth } = await import('@/auth');
    const session = await auth();
    const adminId = session?.user?.id || 'unknown';

    const inviteCode = generateInviteCode();

    const invite = await prisma.crafterInvite.create({
      data: {
        mobile,
        name: data.name.trim(),
        inviteCode,
        status: 'PENDING',
        createdBy: adminId,
      },
    });

    // Send SMS
    const smsResult = await sendCrafterInviteSms(mobile, data.name.trim(), inviteCode);

    if (smsResult.success) {
      await prisma.crafterInvite.update({
        where: { id: invite.id },
        data: { smsSentAt: new Date() },
      });
    }

    revalidatePath('/admin/crafters/invite');

    return {
      success: true,
      data: {
        id: invite.id,
        mobile: invite.mobile,
        name: invite.name,
        inviteCode: invite.inviteCode,
        smsSent: smsResult.success,
        smsError: smsResult.error,
      },
    };
  } catch (error) {
    console.error('Create invite error:', error);
    return { success: false, error: `Failed to create invite: ${error}` };
  }
}

// RESEND INVITE SMS (Admin only)
export async function resendInviteSms(inviteId: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const invite = await prisma.crafterInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return { success: false, error: 'Invite not found' };
    }

    if (invite.status === 'REGISTERED') {
      return { success: false, error: 'Crafter has already registered' };
    }

    const smsResult = await sendCrafterInviteSms(invite.mobile, invite.name, invite.inviteCode);

    if (smsResult.success) {
      await prisma.crafterInvite.update({
        where: { id: inviteId },
        data: { smsSentAt: new Date() },
      });
    }

    revalidatePath('/admin/crafters/invite');

    return {
      success: true,
      smsSent: smsResult.success,
      smsError: smsResult.error,
    };
  } catch (error) {
    console.error('Resend invite error:', error);
    return { success: false, error: 'Failed to resend invite' };
  }
}

// GET ALL INVITES (Admin only)
export async function getAllInvites() {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error, data: [] };
    }

    const invites = await prisma.crafterInvite.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: invites };
  } catch {
    return { success: false, error: 'Failed to fetch invites', data: [] };
  }
}

// DELETE INVITE (Admin only)
export async function deleteInvite(id: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await prisma.crafterInvite.delete({ where: { id } });

    revalidatePath('/admin/crafters/invite');

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete invite' };
  }
}

// REGISTER CRAFTER BY PHONE (public, requires valid invite code)
export async function registerCrafterByPhone(data: {
  inviteCode: string;
  name: string;
  mobile: string;
  location: string;
  description: string;
  workSamples: string[];
}) {
  try {
    const { inviteCode, name, mobile, location, description, workSamples } = data;

    if (!inviteCode || !name || name.trim().length < 2) {
      return { success: false, error: 'Name is required' };
    }
    if (!location.trim()) {
      return { success: false, error: 'Location is required' };
    }
    if (!description.trim()) {
      return { success: false, error: 'Please describe your craft' };
    }
    if (!workSamples || workSamples.length === 0) {
      return { success: false, error: 'Please upload at least one work photo' };
    }

    // Validate invite
    const invite = await prisma.crafterInvite.findUnique({
      where: { inviteCode },
    });

    if (!invite) {
      return { success: false, error: 'Invalid invite code' };
    }

    if (invite.status === 'REGISTERED') {
      return { success: false, error: 'This invite has already been used' };
    }

    // Check if phone already registered
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber: mobile },
    });

    if (existingUser) {
      return { success: false, error: 'This phone number is already registered' };
    }

    // Create user + crafter in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: `${mobile}@phone.local`,
          role: 'user',
          phoneNumber: mobile,
          phoneVerified: true,
        },
      });

      await tx.crafter.create({
        data: {
          businessName: name.trim(),
          description: description.trim(),
          location: location.trim(),
          mobile,
          workSamples,
          userId: user.id,
          isActive: false,
          status: 'PENDING',
        },
      });

      await tx.crafterInvite.update({
        where: { id: invite.id },
        data: {
          status: 'REGISTERED',
          registeredAt: new Date(),
        },
      });
    });

    revalidatePath('/admin/crafters');
    revalidatePath('/admin/crafters/invite');

    return { success: true };
  } catch (error) {
    console.error('Register crafter error:', error);
    return { success: false, error: 'Registration failed. Please try again.' };
  }
}
