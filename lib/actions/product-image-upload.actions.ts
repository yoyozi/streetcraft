'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getUploaderSettings } from './settings.actions';
import { revalidatePath } from 'next/cache';
import { UTApi } from 'uploadthing/server';

export interface ProductImageUploadInput {
  imageUrl: string;
}

export interface ProductImageUploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// Get today's upload count for a crafter
async function getTodayUploadCount(crafterId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.productImageUpload.count({
    where: {
      crafterId,
      createdAt: {
        gte: today,
      },
      status: {
        in: ['PENDING', 'APPROVED', 'REJECTED'],
      },
    },
  });

  return count;
}

// Check if crafter can upload more images
async function canUploadMore(crafterId: string): Promise<{ canUpload: boolean; remaining: number; limit: number }> {
  const settings = await getUploaderSettings();
  const todayCount = await getTodayUploadCount(crafterId);
  const remaining = Math.max(0, settings.dailyUploadLimit - todayCount);

  return {
    canUpload: remaining > 0,
    remaining,
    limit: settings.dailyUploadLimit,
  };
}

// Submit a product image upload for approval (crafter only)
export async function submitProductImageUpload(
  input: ProductImageUploadInput
): Promise<ProductImageUploadResponse> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'craft') {
      return { success: false, error: 'Unauthorized. Only crafters can submit uploads.' };
    }

    // Get crafter profile
    const crafter = await prisma.crafter.findUnique({
      where: { userId: session.user.id },
    });

    if (!crafter) {
      return { success: false, error: 'Crafter profile not found.' };
    }

    if (crafter.status !== 'APPROVED') {
      return { success: false, error: 'Only approved crafters can submit uploads.' };
    }

    // Check upload limits
    const uploadCheck = await canUploadMore(crafter.id);
    if (!uploadCheck.canUpload) {
      return {
        success: false,
        error: `Daily upload limit reached. You can submit more uploads tomorrow.`,
      };
    }

    // Create the upload record
    const upload = await prisma.productImageUpload.create({
      data: {
        crafterId: crafter.id,
        imageUrl: input.imageUrl,
        status: 'PENDING',
      },
    });

    revalidatePath('/crafter');
    revalidatePath('/admin/image-approvals');

    return {
      success: true,
      message: `Image submitted for approval. ${uploadCheck.remaining - 1} uploads remaining today.`,
      data: upload,
    };
  } catch (error) {
    console.error('Error submitting product image upload:', error);
    return { success: false, error: 'Failed to submit upload' };
  }
}

// Get upload status for a crafter
export async function getCrafterUploadStatus(): Promise<{
  success: boolean;
  canUpload: boolean;
  remaining: number;
  limit: number;
  pendingCount: number;
  uploads?: Array<{
    id: string;
    imageUrl: string;
    status: string;
    createdAt: string;
    rejectionReason: string | null;
    name: string | null;
    costPrice: number | null;
    weight: number | null;
    height: number | null;
    width: number | null;
    depth: number | null;
    availability: number | null;
    description: string | null;
    isUnique: boolean;
  }>;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'craft') {
      return { success: false, canUpload: false, remaining: 0, limit: 0, pendingCount: 0, error: 'Unauthorized' };
    }

    const crafter = await prisma.crafter.findUnique({
      where: { userId: session.user.id },
    });

    if (!crafter) {
      return { success: false, canUpload: false, remaining: 0, limit: 0, pendingCount: 0, error: 'Crafter not found' };
    }


    const uploadCheck = await canUploadMore(crafter.id);

    // Count pending uploads
    const pendingCount = await prisma.productImageUpload.count({
      where: {
        crafterId: crafter.id,
        status: 'PENDING',
      },
    });

    // Get recent uploads (last 10)
    const uploads = await prisma.productImageUpload.findMany({
      where: {
        crafterId: crafter.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        rejectionReason: true,
        name: true,
        costPrice: true,
        weight: true,
        height: true,
        width: true,
        depth: true,
        availability: true,
        description: true,
        isUnique: true,
      },
    });

    return {
      success: true,
      canUpload: uploadCheck.canUpload,
      remaining: uploadCheck.remaining,
      limit: uploadCheck.limit,
      pendingCount,
      uploads: uploads.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error getting upload status:', error);
    return { success: false, canUpload: false, remaining: 0, limit: 0, pendingCount: 0, error: 'Failed to get status' };
  }
}

// Get all pending uploads (admin only)
export async function getPendingImageUploads(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const uploads = await prisma.productImageUpload.findMany({
      where: {
        status: { in: ['PENDING', 'REJECTED'] },
        // Only show uploads where the crafter has submitted complete details
        costPrice: { gt: 0 },
        weight: { gt: 0 },
        height: { gt: 0 },
        width: { gt: 0 },
        depth: { gt: 0 },
      },
      include: {
        crafter: {
          select: {
            id: true,
            businessName: true,
            mobile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Serialize dates
    const serializedUploads = uploads.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: serializedUploads,
    };
  } catch (error) {
    console.error('Error getting pending uploads:', error);
    return { success: false, error: 'Failed to get pending uploads' };
  }
}

// Approve an image upload (admin only)
export async function approveImageUpload(uploadId: string): Promise<ProductImageUploadResponse> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the upload with all details
    const upload = await prisma.productImageUpload.findUnique({
      where: { id: uploadId },
      include: {
        crafter: {
          include: { category: true },
        },
      },
    });

    if (!upload) {
      return { success: false, error: 'Upload not found' };
    }

    // Use crafter's category if set, otherwise fail
    if (!upload.crafter.categoryId) {
      return { success: false, error: 'Cannot approve: crafter has no category assigned' };
    }

    // Determine if dimensional/cost fields are incomplete — crafter will complete them
    const missingFields = !upload.costPrice || !upload.weight || !upload.height || !upload.width || !upload.depth;
    const needsCompletion = missingFields;

    // Auto-generate a placeholder product name from crafter's business name
    // Admin must set a proper name and activate the product on the products page
    const productName = `${upload.crafter.businessName} - DRAFT`;

    // Create unique slug from name (append short id to avoid collisions)
    const baseSlug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${upload.id.slice(-6)}`;

    // Create the Product record using crafter's category
    const product = await prisma.product.create({
      data: {
        name: productName,
        slug,
        category: upload.crafter.category?.name || 'Uncategorized',
        description: upload.description || '',
        price: upload.costPrice ? upload.costPrice * 1.5 : 0,
        costPrice: upload.costPrice || 0,
        weight: upload.weight || 0,
        height: upload.height || 0,
        width: upload.width || 0,
        depth: upload.depth || 0,
        availability: upload.isUnique ? 1 : (upload.availability ?? 3),
        isUnique: upload.isUnique,
        images: [upload.imageUrl],
        crafterId: upload.crafterId,
        isActive: false,
        needsCompletion,
      },
    });

    // Update the upload status to APPROVED
    const updatedUpload = await prisma.productImageUpload.update({
      where: { id: uploadId },
      data: {
        status: 'APPROVED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    revalidatePath('/admin/image-approvals');
    revalidatePath('/admin/products');
    revalidatePath('/crafter');

    return {
      success: true,
      message: `Image upload approved and product "${upload.name}" created`,
      data: { upload: updatedUpload, productId: product.id },
    };
  } catch (error) {
    console.error('Error approving image upload:', error);
    return { success: false, error: 'Failed to approve upload: ' + (error as Error).message };
  }
}

// Reject an image upload (admin only)
export async function rejectImageUpload(
  uploadId: string,
  reason: string
): Promise<ProductImageUploadResponse> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the upload record first to retrieve the image URL
    const upload = await prisma.productImageUpload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return { success: false, error: 'Upload not found' };
    }

    // Delete the image from UploadThing
    const utapi = new UTApi();
    try {
      await utapi.deleteFiles([upload.imageUrl]);
    } catch (error) {
      console.error('Failed to delete image from UploadThing:', error);
      // Continue with rejection even if image deletion fails
    }

    // Update the upload status
    const updatedUpload = await prisma.productImageUpload.update({
      where: { id: uploadId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    revalidatePath('/admin/image-approvals');
    revalidatePath('/crafter');

    return {
      success: true,
      message: 'Image upload rejected',
      data: updatedUpload,
    };
  } catch (error) {
    console.error('Error rejecting image upload:', error);
    return { success: false, error: 'Failed to reject upload' };
  }
}

// Get crafter's upload history
export async function getCrafterUploadHistory(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'craft') {
      return { success: false, error: 'Unauthorized' };
    }

    const crafter = await prisma.crafter.findUnique({
      where: { userId: session.user.id },
    });

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    const uploads = await prisma.productImageUpload.findMany({
      where: {
        crafterId: crafter.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return {
      success: true,
      data: uploads,
    };
  } catch (error) {
    console.error('Error getting upload history:', error);
    return { success: false, error: 'Failed to get upload history' };
  }
}