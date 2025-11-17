'use server';
import { connectDB, Product } from '../mongodb/models';
import { FIRST_PAGE_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { insertProductSchema, updateProductSchema } from '../validators';
import { auth } from '@/auth';
import { UTApi } from 'uploadthing/server';

// ============================================================================
// CUSTOMER-FACING FUNCTIONS
// ============================================================================
// These functions are used in customer-facing features and should NOT be
// modified for admin requirements to avoid affecting user experience/server

// Bring in the prisma to JS object converter
import { formatError } from "../utils";
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import z from 'zod';

// Helper function to serialize product for client components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProduct(product: any) {
  // Use toObject with virtuals to get the id field
  const obj = product.toObject ? product.toObject({ virtuals: true }) : product;
  
  // Ensure _id is always a string
  const productId = obj._id?.toString() || obj.id?.toString();
  
  return {
    ...obj,
    _id: productId,
    id: productId,
    price: obj.price?.toString() || '0',
    costPrice: obj.costPrice || 0,
    priceNeedsReview: obj.priceNeedsReview || false,
    lastCostPriceUpdate: obj.lastCostPriceUpdate?.toString() || null,
    rating: obj.rating?.toString() || '0',
    createdAt: obj.createdAt?.toString(),
    updatedAt: obj.updatedAt?.toString(),
    images: obj.images || [],
    crafter: obj.crafter ? (typeof obj.crafter === 'object' ? {
      _id: obj.crafter._id?.toString(),
      name: obj.crafter.name
    } : obj.crafter.toString()) : null,
    category: obj.category ? (typeof obj.category === 'object' ? {
      _id: obj.category._id?.toString(),
      name: obj.category.name
    } : obj.category.toString()) : null,
  };
}

// Initialize UploadThing API
const utapi = new UTApi();

// Helper to check admin authorization
async function checkAdminAuth() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return { authorized: false, error: 'Unauthorized: Admin access required' };
  }
  return { authorized: true };
}

// GET LATEST PRODUCTS FOR THE HOME PAGE
// returns prisma object we need to convert it into a Javascript object
export async function getLatestProducts() {
    await connectDB();
    
    // First, try to get products marked for first page (only active products)
    let data = await Product.find({ isFirstPage: true, isActive: true })
        .limit(FIRST_PAGE_PRODUCTS_LIMIT)
        .sort({ createdAt: -1 })
        .exec();

    // If no products are marked for first page, fall back to latest active products
    if (data.length === 0) {
        data = await Product.find({ isActive: true })
            .limit(FIRST_PAGE_PRODUCTS_LIMIT)
            .sort({ createdAt: -1 })
            .exec();
    }

    return data.map((p) => {
      const obj = p.toObject();
      return {
        ...obj,
        _id: String(obj._id), // More robust conversion to string
        price: p.price.toString(),
        rating: p.rating?.toString() || '0',
        createdAt: p.createdAt.toString(),
        updatedAt: obj.updatedAt?.toString(),
        images: p.images || [],
        crafter: obj.crafter ? obj.crafter.toString() : null,
      };
    });
    
};

// GET A SINGLE PRODUCT BY ITS SLUG
export async function getProductBySlug(slug: string) {
  await connectDB();
  const data = await Product.findOne({ slug, isActive: true });
  if (!data) return null;
  
  const plainProduct = data.toObject();
  return {
    ...plainProduct,
    _id: String(plainProduct._id), // Convert ObjectId to string
    price: plainProduct.price.toString(),
    rating: plainProduct.rating?.toString() || '0',
    createdAt: plainProduct.createdAt.toString(),
    images: plainProduct.images || [],
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
    await connectDB();

    // Build the filter object
    const filter: {
      name?: { $regex: string; $options: string };
      category?: string;
      price?: { $gte: number; $lte: number };
      rating?: { $gte: number };
      isActive?: boolean;
    } = {};
    
    // Only show active products to customers
    filter.isActive = true;
    
    // Query filter
    if (query && query !== 'all') {
      filter.name = { $regex: query, $options: 'i' };
    }
    
    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Price filter
    if (price && price !== 'all') {
      const [minPrice, maxPrice] = price.split('-').map(Number);
      filter.price = { $gte: minPrice, $lte: maxPrice };
    }
    
    // Rating filter
    if (rating && rating !== 'all') {
      filter.rating = { $gte: Number(rating) };
    }

    // Build sort object
    let sortObj: { createdAt?: -1; price?: 1 | -1; rating?: -1 } = { createdAt: -1 };
    if (sort === 'lowest') sortObj = { price: 1 };
    else if (sort === 'highest') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };

    // Get data and count
    const [data, dataCount] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Product.countDocuments(filter)
    ]);

    const products = data.map((p) => {
      const obj = p.toObject();
      return {
        ...obj,
        _id: String(obj._id), // More robust conversion to string
        price: p.price.toString(),
        rating: p.rating?.toString() || '0',
        createdAt: p.createdAt.toString(),
        images: p.images || [],
        crafter: obj.crafter?.toString() || null,
      };
    });

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
  await connectDB();

  // Set pagination limit
  const limit = PAGE_SIZE;

  // Build the filter object for products
  const productFilter: {
    name?: { $regex: string; $options: string };
  } = {};
  
  // Query filter
  if (query && query !== 'all') {
    productFilter.name = { $regex: query, $options: 'i' };
  }

  // Get all products matching the filter and populate crafter
  const [allProducts, dataCount] = await Promise.all([
    Product.find(productFilter)
      .populate({
        path: 'crafter',
        select: 'name',
        model: 'Crafter'
      }).exec(),
    Product.countDocuments(productFilter)
  ]);

  //console.log('Raw products data:', JSON.stringify(allProducts.slice(0, 1), null, 2));

  // Group products by crafter
  const groupedByCrafter = new Map<string, any>();
  //console.log('Processing products:', allProducts.length);
  
  allProducts.forEach((product) => {
    // Handle populated crafter object
    const crafterObj = (product as any).crafter;
    const crafterId = crafterObj?.id || 'unassigned';
    const crafterName = crafterObj?.name || 'Unassigned';
    
    //console.log(`Product: ${product.name}, Crafter ID: ${crafterId}, Crafter Name: ${crafterName}`);
    //console.log('Crafter object:', crafterObj);
    
    if (!groupedByCrafter.has(crafterId)) {
      groupedByCrafter.set(crafterId, {
        crafterId,
        crafterName,
        products: [],
        productCount: 0,
      });
    }
    
    const group = groupedByCrafter.get(crafterId);
    const productObj = product.toObject();
    
    // Convert crafter to plain object if it exists
    if (productObj.crafter) {
      productObj.crafter = {
        id: productObj.crafter._id?.toString() || productObj.crafter.id,
        name: productObj.crafter.name
      };
    }
    
    group.products.push({
      ...productObj,
      _id: String(productObj._id), // Convert ObjectId to string
      price: product.price.toString(),
      costPrice: product.costPrice || 0,
      priceNeedsReview: product.priceNeedsReview || false,
      lastCostPriceUpdate: product.lastCostPriceUpdate?.toString() || null,
      isActive: product.isActive !== undefined ? product.isActive : true,
      rating: product.rating?.toString() || '0',
      createdAt: product.createdAt.toString(),
      images: product.images || [],
    });
    group.productCount++;
  });

  //console.log('Groups created:', Array.from(groupedByCrafter.keys()));

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
    query, // Include query for client-side search detection
  };
}



// Delete Product (ADMIN ONLY)
export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string; error?: string; data?: { id: string; name: string } }> {
    try {
      // Check admin authorization
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
      }

      await connectDB();
      const productExists = await Product.findById(id);
  
      if (!productExists) throw new Error('Product not found');
  
      const deletedProduct = await Product.findByIdAndDelete(id);
  
      revalidatePath('/admin/products');
  
      return {
        success: true,
        message: 'Product deleted successfully',
        data: JSON.parse(JSON.stringify(deletedProduct)),
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, error: errorResponse.message };
    }
}



// Create Product
export async function createProduct(data: z.infer<typeof insertProductSchema>): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
    try {
      // Check admin authorization
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
      }

      await connectDB();
      // Validate and create product
      const product = insertProductSchema.parse(data);
      
      // Check if trying to set isFirstPage to true
      if (product.isFirstPage) {
        const firstPageCount = await Product.countDocuments({ isFirstPage: true });
        
        if (firstPageCount >= FIRST_PAGE_PRODUCTS_LIMIT) {
          return {
            success: false,
            message: `Cannot add more products to first page. Limit of ${FIRST_PAGE_PRODUCTS_LIMIT} reached. Please set one product as not on first page first.`,
          };
        }
      }
      
      const createdProduct = await Product.create(product);
  
      revalidatePath('/admin/products');
  
      return {
        success: true,
        message: 'Product created successfully',
        data: JSON.parse(JSON.stringify(createdProduct)),
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, error: errorResponse.message };
    }
  }

  

// Update Product
export async function updateProduct(data: z.infer<typeof updateProductSchema>): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
    try {
      // Check admin authorization
      const authCheck = await checkAdminAuth();
      if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
      }

      await connectDB();
      // Validate and find product
      const product = updateProductSchema.parse(data);
      const productExists = await Product.findById(product.id);
  
      if (!productExists) throw new Error('Product not found');
  
      // Check if trying to set isFirstPage to true when it wasn't before
      if (product.isFirstPage && !productExists.isFirstPage) {
        const firstPageCount = await Product.countDocuments({ isFirstPage: true });
        
        if (firstPageCount >= FIRST_PAGE_PRODUCTS_LIMIT) {
          return {
            success: false,
            message: `Cannot add more products to first page. Limit of ${FIRST_PAGE_PRODUCTS_LIMIT} reached. Please set one product as not on first page first.`,
          };
        }
      }
  
      // Update product
      const updatedProduct = await Product.findByIdAndUpdate(product.id, product, { new: true });
  
      revalidatePath('/admin/products');
  
      return {
        success: true,
        message: 'Product updated successfully',
        data: JSON.parse(JSON.stringify(updatedProduct)),
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, error: errorResponse.message };
    }
  }


// Get single product by id
export async function getProductById(productId: string) {
  await connectDB();
  const data = await Product.findById(productId);
  if (!data) return null;
  
  const plainProduct = data.toObject();
  
  // Convert crafter to plain object if it exists
  if (plainProduct.crafter) {
    plainProduct.crafter = {
      id: plainProduct.crafter._id?.toString() || plainProduct.crafter.id,
      name: plainProduct.crafter.name
    };
  }
  
  return {
    ...plainProduct,
    _id: String(plainProduct._id), // Convert ObjectId to string
    price: plainProduct.price.toString(),
    costPrice: plainProduct.costPrice?.toString() || '0',
    rating: plainProduct.rating?.toString() || '0',
    createdAt: plainProduct.createdAt.toString(),
    updatedAt: plainProduct.updatedAt?.toString(),
    images: plainProduct.images || [],
    banner: plainProduct.banner ?? null, // Convert undefined to null
  };
}


// Get all crafters for drag-and-drop (ADMIN ONLY)
export async function getAllCraftersForDrop() {
  await connectDB();
  const Crafter = mongoose.models.Crafter;
  
  const crafters = await Crafter.find({ isActive: true })
    .select('_id name')
    .lean()
    .exec();
    
  const result = crafters.map((crafter: any) => ({
    id: crafter._id.toString(),
    name: crafter.name,
  }));
  
  //console.log('All crafters for drop:', result);
  return result;
}

// Get all the categories
export async function getAllCategories() {
    await connectDB();
    const data = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', _count: '$count', _id: 0 } }
    ]).sort({ category: 1 });
    return data.map(item => ({ category: item.category, _count: { count: item.count } }));
}


// Get featured products
export async function getFeaturedProducts() {
    await connectDB();
    const data = await Product.find({ isFeatured: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .exec();
    
    return data.map((p) => {
      const obj = p.toObject();
      return {
        ...obj,
        _id: String(obj._id), // More robust conversion to string
        price: p.price.toString(),
        rating: p.rating?.toString() || '0',
        createdAt: p.createdAt.toString(),
        updatedAt: obj.updatedAt?.toString(),
        images: p.images || [],
        crafter: obj.crafter ? obj.crafter.toString() : null,
      };
    });
}


// Toggle product isFirstPage status (ADMIN ONLY)
export async function toggleProductFirstPage(productId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      await connectDB();
      const product = await Product.findById(productId);
  
      if (!product) throw new Error('Product not found');
  
      // If trying to set to true, check the limit
      if (!product.isFirstPage) {
        const firstPageCount = await Product.countDocuments({ isFirstPage: true });
        
        if (firstPageCount >= FIRST_PAGE_PRODUCTS_LIMIT) {
          return {
            success: false,
            message: `Cannot add more products to first page. Limit of ${FIRST_PAGE_PRODUCTS_LIMIT} reached. Please remove one product from first page first.`,
          };
        }
      }
  
      // Toggle the status
      await Product.findByIdAndUpdate(productId, { isFirstPage: !product.isFirstPage });
  
      revalidatePath('/admin/products');
  
      return {
        success: true,
        message: product.isFirstPage 
          ? 'Product removed from first page' 
          : 'Product added to first page',
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return { success: false, error: errorResponse.message };
    }
}

// Update Product Crafter (ADMIN ONLY)
export async function updateProductCrafter(productId: string, crafterId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate input
    if (!productId || !crafterId) {
      return { success: false, error: 'Product ID and Crafter ID are required' };
    }

    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await connectDB();
    
    // Handle unassigned case
    const updateData = crafterId === 'unassigned' 
      ? { crafter: null } 
      : { crafter: crafterId };
    
    // Update the product's crafter
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return { success: false, error: 'Product not found' };
    }

    const message = crafterId === 'unassigned' 
      ? 'Product unassigned successfully' 
      : 'Product moved to new crafter successfully';

    return {
      success: true,
      message,
    };
  } catch (error) {
    const errorResponse = formatError(error);
    return { success: false, error: errorResponse.message };
  }
}

// Delete Product Images from UploadThing (ADMIN ONLY)
export async function deleteProductImages(images: string[]): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate input
    if (!Array.isArray(images) || images.length === 0) {
      return { success: false, error: 'No images provided for deletion' };
    }

    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    // Validate all URLs are strings
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

    // Delete files from UploadThing
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
  data: Product[] | null;
}> {
  try {
    // Get linked crafter ID from auth-utils
    const { getLinkedCrafterId } = await import('@/lib/auth-utils');
    const crafterId = await getLinkedCrafterId();
    
    if (!crafterId) {
      return {
        success: false,
        message: 'No crafter account linked to your user',
        data: null
      };
    }
    
    // Get all products for this crafter
    await connectDB();
    const products = await Product.find({ crafter: crafterId })
      .populate('category', 'name')
      .populate('crafter', 'name')
      .sort({ createdAt: -1 });
    
    // Serialize products for client components
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
    //console.log('[UPDATE AVAILABILITY] Starting update for product:', productId, 'availability:', availability);
    
    // Get linked crafter ID
    const { getLinkedCrafterId } = await import('@/lib/auth-utils');
    const crafterId = await getLinkedCrafterId();
    
    //console.log('[UPDATE AVAILABILITY] Crafter ID:', crafterId);
    
    if (!crafterId) {
      return {
        success: false,
        message: 'No crafter account linked to your user'
      };
    }
    
    // Validate availability value
    if (availability < -1) {
      return {
        success: false,
        message: 'Invalid availability value'
      };
    }
    
    await connectDB();
    
    // Find product and verify it belongs to this crafter
    //console.log('[UPDATE AVAILABILITY] Finding product by ID:', productId);
    const product = await Product.findById(productId);
    
    //console.log('[UPDATE AVAILABILITY] Product found:', product ? 'Yes' : 'No');
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }
    
    //console.log('[UPDATE AVAILABILITY] Product crafter:', product.crafter?.toString());
    //console.log('[UPDATE AVAILABILITY] Expected crafter:', crafterId);
    
    if (product.crafter?.toString() !== crafterId) {
      return {
        success: false,
        message: 'You can only update your own products'
      };
    }
    
    // Update only the availability field
    //console.log('[UPDATE AVAILABILITY] Updating availability from', product.availability, 'to', availability);
    product.availability = availability;
    await product.save();
    
    //console.log('[UPDATE AVAILABILITY] Product saved successfully');
    
    revalidatePath('/crafter/availability');
    revalidatePath('/crafter/products');
    
    return {
      success: true,
      message: 'Availability updated successfully'
    };
  } catch (error) {
    //console.error('Error updating product availability:', error);
    return {
      success: false,
      message: 'Failed to update availability'
    };
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
    // Get linked crafter ID
    const { getLinkedCrafterId } = await import('@/lib/auth-utils');
    const crafterId = await getLinkedCrafterId();
    
    if (!crafterId) {
      return {
        success: false,
        message: 'No crafter account linked to your user'
      };
    }
    
    // Validate costPrice value
    if (costPrice < 0) {
      return {
        success: false,
        message: 'Cost price must be 0 or greater'
      };
    }
    
    await connectDB();
    
    // Find product and verify it belongs to this crafter
    const product = await Product.findById(productId);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }
    
    if (product.crafter?.toString() !== crafterId) {
      return {
        success: false,
        message: 'You can only update your own products'
      };
    }
    
    // Update costPrice and set review flag using updateOne
    await Product.updateOne(
      { _id: productId },
      { 
        $set: {
          costPrice: costPrice,
          priceNeedsReview: true,
          lastCostPriceUpdate: new Date()
        }
      }
    );
    
    revalidatePath('/crafter');
    revalidatePath('/admin/products');
    
    return {
      success: true,
      message: 'Cost price updated successfully'
    };
  } catch (error) {
    console.error('Error updating product cost price:', error);
    return {
      success: false,
      message: 'Failed to update cost price'
    };
  }
}

/**
 * Mark product price as reviewed (ADMIN ONLY)
 * Clears the priceNeedsReview flag after admin has reviewed the cost price change
 */
export async function markPriceAsReviewed(productId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, message: authCheck.error || 'Unauthorized' };
    }

    await connectDB();
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }
    
    // Clear the review flag
    product.priceNeedsReview = false;
    await product.save();
    
    revalidatePath('/admin/products');
    
    return {
      success: true,
      message: 'Price marked as reviewed'
    };
  } catch (error) {
    console.error('Error marking price as reviewed:', error);
    return {
      success: false,
      message: 'Failed to mark price as reviewed'
    };
  }
}

/**
 * Get all products for a specific crafter by crafterId
 * @param crafterId - The crafter's ID
 */
export async function getProductsByCrafterId(crafterId: string): Promise<{
  success: boolean;
  message: string;
  data: Product[] | null;
}> {
  try {
    await connectDB();
    const products = await Product.find({ crafter: crafterId })
      .populate('category', 'name')
      .populate('crafter', 'name')
      .sort({ createdAt: -1 });
    
    // Serialize products for client components
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
  await connectDB();

  const limit = PAGE_SIZE;

  // Build the filter object for products
  const productFilter: {
    name?: { $regex: string; $options: string };
    crafter?: string;
  } = {};
  
  // Query filter
  if (query && query !== 'all') {
    productFilter.name = { $regex: query, $options: 'i' };
  }

  // Crafter filter
  if (crafterId && crafterId !== 'all') {
    productFilter.crafter = crafterId;
  }

  // Get products with pagination
  const [products, dataCount] = await Promise.all([
    Product.find(productFilter)
      .populate({
        path: 'crafter',
        select: 'name',
        model: 'Crafter'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    Product.countDocuments(productFilter)
  ]);

  // Serialize products
  const serializedProducts = products
    .filter(product => product && product._id) // Filter out any invalid products
    .map((product) => {
      const productObj = product.toObject();
      const crafterObj = productObj.crafter as any;
      const productId = productObj._id ? String(productObj._id) : String(product._id);
      
      if (!productId || productId === 'undefined') {
        console.error('Product without valid ID:', product);
        return null;
      }
      
      return {
        _id: productId,
        id: productId,
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price ? product.price.toString() : '0',
        costPrice: product.costPrice || 0,
        priceNeedsReview: product.priceNeedsReview || false,
        lastCostPriceUpdate: product.lastCostPriceUpdate?.toString() || null,
        availability: product.availability !== undefined ? product.availability : 0,
        isActive: product.isActive !== undefined ? product.isActive : true,
        isFirstPage: product.isFirstPage || false,
        rating: product.rating?.toString() || '0',
        createdAt: product.createdAt ? product.createdAt.toString() : '',
        images: product.images || [],
        crafter: crafterObj ? {
          id: crafterObj._id?.toString() || crafterObj.id,
          name: crafterObj.name
        } : null,
      };
    })
    .filter(Boolean); // Remove any null entries

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
    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, message: authCheck.error || 'Unauthorized' };
    }

    await connectDB();
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }
    
    // Toggle the isActive status
    product.isActive = !product.isActive;
    await product.save();
    
    revalidatePath('/admin/products');
    
    return {
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: product.isActive
    };
  } catch (error) {
    console.error('Error toggling product active status:', error);
    return {
      success: false,
      message: 'Failed to toggle product status'
    };
  }
}

