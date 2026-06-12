'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkAdminAuth } from './auth-actions';
import { UTApi } from 'uploadthing/server';

// CREATE CRAFTER (Admin only)
// Admin manually creates a crafter — auto-creates a linked User record
export async function createCrafter(data: {
  name: string;
  businessName?: string;
  location: string;
  mobile: string;
  category?: string;
}) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const { name, businessName, location, mobile, category } = data;

    if (!name || !location || !mobile) {
      return { success: false, error: 'Name, location and mobile are required' };
    }

    // Normalize mobile
    let normalized = mobile.replace(/[\s\-()]/g, '');
    if (normalized.startsWith('+')) normalized = normalized.slice(1);
    if (normalized.startsWith('0')) normalized = '27' + normalized.slice(1);

    // Check if mobile already exists as a crafter
    const existingCrafter = await prisma.crafter.findFirst({
      where: { mobile: normalized },
    });
    if (existingCrafter) {
      return { success: false, error: 'A crafter with this mobile number already exists' };
    }

    // Create User + Crafter in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: `${normalized}@phone.local`,
          role: 'craft',
          isActive: true,
        },
      });

      const crafter = await tx.crafter.create({
        data: {
          businessName: businessName?.trim() || name.trim(),
          location: location.trim(),
          mobile: normalized,
          userId: user.id,
          status: 'APPROVED',
          isActive: true,
          approvedAt: new Date(),
        },
      });

      // Link crafterId back to user
      await tx.user.update({
        where: { id: user.id },
        data: { crafterId: crafter.id },
      });

      return crafter;
    });

    revalidatePath('/admin/crafters');

    return { success: true, data: result };
  } catch (error) {
    console.error('Create crafter error:', error);
    return { success: false, error: `Failed to create crafter: ${error}` };
  }
}

// UPDATE CRAFTER (Admin only)
export async function updateCrafter(
  id: string,
  data: {
    name?: string;
    businessName?: string;
    location?: string;
    mobile?: string;
    category?: string;
    description?: string;
  }
) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const updateData: Record<string, unknown> = {};

    if (data.businessName !== undefined) updateData.businessName = data.businessName.trim();
    if (data.name && !data.businessName) updateData.businessName = data.name.trim();
    if (data.location) updateData.location = data.location.trim();
    if (data.mobile) {
      let normalized = data.mobile.replace(/[\s\-()]/g, '');
      if (normalized.startsWith('+')) normalized = normalized.slice(1);
      if (normalized.startsWith('0')) normalized = '27' + normalized.slice(1);
      updateData.mobile = normalized;
    }
    if (data.category !== undefined) {
      if (data.category && data.category.trim() !== '') {
        // Find the category by name and connect it
        const categoryRecord = await prisma.category.findFirst({
          where: { name: data.category },
        });
        if (categoryRecord) {
          updateData.category = { connect: { id: categoryRecord.id } };
        }
      } else {
        // Disconnect the category if empty
        updateData.category = { disconnect: true };
      }
    }
    if (data.description !== undefined) updateData.description = data.description.trim();

    const crafter = await prisma.crafter.update({
      where: { id },
      data: updateData,
    });

    // Products are categorised indirectly via their crafter's category. Keep the
    // denormalised Product.category in sync so storefront filters stay correct.
    if (data.category !== undefined) {
      const newCategory = data.category && data.category.trim() !== '' ? data.category.trim() : 'Uncategorized';
      await prisma.product.updateMany({
        where: { crafterId: id },
        data: { category: newCategory },
      });
      revalidatePath('/');
      revalidatePath('/search');
    }

    // Also update the linked User record
    const userUpdate: Record<string, unknown> = {};
    if (data.name) userUpdate.name = data.name.trim();
    if (updateData.mobile) {
      userUpdate.email = `${updateData.mobile}@phone.local`;
    }
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: crafter.userId },
        data: userUpdate,
      });
    }

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

    // Validate required fields before activating
    if (isActive) {
      const crafter = await prisma.crafter.findUnique({ where: { id } });
      if (!crafter) return { success: false, error: 'Crafter not found' };

      // Must be approved if created via registration link
      if (crafter.status === 'PENDING') {
        return { success: false, error: 'Cannot activate: registration must be approved first' };
      }

      const missing: string[] = [];
      if (!crafter.category) missing.push('Category');
      if (!crafter.location) missing.push('Location');
      if (!crafter.mobile) missing.push('Mobile');
      if (missing.length > 0) {
        return { success: false, error: `Cannot activate: fill in ${missing.join(', ')} first` };
      }
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
        category: { select: { id: true, name: true } },
      },
      orderBy: { businessName: 'asc' },
    });

    const craftersWithDetails = crafters.map((crafter) => ({
      _id: crafter.id,
      id: crafter.id,
      name: crafter.businessName || crafter.user?.name || 'No name',
      businessName: crafter.businessName || '',
      location: crafter.location,
      mobile: crafter.mobile,
      category: crafter.category?.name || null,
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
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        category: { select: { name: true } },
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
        personalName: crafter.user?.name || 'No name',
        name: crafter.businessName, // Map businessName to name for compatibility
        businessName: crafter.businessName,
        // Return the category NAME so the edit form pre-selects it (not "none")
        category: crafter.category?.name || '',
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
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: crafters };
  } catch {
    return { success: false, error: 'Failed to fetch pending crafters', data: [] };
  }
}

// APPROVE CRAFTER (Admin only)
export async function approveCrafter(id: string, categoryId?: string) {
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
        categoryId: categoryId, // Set the crafter's category
      },
    });

    // Generate password setup token
    const { randomBytes } = await import('crypto');
    const token = randomBytes(16).toString('hex');

    // Update user role to 'craft' and set password setup token
    await prisma.user.update({
      where: { id: crafter.userId },
      data: { role: 'craft', passwordSetupToken: token },
    });

    // Send approval SMS with password setup link
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const setupUrl = `${baseUrl}/set-password?token=${token}`;
    const { sendSms } = await import('@/lib/clickatell');
    await sendSms(
      crafter.mobile,
      `Great news ${crafter.businessName}! Your StreetCraft application has been approved. Set your password to login: ${setupUrl}`
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

    const crafter = await prisma.crafter.findUnique({
      where: { id },
    });

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    // Delete work sample images from UploadThing
    if (crafter.workSamples && crafter.workSamples.length > 0) {
      const utapi = new UTApi();
      try {
        await utapi.deleteFiles(crafter.workSamples);
      } catch (error) {
        console.error('Failed to delete work sample images from UploadThing:', error);
        // Continue with rejection even if image deletion fails
      }
    }

    // Update crafter status
    await prisma.crafter.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
        workSamples: [], // Clear work samples array
      },
    });

    // Send rejection SMS
    const { sendSms } = await import('@/lib/clickatell');
    await sendSms(
      crafter.mobile,
      `Hi ${crafter.businessName}, unfortunately we already have these products registered on StreetCraft. Thank you for your interest.`
    );

    revalidatePath('/admin/crafters');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to reject crafter' };
  }
}

// GET PRODUCT COUNTS FOR WORK SAMPLE IMAGES (Admin only)
export async function getProductCountsByImages(imageUrls: string[]) {
  try {
    const counts: Record<string, number> = {};
    for (const url of imageUrls) {
      const count = await prisma.product.count({
        where: { images: { has: url } },
      });
      counts[url] = count;
    }
    return { success: true, data: counts };
  } catch {
    return { success: false, data: {} };
  }
}

// CREATE DRAFT PRODUCT FROM WORK SAMPLE (Admin only)
export async function createProductFromSample(crafterId: string, imageUrl: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const crafter = await prisma.crafter.findUnique({
      where: { id: crafterId },
    });

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    if (crafter.status === 'PENDING') {
      return { success: false, error: 'Crafter registration must be approved before creating products' };
    }

    if (!crafter.isActive) {
      return { success: false, error: 'Crafter must be active before creating products' };
    }

    const slug = `draft-${crafterId.slice(-6)}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name: `Draft - ${crafter.businessName}`,
        slug,
        category: crafter.category || 'Uncategorized',
        images: [imageUrl],
        description: '',
        price: 0,
        isActive: false,
        crafterId,
      },
    });

    revalidatePath('/admin/crafters');
    revalidatePath('/admin/products');
    return { success: true, productId: product.id };
  } catch {
    return { success: false, error: 'Failed to create product from sample' };
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
