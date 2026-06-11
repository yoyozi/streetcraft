'use server';

import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from './auth-actions';

/**
 * Cleanup unreferenced images from UploadThing (Admin only)
 */
export async function cleanupUnreferencedImages(): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
  freedSpace?: number;
  error?: string;
}> {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, message: 'Unauthorized', error: authCheck.error };
    }

    // UploadThing file listing and deletion APIs require additional configuration
    // This feature is disabled by default as it needs special API permissions
    return {
      success: false,
      message: 'The storage cleanup feature requires UploadThing API access with additional permissions. This feature is currently disabled.',
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return {
      success: false,
      message: 'Failed to cleanup unreferenced images',
      error: 'Internal server error',
    };
  }
}

/**
 * Get UploadThing storage statistics (Admin only)
 */
export async function getUploadThingStats(): Promise<{
  success: boolean;
  data?: {
    totalFiles: number;
    referencedFiles: number;
    unreferencedFiles: number;
    estimatedSizeMB: number;
    unreferencedFileUrls?: string[];
  };
  error?: string;
  disabled?: boolean;
}> {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    // Get all image URLs from the database
    const allImageUrls = new Set<string>();
    const referencedUrls = new Set<string>();

    // Get product images
    try {
      const products = await prisma.product.findMany({
        select: { images: true },
      });
      products.forEach(p => p.images.forEach(url => {
        allImageUrls.add(url);
        referencedUrls.add(url);
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    }

    // Get crafter work samples
    try {
      const crafters = await prisma.crafter.findMany({
        select: { workSamples: true },
      });
      crafters.forEach(c => c.workSamples.forEach(url => {
        allImageUrls.add(url);
        referencedUrls.add(url);
      }));
    } catch (error) {
      console.error('Error fetching crafters:', error);
    }

    // Get product image uploads
    try {
      const imageUploads = await prisma.productImageUpload.findMany({
        select: { imageUrl: true },
      });
      imageUploads.forEach(u => {
        allImageUrls.add(u.imageUrl);
        referencedUrls.add(u.imageUrl);
      });
    } catch (error) {
      console.error('Error fetching image uploads:', error);
    }

    // Get user profile images
    try {
      const users = await prisma.user.findMany({
        select: { image: true },
        where: { image: { not: null } },
      });
      users.forEach(u => {
        if (u.image) {
          allImageUrls.add(u.image);
          referencedUrls.add(u.image);
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }

    // Get crafter profile images
    try {
      const crafterProfiles = await prisma.crafter.findMany({
        select: { profileImage: true },
        where: { profileImage: { not: null } },
      });
      crafterProfiles.forEach(c => {
        if (c.profileImage) {
          allImageUrls.add(c.profileImage);
          referencedUrls.add(c.profileImage);
        }
      });
    } catch (error) {
      console.error('Error fetching crafter profiles:', error);
    }

    // Since we can't list files from UploadThing without admin API,
    // we'll return database statistics
    // All files in database are considered "referenced" since they're actively used
    return {
      success: true,
      data: {
        totalFiles: allImageUrls.size,
        referencedFiles: referencedUrls.size,
        unreferencedFiles: 0, // Can't determine without UploadThing API
        estimatedSizeMB: allImageUrls.size * 4,
      },
    };
  } catch (error) {
    console.error('Error getting UploadThing stats:', error);
    return {
      success: false,
      error: 'Failed to get storage statistics',
    };
  }
}