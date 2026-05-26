'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createCrafterSchema, updateCrafterSchema } from '@/lib/validations/crafter';
import { checkAdminAuth } from './auth-actions';
import { z } from 'zod';

// CREATE CRAFTER (Admin only)
export async function createCrafter(data: z.infer<typeof createCrafterSchema> & { userId: string }) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = createCrafterSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || 'Validation failed' 
      };
    }

    const crafter = await prisma.crafter.create({
      data: {
        ...validation.data,
        userId: data.userId,
        isActive: true,
      },
    });

    revalidatePath('/admin/crafters');

    return { success: true, data: crafter };
  } catch (error) {
    console.error('Create crafter error:', error);
    return { success: false, error: `Failed to create crafter: ${error}` };
  }
}

// UPDATE CRAFTER (Admin only)
export async function updateCrafter(
  id: string,
  data: z.infer<typeof updateCrafterSchema>
) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = updateCrafterSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || 'Validation failed' };
    }

    const crafter = await prisma.crafter.update({
      where: { id },
      data: validation.data,
    });

    revalidatePath('/admin/crafters');

    return { success: true, data: crafter };
  } catch (error) {
    console.error('Update crafter error:', error);
    return { success: false, error: `Failed to update crafter: ${error}` };
  }
}

// TOGGLE CRAFTER STATUS (Admin only)
export async function toggleCrafterStatus(id: string, isActive: boolean) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const crafter = await prisma.crafter.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath('/admin/crafters');

    return { success: true, data: crafter };
  } catch {
    return { success: false, error: 'Failed to update crafter status' };
  }
}

// GET ALL CRAFTERS
export async function getAllCrafters(filter?: { isActive?: boolean }) {
  try {
    const where = filter?.isActive !== undefined ? { isActive: filter.isActive } : {};

    const crafters = await prisma.crafter.findMany({
      where,
      include: {
        _count: { select: { products: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { businessName: 'asc' },
    });

    const craftersWithDetails = crafters.map((crafter) => ({
      _id: crafter.id,
      id: crafter.id,
      name: crafter.businessName,
      location: crafter.location,
      mobile: crafter.mobile,
      profileImage: crafter.profileImage,
      isActive: crafter.isActive,
      status: crafter.status,
      productCount: crafter._count.products,
      linkedUser: crafter.user ? {
        id: crafter.user.id,
        name: crafter.user.name,
        email: crafter.user.email,
      } : null,
      createdAt: crafter.createdAt.toISOString(),
      updatedAt: crafter.updatedAt.toISOString(),
    }));

    return { success: true, data: craftersWithDetails };
  } catch {
    return { success: false, error: 'Failed to fetch crafters', data: [] };
  }
}

// GET CRAFTER BY ID
export async function getCrafterById(id: string) {
  try {
    const crafter = await prisma.crafter.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    return {
      success: true,
      data: {
        ...crafter,
        _id: crafter.id,
        name: crafter.businessName,
        productCount: crafter._count.products,
        createdAt: crafter.createdAt.toISOString(),
        updatedAt: crafter.updatedAt.toISOString(),
      },
    };
  } catch {
    return { success: false, error: 'Crafter not found' };
  }
}

// GET PENDING CRAFTERS FOR REVIEW (Admin only)
export async function getPendingCrafters() {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error, data: [] };
    }

    const crafters = await prisma.crafter.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, phoneNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: crafters };
  } catch {
    return { success: false, error: 'Failed to fetch pending crafters', data: [] };
  }
}

// APPROVE CRAFTER (Admin only)
export async function approveCrafter(id: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const crafter = await prisma.crafter.update({
      where: { id },
      data: {
        status: 'APPROVED',
        isActive: true,
        approvedAt: new Date(),
      },
    });

    // Update user role to 'craft'
    await prisma.user.update({
      where: { id: crafter.userId },
      data: { role: 'craft' },
    });

    // Send approval SMS
    const { sendSms } = await import('@/lib/clickatell');
    await sendSms(
      crafter.mobile,
      `Great news! Your StreetCraft application has been approved. We'll be in touch to arrange a meetup. Welcome aboard!`
    );

    revalidatePath('/admin/crafters');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to approve crafter' };
  }
}

// REJECT CRAFTER (Admin only)
export async function rejectCrafter(id: string, reason: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const crafter = await prisma.crafter.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
      },
    });

    // Send rejection SMS
    const { sendSms } = await import('@/lib/clickatell');
    await sendSms(
      crafter.mobile,
      `Hi, unfortunately your StreetCraft application was not successful at this time. Thank you for your interest.`
    );

    revalidatePath('/admin/crafters');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to reject crafter' };
  }
}

// DELETE CRAFTER (Admin only)
export async function deleteCrafter(id: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await prisma.crafter.delete({ where: { id } });

    revalidatePath('/admin/crafters');

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete crafter' };
  }
}
