/**
 * Product Actions - TDD Tests
 * 
 * Following TDD methodology:
 * 1. Write failing tests first
 * 2. Implement actions to pass tests
 * 3. Refactor as needed
 * 
 * Test Coverage:
 * - createProduct (admin only)
 * - updateProduct (admin only)
 * - deleteProduct (admin only)
 * - getAllProducts (public)
 * - getProductBySlug (public)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock auth module
jest.mock('@/lib/actions/auth-actions', () => ({
  auth: jest.fn(),
}));

// Mock database connection and models
jest.mock('@/lib/mongodb/models', () => ({
  connectDB: jest.fn(),
  Product: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  },
  Crafter: {
    findById: jest.fn(),
  },
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { auth } from '@/lib/actions/auth-actions';
import { Product, Crafter } from '@/lib/mongodb/models';

// Import the actions we'll be testing (these don't exist yet - TDD!)
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductBySlug,
} from '@/lib/actions/product.actions';

describe('Product Actions - TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const validProductData = {
      name: 'Test Product',
      slug: 'test-product',
      category: 'Test Category',
      brand: 'Test Brand',
      description: 'Test description for the product',
      price: '99.99',
      images: ['/images/test-product.jpg'],
      isFeatured: false,
      isFirstPage: false,
      banner: null,
      tags: ['organic', 'handmade'],
    };

    it('should fail - action does not exist yet', () => {
      expect(createProduct).toBeDefined();
    });

    it('should create product when user is admin', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock countDocuments for isFirstPage check
      (Product.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0);

      // Mock product creation
      const mockProduct = {
        _id: 'product-123',
        ...validProductData,
        rating: 0,
        numReviews: 0,
        createdAt: new Date(),
        toObject: () => ({ id: 'product-123', ...validProductData }),
      };

      (Product.create as jest.MockedFunction<any>).mockResolvedValue(mockProduct);

      const result = await createProduct(validProductData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Product');
      expect(Product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Product',
          slug: 'test-product',
          tags: ['organic', 'handmade'],
        })
      );
    });

    it('should fail when user is not admin', async () => {
      // Mock non-admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'user-id', role: 'user' },
      } as any);

      const result = await createProduct(validProductData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(Product.create).not.toHaveBeenCalled();
    });

    it('should fail with invalid data', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      const invalidData = {
        name: 'AB', // Too short
        slug: 'ab',
        category: 'T',
        brand: 'T',
        description: 'T',
        price: 'invalid',
        images: [], // Empty array
        isFeatured: false,
        isFirstPage: false,
        banner: null,
        tags: [],
      };

      const result = await createProduct(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(Product.create).not.toHaveBeenCalled();
    });

    it('should create product with tags normalized to lowercase', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      const dataWithMixedCaseTags = {
        ...validProductData,
        tags: ['Organic', 'HANDMADE', 'Natural'],
      };

      // Mock countDocuments for isFirstPage check
      (Product.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0);

      const mockProduct = {
        _id: 'product-123',
        ...dataWithMixedCaseTags,
        tags: ['organic', 'handmade', 'natural'], // Normalized
        toObject: () => ({ 
          id: 'product-123', 
          ...dataWithMixedCaseTags,
          tags: ['organic', 'handmade', 'natural'],
        }),
      };

      (Product.create as jest.MockedFunction<any>).mockResolvedValue(mockProduct);

      const result = await createProduct(dataWithMixedCaseTags);

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual(['organic', 'handmade', 'natural']);
    });
  });

  describe('updateProduct', () => {
    const updateData = {
      id: 'product-123',
      name: 'Updated Product',
      slug: 'updated-product',
      category: 'Updated Category',
      brand: 'Updated Brand',
      description: 'Updated description',
      price: '149.99',
      images: ['/images/updated-product.jpg'],
      isFeatured: true,
      isFirstPage: true,
      banner: '/images/banner.jpg',
      tags: ['premium', 'featured'],
    };

    it('should fail - action does not exist yet', () => {
      expect(updateProduct).toBeDefined();
    });

    it('should update product when user is admin', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product exists
      (Product.findById as jest.MockedFunction<any>).mockResolvedValue({
        _id: 'product-123',
        name: 'Old Product',
        isFirstPage: false, // Not on first page initially
      });

      // Mock countDocuments for isFirstPage check
      (Product.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0);

      // Mock update
      const mockUpdatedProduct = {
        _id: 'product-123',
        ...updateData,
        toObject: () => ({ id: 'product-123', ...updateData }),
      };

      (Product.findByIdAndUpdate as jest.MockedFunction<any>).mockResolvedValue(
        mockUpdatedProduct
      );

      const result = await updateProduct(updateData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Product');
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'product-123',
        expect.objectContaining({
          name: 'Updated Product',
          tags: ['premium', 'featured'],
        }),
        { new: true }
      );
    });

    it('should fail when user is not admin', async () => {
      // Mock non-admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'user-id', role: 'user' },
      } as any);

      const result = await updateProduct(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should fail when product does not exist', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product not found
      (Product.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await updateProduct(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should fail - action does not exist yet', () => {
      expect(deleteProduct).toBeDefined();
    });

    it('should delete product when user is admin', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product exists
      (Product.findById as jest.MockedFunction<any>).mockResolvedValue({
        _id: 'product-123',
        name: 'Product to Delete',
      });

      (Product.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue({
        _id: 'product-123',
      });

      const result = await deleteProduct('product-123');

      expect(result.success).toBe(true);
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('product-123');
    });

    it('should fail when user is not admin', async () => {
      // Mock non-admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'user-id', role: 'user' },
      } as any);

      const result = await deleteProduct('product-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('getAllProducts', () => {
    it('should fail - action does not exist yet', () => {
      expect(getAllProducts).toBeDefined();
    });

    it('should return all products with pagination', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Product 1',
          price: 99.99,
          rating: 4.5,
          createdAt: new Date('2024-01-01'),
          tags: ['organic'],
          toObject: () => ({ id: 'product-1', name: 'Product 1', price: 99.99, rating: 4.5, createdAt: new Date('2024-01-01') }),
        },
        {
          _id: 'product-2',
          name: 'Product 2',
          price: 149.99,
          rating: 4.8,
          createdAt: new Date('2024-01-02'),
          tags: ['handmade'],
          toObject: () => ({ id: 'product-2', name: 'Product 2', price: 149.99, rating: 4.8, createdAt: new Date('2024-01-02') }),
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts),
      };

      (Product.find as jest.MockedFunction<any>).mockReturnValue(mockQuery);
      (Product.countDocuments as jest.MockedFunction<any>).mockResolvedValue(2);

      const result = await getAllProducts({
        query: 'all',
        category: 'all',
        page: 1,
      });

      expect(result.data).toHaveLength(2);
      expect(result.totalPages).toBe(1);
    });

    it('should filter products by search query', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Organic Soap',
          price: 29.99,
          rating: 4.2,
          createdAt: new Date('2024-01-01'),
          toObject: () => ({ id: 'product-1', name: 'Organic Soap', price: 29.99, rating: 4.2, createdAt: new Date('2024-01-01') }),
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts),
      };

      (Product.find as jest.MockedFunction<any>).mockReturnValue(mockQuery);
      (Product.countDocuments as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await getAllProducts({
        query: 'organic',
        category: 'all',
        page: 1,
      });

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          name: { $regex: 'organic', $options: 'i' },
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getProductBySlug', () => {
    it('should fail - action does not exist yet', () => {
      expect(getProductBySlug).toBeDefined();
    });

    it('should return product by slug', async () => {
      const mockProduct = {
        _id: 'product-123',
        name: 'Test Product',
        slug: 'test-product',
        price: 49.99,
        rating: 4.7,
        createdAt: new Date('2024-01-01'),
        tags: ['organic', 'handmade'],
        toObject: () => ({
          id: 'product-123',
          name: 'Test Product',
          slug: 'test-product',
          price: 49.99,
          rating: 4.7,
          createdAt: new Date('2024-01-01'),
          tags: ['organic', 'handmade'],
        }),
      };

      (Product.findOne as jest.MockedFunction<any>).mockResolvedValue(mockProduct);

      const result = await getProductBySlug('test-product');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('test-product');
      expect(result?.tags).toEqual(['organic', 'handmade']);
      expect(Product.findOne).toHaveBeenCalledWith({ slug: 'test-product' });
    });

    it('should return null for non-existent slug', async () => {
      (Product.findOne as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await getProductBySlug('non-existent');

      expect(result).toBeNull();
    });
  });
});
