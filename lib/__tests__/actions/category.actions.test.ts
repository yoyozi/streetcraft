/**
 * Category Actions - TDD Tests
 * 
 * Following TDD methodology:
 * 1. Write failing tests first
 * 2. Implement actions to pass tests
 * 3. Refactor as needed
 * 
 * Test Coverage:
 * - createCategory (admin only)
 * - updateCategory (admin only)
 * - deleteCategory (admin only)
 * - getAllCategories (public)
 * - getCategoryById (public)
 * - toggleCategoryStatus (admin only)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock auth module BEFORE any imports
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock auth actions
jest.mock('@/lib/actions/auth-actions', () => ({
  auth: jest.fn(),
  verifyAdmin: jest.fn(),
}));

// Mock database connection and models
jest.mock('@/lib/mongodb/models', () => ({
  connectDB: jest.fn(),
  Category: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
  Product: {
    countDocuments: jest.fn(),
  },
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { auth } from '@/lib/actions/auth-actions';
import { Category, Product } from '@/lib/mongodb/models';

// Import the actions we'll be testing (these don't exist yet - TDD!)
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  toggleCategoryStatus,
} from '@/lib/actions/category.actions';

describe('Category Actions - TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'Material',
      description: 'Items sewed and stitched out of cloth',
    };

    it('should fail - action does not exist yet', () => {
      expect(createCategory).toBeDefined();
    });

    it('should create category when user is admin', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category creation
      const mockCategory = {
        _id: 'category-123',
        ...validCategoryData,
        isActive: true,
        createdAt: new Date(),
        toObject: () => ({ id: 'category-123', ...validCategoryData, isActive: true }),
      };

      (Category.create as jest.MockedFunction<any>).mockResolvedValue(mockCategory);

      const result = await createCategory(validCategoryData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Material');
      expect(result.data?.isActive).toBe(true);
      expect(Category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Material',
          description: 'Items sewed and stitched out of cloth',
          isActive: true,
        })
      );
    });

    it('should fail when user is not admin', async () => {
      // Mock non-admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'user-id', role: 'user' },
      } as any);

      const result = await createCategory(validCategoryData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(Category.create).not.toHaveBeenCalled();
    });

    it('should fail with invalid data', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      const invalidData = {
        name: 'AB', // Too short
        description: 'T', // Too short
      };

      const result = await createCategory(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(Category.create).not.toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      const result = await createCategory({ name: '', description: '' } as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateCategory', () => {
    const updateData = {
      id: 'category-123',
      name: 'Updated Material',
      description: 'Updated description for material items',
    };

    it('should fail - action does not exist yet', () => {
      expect(updateCategory).toBeDefined();
    });

    it('should update category when user is admin', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category exists
      (Category.findById as jest.MockedFunction<any>).mockResolvedValue({
        _id: 'category-123',
        name: 'Old Material',
      });

      // Mock update
      const mockUpdatedCategory = {
        _id: 'category-123',
        ...updateData,
        toObject: () => ({ id: 'category-123', ...updateData }),
      };

      (Category.findByIdAndUpdate as jest.MockedFunction<any>).mockResolvedValue(
        mockUpdatedCategory
      );

      const result = await updateCategory(updateData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Material');
      expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
        'category-123',
        expect.objectContaining({
          name: 'Updated Material',
          description: 'Updated description for material items',
        }),
        { new: true }
      );
    });

    it('should fail when user is not admin', async () => {
      // Mock non-admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'user-id', role: 'user' },
      } as any);

      const result = await updateCategory(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(Category.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should fail when category does not exist', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category not found
      (Category.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await updateCategory(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(Category.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('toggleCategoryStatus', () => {
    it('should fail - action does not exist yet', () => {
      expect(toggleCategoryStatus).toBeDefined();
    });

    it('should toggle category status when user is admin', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category exists
      const mockCategory = {
        _id: 'category-123',
        name: 'Material',
        isActive: true,
      };

      (Category.findById as jest.MockedFunction<any>).mockResolvedValue(mockCategory);

      // Mock update
      const mockUpdatedCategory = {
        ...mockCategory,
        isActive: false,
        toObject: () => ({ id: 'category-123', name: 'Material', isActive: false }),
      };

      (Category.findByIdAndUpdate as jest.MockedFunction<any>).mockResolvedValue(
        mockUpdatedCategory
      );

      const result = await toggleCategoryStatus('category-123');

      expect(result.success).toBe(true);
      expect(result.data?.isActive).toBe(false);
      expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
        'category-123',
        { isActive: false },
        { new: true }
      );
    });

    it('should fail when user is not admin', async () => {
      // Mock non-admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'user-id', role: 'user' },
      } as any);

      const result = await toggleCategoryStatus('category-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(Category.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should fail when category does not exist', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category not found
      (Category.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await toggleCategoryStatus('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(Category.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getAllCategories', () => {
    it('should fail - action does not exist yet', () => {
      expect(getAllCategories).toBeDefined();
    });

    it('should return all categories', async () => {
      const mockCategories = [
        {
          _id: 'category-1',
          name: 'Material',
          description: 'Items sewed and stitched out of cloth',
          isActive: true,
          toObject: () => ({ id: 'category-1', name: 'Material', isActive: true }),
        },
        {
          _id: 'category-2',
          name: 'Beadwork',
          description: 'Items made using wire and beads',
          isActive: true,
          toObject: () => ({ id: 'category-2', name: 'Beadwork', isActive: true }),
        },
      ];

      (Category.find as jest.MockedFunction<any>).mockResolvedValue(mockCategories);

      const result = await getAllCategories();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Material');
      expect(result.data?.[1].name).toBe('Beadwork');
    });

    it('should filter by active status', async () => {
      const mockActiveCategories = [
        {
          _id: 'category-1',
          name: 'Material',
          isActive: true,
          toObject: () => ({ id: 'category-1', name: 'Material', isActive: true }),
        },
      ];

      (Category.find as jest.MockedFunction<any>).mockResolvedValue(mockActiveCategories);

      const result = await getAllCategories({ isActive: true });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(Category.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('should return empty array when no categories exist', async () => {
      (Category.find as jest.MockedFunction<any>).mockResolvedValue([]);

      const result = await getAllCategories();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getCategoryById', () => {
    it('should fail - action does not exist yet', () => {
      expect(getCategoryById).toBeDefined();
    });

    it('should return category by ID', async () => {
      const mockCategory = {
        _id: 'category-123',
        name: 'Material',
        description: 'Items sewed and stitched out of cloth',
        isActive: true,
        toObject: () => ({
          id: 'category-123',
          name: 'Material',
          description: 'Items sewed and stitched out of cloth',
          isActive: true,
        }),
      };

      (Category.findById as jest.MockedFunction<any>).mockResolvedValue(mockCategory);

      const result = await getCategoryById('category-123');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Material');
      expect(Category.findById).toHaveBeenCalledWith('category-123');
    });

    it('should return error for non-existent category', async () => {
      (Category.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await getCategoryById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('deleteCategory', () => {
    it('should fail - action does not exist yet', () => {
      expect(deleteCategory).toBeDefined();
    });

    it('should delete category when user is admin and no products exist', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category exists
      (Category.findById as jest.MockedFunction<any>).mockResolvedValue({
        _id: 'category-123',
        name: 'Material',
      });

      // Mock no products in this category
      (Product.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0);

      (Category.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue({
        _id: 'category-123',
      });

      const result = await deleteCategory('category-123');

      expect(result.success).toBe(true);
      expect(Category.findByIdAndDelete).toHaveBeenCalledWith('category-123');
    });

    it('should fail when user is not admin', async () => {
      // Mock non-admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'user-id', role: 'user' },
      } as any);

      const result = await deleteCategory('category-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should fail when category has products', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category exists
      (Category.findById as jest.MockedFunction<any>).mockResolvedValue({
        _id: 'category-123',
        name: 'Material',
      });

      // Mock products exist in this category
      (Product.countDocuments as jest.MockedFunction<any>).mockResolvedValue(5);

      const result = await deleteCategory('category-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot delete category with existing products');
      expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should fail when category does not exist', async () => {
      // Mock admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      // Mock category not found
      (Category.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await deleteCategory('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
