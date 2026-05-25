'use server';
import { prisma } from '@/lib/prisma';
import { FIRST_PAGE_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { insertProductSchema, updateProductSchema } from '@/lib/validations/product';
import { UTApi } from 'uploadthing/server';

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
    
    // Query filter (case-insensitive search)
    if (query && query !== 'all') {
      where.name = { contains: query, mode: 'insensitive' };
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
    where.name = { contains: query, mode: 'insensitive' };
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
export async function createProduct(data: z.infer<typeof insertProductSchema>): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
    try {
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
      }

      // Validate
      const parsed = insertProductSchema.safeParse(data);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
      }
      const product = parsed.data;
      
      // Check if trying to set isFirstPage to true
      if (product.isFirstPage) {
        const firstPageCount = await prisma.product.count({ where: { isFirstPage: true } });
        
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
          isFeatured: product.isFeatured,
          isFirstPage: product.isFirstPage,
          banner: product.banner,
          price: Number(product.price),
          costPrice: Number(product.costPrice),
          priceNeedsReview: product.priceNeedsReview ?? false,
          availability: product.availability ?? 3,
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
export async function updateProduct(data: z.infer<typeof updateProductSchema>): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
    try {
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
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
        const firstPageCount = await prisma.product.count({ where: { isFirstPage: true } });
        
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
          isFeatured: product.isFeatured,
          isFirstPage: product.isFirstPage,
          banner: product.banner,
          price: Number(product.price),
          costPrice: Number(product.costPrice),
          priceNeedsReview: product.priceNeedsReview,
          availability: product.availability,
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
    select: { id: true, businessName: true },
  });
    
  return crafters.map((crafter) => ({
    id: crafter.id,
    name: crafter.businessName,
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


// Get featured products
export async function getFeaturedProducts() {
    const data = await prisma.product.findMany({
        where: { isFeatured: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 4,
    });
    
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
}


// Toggle product isFirstPage status (ADMIN ONLY)
export async function toggleProductFirstPage(productId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const product = await prisma.product.findUnique({ where: { id: productId } });
  
      if (!product) throw new Error('Product not found');
  
      // If trying to set to true, check the limit
      if (!product.isFirstPage) {
        const firstPageCount = await prisma.product.count({ where: { isFirstPage: true } });
        
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
  
      revalidatePath('/admin/products');
  
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
      data: { availability },
    });
    
    revalidatePath('/crafter/availability');
    revalidatePath('/crafter/products');
    
    return { success: true, message: 'Availability updated successfully' };
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
        lastCostPriceUpdate: new Date(),
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
      data: { priceNeedsReview: false },
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
    where.name = { contains: query, mode: 'insensitive' };
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
    lastCostPriceUpdate: product.lastCostPriceUpdate?.toISOString() || null,
    availability: product.availability,
    isActive: product.isActive,
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
    
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
    });
    
    revalidatePath('/admin/products');
    
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
