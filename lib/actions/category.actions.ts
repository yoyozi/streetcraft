'use server';

import { connectDB, Category } from '../mongodb/models';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { categorySchema } from '../validators';

// Helper to check admin authorization
async function checkAdminAuth() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return { authorized: false, error: 'Unauthorized: Admin access required' };
  }
  return { authorized: true };
}

export async function createCategory(data: { name: string; description: string }) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = categorySchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || 'Validation failed' 
      };
    }

    await connectDB();

    const category = await Category.create({
      ...validation.data,
      isActive: true,
    });

    revalidatePath('/admin/categories');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(category)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create category' };
  }
}

export async function updateCategory(id: string, data: { name?: string; description?: string }) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await connectDB();

    const category = await Category.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    revalidatePath('/admin/categories');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(category)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update category' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await connectDB();

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    revalidatePath('/admin/categories');

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete category' };
  }
}

export async function getAllCategories(options?: { isActive?: boolean }) {
  try {
    await connectDB();

    const filter = options?.isActive !== undefined ? { isActive: options.isActive } : {};
    const categories = await Category.find(filter).sort({ createdAt: -1 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(categories)),
    };
  } catch (error: any) {
    return { success: false, data: [], error: error.message || 'Failed to fetch categories' };
  }
}

export async function getCategoryById(id: string) {
  try {
    await connectDB();

    const category = await Category.findById(id);

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(category)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch category' };
  }
}

export async function toggleCategoryStatus(id: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await connectDB();

    const category = await Category.findById(id);

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    category.isActive = !category.isActive;
    await category.save();

    revalidatePath('/admin/categories');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(category)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to toggle category status' };
  }
}
