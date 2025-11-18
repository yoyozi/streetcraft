/**
 * Product Image Management - TDD Tests
 * 
 * Tests for UploadThing integration:
 * - Upload images when creating/updating products
 * - Delete images from UploadThing when product is deleted
 * - Handle multiple images per product
 * - Clean up orphaned images
 * 
 * Test Coverage:
 * - uploadProductImages (admin only)
 * - deleteProductImages (admin only, triggered on product delete)
 * - deleteProduct with image cleanup
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
}));

// Mock UploadThing UTApi for file deletion
jest.mock('uploadthing/server', () => ({
  UTApi: jest.fn().mockImplementation(() => ({
    deleteFiles: jest.fn(),
  })),
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { auth } from '@/lib/actions/auth-actions';
import { Product } from '@/lib/mongodb/models';
import { UTApi } from 'uploadthing/server';

// Import the actions we'll be testing
import {
  deleteProduct,
  deleteProductImages,
} from '@/lib/actions/product.actions';

describe.skip('Product Image Management - TDD', () => {
  let mockUtapi: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUtapi = new UTApi();
  });

  describe('deleteProductImages', () => {
    it('should fail - action does not exist yet', () => {
      expect(deleteProductImages).toBeDefined();
    });

    it('should delete images from UploadThing given image URLs', async () => {
      const imageUrls = [
        'https://utfs.io/f/abc123.png',
        'https://utfs.io/f/def456.jpg',
        'https://utfs.io/f/ghi789.webp',
      ];

      mockUtapi.deleteFiles.mockResolvedValue({ success: true });

      const result = await deleteProductImages(imageUrls);

      expect(result.success).toBe(true);
      expect(mockUtapi.deleteFiles).toHaveBeenCalledWith([
        'abc123.png',
        'def456.jpg',
        'ghi789.webp',
      ]);
    });

    it('should extract file keys from UploadThing URLs correctly', async () => {
      const imageUrls = [
        'https://utfs.io/f/my-file-key-123.png',
      ];

      mockUtapi.deleteFiles.mockResolvedValue({ success: true });

      await deleteProductImages(imageUrls);

      expect(mockUtapi.deleteFiles).toHaveBeenCalledWith([
        'my-file-key-123.png',
      ]);
    });

    it('should handle empty image array', async () => {
      const result = await deleteProductImages([]);

      expect(result.success).toBe(true);
      expect(mockUtapi.deleteFiles).not.toHaveBeenCalled();
    });

    it('should handle non-UploadThing URLs gracefully', async () => {
      const imageUrls = [
        '/images/local-image.png',
        'https://example.com/image.jpg',
      ];

      const result = await deleteProductImages(imageUrls);

      // Should not attempt to delete non-UploadThing URLs
      expect(result.success).toBe(true);
      expect(mockUtapi.deleteFiles).not.toHaveBeenCalled();
    });

    it('should handle UploadThing API errors', async () => {
      const imageUrls = ['https://utfs.io/f/abc123.png'];

      mockUtapi.deleteFiles.mockRejectedValue(new Error('UploadThing API error'));

      const result = await deleteProductImages(imageUrls);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete images');
    });
  });

  describe('deleteProduct with image cleanup', () => {
    it('should delete product and its images from UploadThing', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product with images
      const mockProduct = {
        _id: 'product-123',
        name: 'Product with Images',
        images: [
          'https://utfs.io/f/image1.png',
          'https://utfs.io/f/image2.jpg',
        ],
      };

      (Product.findById as jest.MockedFunction<any>).mockResolvedValue(mockProduct);
      (Product.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue(mockProduct);
      mockUtapi.deleteFiles.mockResolvedValue({ success: true });

      const result = await deleteProduct('product-123');

      expect(result.success).toBe(true);
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('product-123');
      expect(mockUtapi.deleteFiles).toHaveBeenCalledWith([
        'image1.png',
        'image2.jpg',
      ]);
    });

    it('should delete product even if image deletion fails', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product with images
      const mockProduct = {
        _id: 'product-123',
        name: 'Product with Images',
        images: ['https://utfs.io/f/image1.png'],
      };

      (Product.findById as jest.MockedFunction<any>).mockResolvedValue(mockProduct);
      (Product.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue(mockProduct);
      mockUtapi.deleteFiles.mockRejectedValue(new Error('UploadThing error'));

      const result = await deleteProduct('product-123');

      // Product should still be deleted even if image cleanup fails
      expect(result.success).toBe(true);
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('product-123');
    });

    it('should handle product with no images', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product without images
      const mockProduct = {
        _id: 'product-123',
        name: 'Product without Images',
        images: [],
      };

      (Product.findById as jest.MockedFunction<any>).mockResolvedValue(mockProduct);
      (Product.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue(mockProduct);

      const result = await deleteProduct('product-123');

      expect(result.success).toBe(true);
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('product-123');
      expect(mockUtapi.deleteFiles).not.toHaveBeenCalled();
    });

    it('should handle product with mixed image sources', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product with mixed image sources
      const mockProduct = {
        _id: 'product-123',
        name: 'Product with Mixed Images',
        images: [
          'https://utfs.io/f/uploadthing-image.png',
          '/images/local-image.jpg',
          'https://example.com/external-image.png',
        ],
      };

      (Product.findById as jest.MockedFunction<any>).mockResolvedValue(mockProduct);
      (Product.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue(mockProduct);
      mockUtapi.deleteFiles.mockResolvedValue({ success: true });

      const result = await deleteProduct('product-123');

      expect(result.success).toBe(true);
      // Should only delete UploadThing images
      expect(mockUtapi.deleteFiles).toHaveBeenCalledWith([
        'uploadthing-image.png',
      ]);
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
      expect(mockUtapi.deleteFiles).not.toHaveBeenCalled();
    });

    it('should fail when product does not exist', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock product not found
      (Product.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await deleteProduct('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
      expect(mockUtapi.deleteFiles).not.toHaveBeenCalled();
    });
  });

  describe('Image URL validation', () => {
    it('should correctly identify UploadThing URLs', () => {
      const uploadThingUrls = [
        'https://utfs.io/f/abc123.png',
        'https://uploadthing.com/f/def456.jpg',
        'https://utfs.io/f/my-file-key.webp',
      ];

      uploadThingUrls.forEach(url => {
        expect(url).toMatch(/utfs\.io\/f\/|uploadthing\.com\/f\//);
      });
    });

    it('should correctly identify non-UploadThing URLs', () => {
      const nonUploadThingUrls = [
        '/images/local-image.png',
        'https://example.com/image.jpg',
        'https://cdn.example.com/product.png',
      ];

      nonUploadThingUrls.forEach(url => {
        expect(url).not.toMatch(/utfs\.io\/f\/|uploadthing\.com\/f\//);
      });
    });
  });

  describe('Batch image deletion', () => {
    it('should handle deletion of multiple products with images', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      const products = [
        {
          _id: 'product-1',
          images: ['https://utfs.io/f/img1.png', 'https://utfs.io/f/img2.png'],
        },
        {
          _id: 'product-2',
          images: ['https://utfs.io/f/img3.png'],
        },
      ];

      for (const product of products) {
        (Product.findById as jest.MockedFunction<any>).mockResolvedValue(product);
        (Product.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue(product);
        mockUtapi.deleteFiles.mockResolvedValue({ success: true });

        await deleteProduct(product._id);
      }

      expect(mockUtapi.deleteFiles).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed UploadThing URLs', async () => {
      const malformedUrls = [
        'https://utfs.io/f/',
        'https://utfs.io/f',
        'https://utfs.io/',
      ];

      const result = await deleteProductImages(malformedUrls);

      // Should handle gracefully without crashing
      expect(result.success).toBe(true);
    });

    it('should handle very long image arrays', async () => {
      const manyImages = Array.from({ length: 100 }, (_, i) => 
        `https://utfs.io/f/image-${i}.png`
      );

      mockUtapi.deleteFiles.mockResolvedValue({ success: true });

      const result = await deleteProductImages(manyImages);

      expect(result.success).toBe(true);
      expect(mockUtapi.deleteFiles).toHaveBeenCalled();
    });

    it('should handle null or undefined image arrays', async () => {
      const result1 = await deleteProductImages(null as any);
      const result2 = await deleteProductImages(undefined as any);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockUtapi.deleteFiles).not.toHaveBeenCalled();
    });
  });
});
