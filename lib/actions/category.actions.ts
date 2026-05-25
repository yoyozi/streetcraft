'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { categorySchema, updateCategorySchema } from '@/lib/validations/category';
import { checkAdminAuth } from './auth-actions';

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

    const category = await prisma.category.create({
      data: {
        ...validation.data,
        isActive: true,
      },
    });

    revalidatePath('/admin/categories');

    return { success: true, data: category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return { success: false, error: message };
  }
}

export async function updateCategory(id: string, data: { name?: string; description?: string }) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = updateCategorySchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || 'Validation failed' };
    }

    const category = await prisma.category.update({
      where: { id },
      data: validation.data,
    });

    revalidatePath('/admin/categories');

    return { success: true, data: category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update category';
    return { success: false, error: message };
  }
}

export async function deleteCategory(id: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath('/admin/categories');

    return { success: true, message: 'Category deleted successfully' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return { success: false, error: message };
  }
}

export async function getAllCategories(options?: { isActive?: boolean }) {
  try {
    const where = options?.isActive !== undefined ? { isActive: options.isActive } : {};

    const categories = await prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: categories };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    return { success: false, data: [], error: message };
  }
}

export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    return { success: true, data: category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch category';
    return { success: false, error: message };
  }
}

export async function toggleCategoryStatus(id: string) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });

    revalidatePath('/admin/categories');

    return { success: true, data: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to toggle category status';
    return { success: false, error: message };
  }
}
