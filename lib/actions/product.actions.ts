'use server';
import { prisma } from '@/lib/prisma';
import { FIRST_PAGE_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { insertProductSchema, updateProductSchema } from '@/lib/validations/product';
import { UTApi } from 'uploadthing/server';
import { auth } from '@/auth';

// ============================================================================
// CUSTOMER-FACING FUNCTIONS
// ============================================================================
// These functions are used in customer-facing features and should NOT be
// modified for admin requirements to avoid affecting user experience/server

import { formatError } from "../utils";
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { checkAdminAuth } from './auth-actions';

// Helper function to serialize product for client components
function serializeProduct(product: any) {
  return {
    ...product,
    _id: product.id,
    id: product.id,
    price: product.price?.toString() || '0',
    costPrice: product.costPrice || 0,
    priceNeedsReview: product.priceNeedsReview || false,
    reviewReason: product.reviewReason || null,
    lastCostPriceUpdate: product.lastCostPriceUpdate?.toISOString() || null,
    rating: product.rating?.toString() || '0',
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString(),
    images: product.images || [],
    crafter: product.crafter ? {
      id: product.crafter.id,
      name: product.crafter.businessName,
    } : null,
  };
}

// Initialize UploadThing API
const utapi = new UTApi();

// GET LATEST PRODUCTS FOR THE HOME PAGE
export async function getLatestProducts() {
    // First, try to get products marked for first page (only active products)
    let data = await prisma.product.findMany({
        where: { isFirstPage: true, isActive: true },
        take: FIRST_PAGE_PRODUCTS_LIMIT,
        orderBy: { createdAt: 'desc' },
    });

    // If no products are marked for first page, fall back to latest active products
    if (data.length === 0) {
        data = await prisma.product.findMany({
            where: { isActive: true },
            take: FIRST_PAGE_PRODUCTS_LIMIT,
            orderBy: { createdAt: 'desc' },
        });
    }

    return data.map((p) => ({
        ...p,
        _id: p.id,
        price: p.price.toString(),
        rating: p.rating?.toString() || '0',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt?.toISOString(),
        images: p.images || [],
        crafter: p.crafterId || null,
    }));
};

// GET A SINGLE PRODUCT BY ITS SLUG
export async function getProductBySlug(slug: string) {
  const data = await prisma.product.findFirst({
    where: { slug, isActive: true },
  });
  if (!data) return null;
  
  return {
    ...data,
    _id: data.id,
    price: data.price.toString(),
    rating: data.rating?.toString() || '0',
    createdAt: data.createdAt.toISOString(),
    images: data.images || [],
  };
}



// Find product IDs whose tags match the query case-insensitively / partially.
// Prisma can't do `contains` on array elements, so use a raw Postgres query.
async function getProductIdsMatchingTags(query: string): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product"
      WHERE EXISTS (
        SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE ${'%' + query + '%'}
      )
    `;
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

// --- Get all products
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort,
}: {
  query: string;
  category: string;
  limit?: number;
  page: number;
  price?: string;
  rating?: string;
  sort?: string;
  }) {
    const where: any = { isActive: true };
    
    // Query filter (case-insensitive search across name, description, category and tags)
    if (query && query !== 'all') {
      const tagMatchedIds = await getProductIdsMatchingTags(query);
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        ...(tagMatchedIds.length > 0 ? [{ id: { in: tagMatchedIds } }] : []),
      ];
    }
    
    // Category filter
    if (category && category !== 'all') {
      where.category = category;
    }
    
    // Price filter
    if (price && price !== 'all') {
      const [minPrice, maxPrice] = price.split('-').map(Number);
      where.price = { gte: minPrice, lte: maxPrice };
    }
    
    // Rating filter
    if (rating && rating !== 'all') {
      where.rating = { gte: Number(rating) };
    }

    // Build sort object
    let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' };
    if (sort === 'lowest') orderBy = { price: 'asc' };
    else if (sort === 'highest') orderBy = { price: 'desc' };
    else if (sort === 'rating') orderBy = { rating: 'desc' };

    // Get data and count
    const [data, dataCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);

    const products = data.map((p) => ({
        ...p,
        _id: p.id,
        price: p.price.toString(),
        rating: p.rating?.toString() || '0',
        createdAt: p.createdAt.toISOString(),
        images: p.images || [],
        crafter: p.crafterId || null,
    }));

    return {
        data: products,
        totalPages: Math.ceil(dataCount / limit),
    };
}


// Get products grouped by crafter (ADMIN ONLY - for admin products page)
export async function getAdminProductsGroupedByCrafter({ 
  query, 
  page = 1, 
}: {
  query?: string;
  page?: number;
}) {
  const limit = PAGE_SIZE;

  const where: any = {};
  if (query && query !== 'all') {
    const tagMatchedIds = await getProductIdsMatchingTags(query);
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } },
      ...(tagMatchedIds.length > 0 ? [{ id: { in: tagMatchedIds } }] : []),
    ];
  }

  const [allProducts, dataCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { crafter: { select: { id: true, businessName: true } } },
    }),
    prisma.product.count({ where })
  ]);

  // Group products by crafter
  const groupedByCrafter = new Map<string, any>();
  
  allProducts.forEach((product) => {
    const crafterId = product.crafter?.id || 'unassigned';
    const crafterName = product.crafter?.businessName || 'Unassigned';
    
    if (!groupedByCrafter.has(crafterId)) {
      groupedByCrafter.set(crafterId, {
        crafterId,
        crafterName,
        products: [],
        productCount: 0,
      });
    }
    
    const group = groupedByCrafter.get(crafterId);
    
    group.products.push({
      ...product,
      _id: product.id,
      price: product.price.toString(),
      costPrice: product.costPrice || 0,
      priceNeedsReview: product.priceNeedsReview || false,
    reviewReason: product.reviewReason || null,
      lastCostPriceUpdate: product.lastCostPriceUpdate?.toISOString() || null,
      isActive: product.isActive,
      rating: product.rating?.toString() || '0',
      createdAt: product.createdAt.toISOString(),
      images: product.images || [],
      crafter: product.crafter ? {
        id: product.crafter.id,
        name: product.crafter.businessName,
      } : null,
    });
    group.productCount++;
  });

  // Always include "Unassigned" section even if empty, so users can drag products to it
  if (!groupedByCrafter.has('unassigned')) {
    groupedByCrafter.set('unassigned', {
      crafterId: 'unassigned',
      crafterName: 'Unassigned',
      products: [],
      productCount: 0,
    });
  }

  // Convert map to array and apply pagination
  const crafterGroups = Array.from(groupedByCrafter.values());
  const totalGroups = crafterGroups.length;
  const paginatedGroups = crafterGroups.slice((page - 1) * limit, page * limit);

  return {
    data: paginatedGroups,
    totalPages: Math.ceil(totalGroups / limit),
    totalProducts: dataCount,
    query,
  };
}



// Delete Product (ADMIN ONLY)
export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string; error?: string; data?: { id: string; name: string } }> {
    try {
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
      }

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) throw new Error('Product not found');

      // Remove related records that block deletion
      await prisma.cartItem.deleteMany({ where: { productId: id } });
      await prisma.review.deleteMany({ where: { productId: id } });
      await prisma.orderItem.deleteMany({ where: { productId: id } });

      await prisma.product.delete({ where: { id } });
  
      revalidatePath('/admin/products');
  
      return {
        success: true,
        message: 'Product deleted successfully',
        data: { id: product.id, name: product.name },
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, error: errorResponse.message };
    }
}



// Create Product
export async function createProduct(data: z.infer<typeof insertProductSchema> & { crafter?: string | null }): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
    try {
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
      }

      // Map form's 'crafter' field to 'crafterId'
      if ('crafter' in data && data.crafter && !data.crafterId) {
        data.crafterId = data.crafter;
      }

      // Validate
      const parsed = insertProductSchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
      }
      const product = parsed.data;
      
      // Check if trying to set isFirstPage to true
      if (product.isFirstPage) {
        const firstPageCount = await prisma.product.count({ where: { isFirstPage: true, isActive: true } });
        
        if (firstPageCount >= FIRST_PAGE_PRODUCTS_LIMIT) {
          return {
            success: false,
            message: `Cannot add more products to first page. Limit of ${FIRST_PAGE_PRODUCTS_LIMIT} reached. Please set one product as not on first page first.`,
          };
        }
      }
      
      const createdProduct = await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          category: product.category,
          description: product.description,
          images: product.images,
          isFirstPage: product.isFirstPage,
          isUnique: product.isUnique ?? false,
          isActive: product.isActive ?? false,
          banner: product.banner,
          price: Number(product.price),
          costPrice: Number(product.costPrice),
          weight: Number(product.weight) || 0,
          height: Number(product.height) || 0,
          width: Number(product.width) || 0,
          depth: Number(product.depth) || 0,
          priceNeedsReview: product.priceNeedsReview ?? false,
          reviewReason: product.reviewReason ?? null,
          availability: product.isUnique ? 1 : (product.availability ?? 3),
          tags: product.tags ?? [],
          crafterId: product.crafterId || null,
        },
      });
  
      revalidatePath('/admin/products');
  
      return {
        success: true,
        message: 'Product created successfully',
        data: createdProduct,
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, error: errorResponse.message };
    }
  }

  

// Update Product
export async function updateProduct(data: z.infer<typeof updateProductSchema> & { crafter?: string | null }): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
    try {
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
      }

      // Map form's 'crafter' field to 'crafterId'
      if ('crafter' in data && !data.crafterId) {
        data.crafterId = data.crafter || null;
      }

      // Validate
      const parsed = updateProductSchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
      }
      const product = parsed.data;

      const productExists = await prisma.product.findUnique({ where: { id: product.id } });
      if (!productExists) throw new Error('Product not found');
  
      // Check if trying to set isFirstPage to true when it wasn't before
      if (product.isFirstPage && !productExists.isFirstPage) {
        const firstPageCount = await prisma.product.count({ where: { isFirstPage: true, isActive: true } });
        
        if (firstPageCount >= FIRST_PAGE_PRODUCTS_LIMIT) {
          return {
            success: false,
            message: `Cannot add more products to first page. Limit of ${FIRST_PAGE_PRODUCTS_LIMIT} reached. Please set one product as not on first page first.`,
          };
        }
      }
  
      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          name: product.name,
          slug: product.slug,
          category: product.category,
          description: product.description,
          images: product.images,
          isFirstPage: product.isFirstPage,
          isUnique: product.isUnique ?? false,
          isActive: product.isActive ?? false,
          banner: product.banner,
          price: Number(product.price),
          costPrice: Number(product.costPrice),
          weight: Number(product.weight) || 0,
          height: Number(product.height) || 0,
          width: Number(product.width) || 0,
          depth: Number(product.depth) || 0,
          priceNeedsReview: product.priceNeedsReview,
          reviewReason: product.reviewReason ?? null,
          availability: product.isUnique ? 1 : product.availability,
          tags: product.tags,
          crafterId: product.crafterId || null,
        },
      });
  
      revalidatePath('/admin/products');
  
      return {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, error: errorResponse.message };
    }
  }


// Get single product by id
export async function getProductById(productId: string) {
  const data = await prisma.product.findUnique({
    where: { id: productId },
    include: { crafter: { select: { id: true, businessName: true } } },
  });
  if (!data) return null;
  
  return {
    ...data,
    _id: data.id,
    price: data.price.toString(),
    costPrice: data.costPrice?.toString() || '0',
    rating: data.rating?.toString() || '0',
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt?.toISOString(),
    images: data.images || [],
    banner: data.banner ?? null,
    crafter: data.crafter ? {
      id: data.crafter.id,
      name: data.crafter.businessName,
    } : null,
  };
}


// Get all crafters for drag-and-drop (ADMIN ONLY)
export async function getAllCraftersForDrop() {
  const crafters = await prisma.crafter.findMany({
    where: { isActive: true },
    select: { id: true, businessName: true, category: { select: { name: true } } },
  });
    
  return crafters.map((crafter) => ({
    id: crafter.id,
    name: crafter.businessName,
    category: crafter.category?.name || null,
  }));
}

// Get all the categories (aggregated from products)
export async function getAllCategories() {
    const data = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { category: 'asc' },
    });
    return data.map(item => ({ category: item.category, _count: { count: item._count.category } }));
}



// Toggle product isFirstPage status (ADMIN ONLY)
export async function toggleProductFirstPage(productId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const product = await prisma.product.findUnique({ where: { id: productId } });
  
      if (!product) throw new Error('Product not found');
  
      // If trying to set to true, check the limit
      if (!product.isFirstPage) {
        const firstPageCount = await prisma.product.count({ where: { isFirstPage: true, isActive: true } });
        
        if (firstPageCount >= FIRST_PAGE_PRODUCTS_LIMIT) {
          return {
            success: false,
            message: `Cannot add more products to first page. Limit of ${FIRST_PAGE_PRODUCTS_LIMIT} reached. Please remove one product from first page first.`,
          };
        }
      }
  
      await prisma.product.update({
        where: { id: productId },
        data: { isFirstPage: !product.isFirstPage },
      });
  
      return {
        success: true,
        message: product.isFirstPage 
          ? 'Product removed from first page' 
          : 'Product added to first page',
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, message: errorResponse.message, error: errorResponse.message };
    }
}

// Update Product Crafter (ADMIN ONLY)
export async function updateProductCrafter(productId: string, crafterId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!productId || !crafterId) {
      return { success: false, error: 'Product ID and Crafter ID are required' };
    }

    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const updateData = crafterId === 'unassigned' 
      ? { crafterId: null } 
      : { crafterId: crafterId };
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    if (!updatedProduct) {
      return { success: false, error: 'Product not found' };
    }

    const message = crafterId === 'unassigned' 
      ? 'Product unassigned successfully' 
      : 'Product moved to new crafter successfully';

    return { success: true, message };
  } catch (error) {
    const errorResponse = formatError(error);
    return { success: false, error: errorResponse.message };
  }
}

// Delete Product Images from UploadThing (ADMIN ONLY)
export async function deleteProductImages(images: string[]): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!Array.isArray(images) || images.length === 0) {
      return { success: false, error: 'No images provided for deletion' };
    }

    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validUrls = images.filter(url => typeof url === 'string' && url.trim().length > 0);
    if (validUrls.length === 0) {
      return { success: false, error: 'No valid image URLs provided' };
    }

    // Extract file keys from UploadThing URLs
    // UploadThing URLs format: https://utfs.io/f/{fileKey}
    const fileKeys = validUrls
      .map(url => {
        const match = url.match(/\/f\/([^\/]+)$/);
        return match ? match[1] : null;
      })
      .filter((key): key is string => key !== null);

    if (fileKeys.length === 0) {
      return { success: false, error: 'No valid UploadThing file keys found in provided URLs' };
    }

    await utapi.deleteFiles(fileKeys);

    return {
      success: true,
      message: `Successfully deleted ${fileKeys.length} image(s) from UploadThing`,
    };
  } catch (error) {
    console.error('Error deleting images from UploadThing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete images from UploadThing' 
    };
  }
}

/**
 * Get all products for the crafter linked to the current user
 * Only accessible by users with 'craft' role
 */
export async function getAllProductsByLinkedCrafter(): Promise<{
  success: boolean;
  message: string;
  data: any[] | null;
}> {
  try {
    const { getLinkedCrafterId } = await import('@/lib/auth-utils');
    const crafterId = await getLinkedCrafterId();
    
    if (!crafterId) {
      return {
        success: false,
        message: 'No crafter account linked to your user',
        data: null
      };
    }
    
    const products = await prisma.product.findMany({
      where: { crafterId },
      include: { crafter: { select: { id: true, businessName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    
    const serializedProducts = products.map(serializeProduct);
    
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: serializedProducts
    };
  } catch (error) {
    console.error('Error getting products by linked crafter:', error);
    return {
      success: false,
      message: 'Failed to retrieve products',
      data: null
    };
  }
}

/**
 * Update product availability (for crafters)
 * Allows craft users to update only the availability field of their own products
 */
export async function updateProductAvailability(
  productId: string,
  availability: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { getLinkedCrafterId } = await import('@/lib/auth-utils');
    const crafterId = await getLinkedCrafterId();
    
    if (!crafterId) {
      return { success: false, message: 'No crafter account linked to your user' };
    }
    
    if (availability < -1) {
      return { success: false, message: 'Invalid availability value' };
    }
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product) {
      return { success: false, message: 'Product not found' };
    }
    
    if (product.crafterId !== crafterId) {
      return { success: false, message: 'You can only update your own products' };
    }
    
    await prisma.product.update({
      where: { id: productId },
      data: {
        availability,
        ...(availability === -1
          ? { isActive: false, priceNeedsReview: true, reviewReason: 'Marked Not Available (out of stock)' }
          : {}),
      },
    });
    
    revalidatePath('/crafter/availability');
    revalidatePath('/crafter/products');
    
    revalidatePath('/admin/products');
    return { success: true, message: availability === -1 ? 'Marked Not Available — product deactivated and sent for admin review' : 'Availability updated successfully' };
  } catch {
    return { success: false, message: 'Failed to update availability' };
  }
}

/**
 * Update product cost price (for crafters)
 * Allows craft users to update only the costPrice field of their own products
 */
export async function updateProductCostPrice(
  productId: string,
  costPrice: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { getLinkedCrafterId } = await import('@/lib/auth-utils');
    const crafterId = await getLinkedCrafterId();
    
    if (!crafterId) {
      return { success: false, message: 'No crafter account linked to your user' };
    }
    
    if (costPrice < 0) {
      return { success: false, message: 'Cost price must be 0 or greater' };
    }
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product) {
      return { success: false, message: 'Product not found' };
    }
    
    if (product.crafterId !== crafterId) {
      return { success: false, message: 'You can only update your own products' };
    }
    
    await prisma.product.update({
      where: { id: productId },
      data: {
        costPrice,
        priceNeedsReview: true,
        reviewReason: `Cost price R${product.costPrice ?? 0} → R${costPrice}`,
        lastCostPriceUpdate: new Date(),
        isActive: false, // Deactivate until an admin reviews the new price
      },
    });
    
    revalidatePath('/crafter');
    revalidatePath('/admin/products');
    
    return { success: true, message: 'Cost price updated successfully' };
  } catch (error) {
    console.error('Error updating product cost price:', error);
    return { success: false, message: 'Failed to update cost price' };
  }
}

/**
 * Mark product price as reviewed (ADMIN ONLY)
 * Clears the priceNeedsReview flag after admin has reviewed the cost price change
 */
export async function markPriceAsReviewed(productId: string): Promise<{ success: boolean; message: string }> {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, message: authCheck.error || 'Unauthorized' };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product) {
      return { success: false, message: 'Product not found' };
    }
    
    await prisma.product.update({
      where: { id: productId },
      data: { priceNeedsReview: false, reviewReason: null },
    });
    
    revalidatePath('/admin/products');
    
    return { success: true, message: 'Price marked as reviewed' };
  } catch (error) {
    console.error('Error marking price as reviewed:', error);
    return { success: false, message: 'Failed to mark price as reviewed' };
  }
}

/**
 * Get all products for a specific crafter by crafterId
 */
export async function getProductsByCrafterId(crafterId: string): Promise<{
  success: boolean;
  message: string;
  data: any[] | null;
}> {
  try {
    const products = await prisma.product.findMany({
      where: { crafterId },
      include: { crafter: { select: { id: true, businessName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    
    const serializedProducts = products.map(serializeProduct);
    
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: serializedProducts
    };
  } catch (error) {
    console.error('Error getting products by crafter ID:', error);
    return {
      success: false,
      message: 'Failed to retrieve products',
      data: null
    };
  }
}

/**
 * Get all products for admin with crafter info (ADMIN ONLY - flat list)
 */
export async function getAdminProducts({ 
  query, 
  page = 1,
  crafterId,
}: {
  query?: string;
  page?: number;
  crafterId?: string;
}) {
  const limit = PAGE_SIZE;

  const where: any = {};
  
  if (query && query !== 'all') {
    const tagMatchedIds = await getProductIdsMatchingTags(query);
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } },
      ...(tagMatchedIds.length > 0 ? [{ id: { in: tagMatchedIds } }] : []),
    ];
  }

  if (crafterId && crafterId !== 'all') {
    where.crafterId = crafterId;
  }

  const [products, dataCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { crafter: { select: { id: true, businessName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where })
  ]);

  const serializedProducts = products.map((product) => ({
    _id: product.id,
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    price: product.price.toString(),
    costPrice: product.costPrice || 0,
    priceNeedsReview: product.priceNeedsReview || false,
    reviewReason: product.reviewReason || null,
    lastCostPriceUpdate: product.lastCostPriceUpdate?.toISOString() || null,
    availability: product.availability,
    isActive: product.isActive,
    isUnique: product.isUnique,
    isFirstPage: product.isFirstPage,
    rating: product.rating?.toString() || '0',
    createdAt: product.createdAt.toISOString(),
    images: product.images || [],
    crafter: product.crafter ? {
      id: product.crafter.id,
      name: product.crafter.businessName,
    } : null,
  }));

  return {
    data: serializedProducts,
    totalPages: Math.ceil(dataCount / limit),
  };
}

/**
 * Toggle product active status (ADMIN ONLY)
 * Cannot activate unless cost, retail, mass, height, width, depth, availability and crafter are filled.
 */
export async function toggleProductActive(productId: string): Promise<{ success: boolean; message: string; isActive?: boolean }> {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, message: authCheck.error || 'Unauthorized' };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    // If activating, check required fields
    if (!product.isActive) {
      const missing: string[] = [];
      if (!product.costPrice || product.costPrice <= 0) missing.push('Cost Price');
      if (!product.price || product.price <= 0) missing.push('Retail Price');
      if (!product.weight || product.weight <= 0) missing.push('Mass');
      if (!product.height || product.height <= 0) missing.push('Height');
      if (!product.width || product.width <= 0) missing.push('Width');
      if (!product.depth || product.depth <= 0) missing.push('Depth');
      if (product.availability === null || product.availability === undefined) missing.push('Availability');
      if (!product.crafterId) missing.push('Crafter');

      if (missing.length > 0) {
        return { success: false, message: `Cannot activate: fill in ${missing.join(', ')} first` };
      }

      // Check crafter is approved (not pending registration)
      const crafter = await prisma.crafter.findUnique({ where: { id: product.crafterId! } });
      if (crafter?.status === 'PENDING') {
        return { success: false, message: 'Cannot activate: crafter registration must be approved first' };
      }
    }
    
    const activating = !product.isActive;
    const updated = await prisma.product.update({
      where: { id: productId },
      // When the admin activates a product, clear any pending review flag/reason
      data: { isActive: activating, ...(activating ? { priceNeedsReview: false, reviewReason: null } : {}) },
    });
    
    return {
      success: true,
      message: `Product ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: updated.isActive
    };
  } catch (error) {
    console.error('Error toggling product active status:', error);
    return { success: false, message: 'Failed to toggle product status' };
  }
}

// Get crafter dashboard stats
export async function getCrafterDashboardStats(): Promise<{
  success: boolean;
  data?: {
    registeredItems: number;
    approvedItems: number;
    soldItems: number;
    fundsDue: number;
  };
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

    // Get all products for this crafter
    const products = await prisma.product.findMany({
      where: { crafterId: crafter.id },
      include: {
        orderItems: {
          include: {
            order: true,
          },
        },
      },
    });

    const registeredItems = products.length;
    const approvedItems = products.filter(p => p.isActive).length;

    // Sold items = paid order items for this crafter's products
    let soldItems = 0;
    for (const product of products) {
      for (const orderItem of product.orderItems) {
        if (orderItem.order.isPaid) {
          soldItems += orderItem.qty;
        }
      }
    }

    // Funds due = amount still owed to the crafter = sum of their PENDING
    // crafter payments (cost price allocated when an order is paid, not yet paid out).
    const pendingPayments = await prisma.crafterPayment.aggregate({
      where: { crafterId: crafter.id, status: 'PENDING' },
      _sum: { amount: true },
    });
    const fundsDue = pendingPayments._sum.amount || 0;

    return {
      success: true,
      data: {
        registeredItems,
        approvedItems,
        soldItems,
        fundsDue,
      },
    };
  } catch (error) {
    console.error('Error getting crafter dashboard stats:', error);
    return { success: false, error: 'Failed to get dashboard stats' };
  }
}
