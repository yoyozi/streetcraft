'use server';

import { connectDB, Crafter } from '../mongodb/models';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schemas
const crafterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  profileImage: z.string().optional(),
});

const updateCrafterSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  mobile: z.string().min(10).optional(),
  profileImage: z.string().optional(),
});

// Helper to check admin authorization
async function checkAdminAuth() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return { authorized: false, error: 'Unauthorized: Admin access required' };
  }
  return { authorized: true };
}

// CREATE CRAFTER (Admin only)
export async function createCrafter(data: z.infer<typeof crafterSchema>) {
  try {
    console.log('Create crafter - Data:', data);

    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    // Validate input
    const validation = crafterSchema.safeParse(data);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || 'Validation failed' 
      };
    }

    console.log('Validated data:', validation.data);

    // Connect to database
    await connectDB();

    // Create crafter
    const crafter = await Crafter.create({
      ...validation.data,
      products: [],
      isActive: true,
    });

    console.log('Created crafter:', crafter);

    revalidatePath('/admin/crafters');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(crafter)),
    };
  } catch (error) {
    console.error('Create crafter error:', error);
    return { success: false, error: `Failed to create crafter: ${error}` };
  }
}

// UPDATE CRAFTER (Admin only)
export async function updateCrafter(
  id: string,
  data: z.infer<typeof updateCrafterSchema>
) {
  try {
    console.log('Update crafter - ID:', id);
    console.log('Update crafter - Data:', data);

    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    // Validate input
    const validatedData = updateCrafterSchema.parse(data);
    console.log('Validated data:', validatedData);

    // Connect to database
    await connectDB();

    // Update crafter
    const crafter = await Crafter.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true }
    );

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    console.log('Updated crafter:', crafter);

    revalidatePath('/admin/crafters');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(crafter)),
    };
  } catch (error) {
    console.error('Update crafter error:', error);
    return { success: false, error: `Failed to update crafter: ${error}` };
  }
}

// TOGGLE CRAFTER STATUS (Admin only)
export async function toggleCrafterStatus(id: string, isActive: boolean) {
  try {
    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    // Connect to database
    await connectDB();

    // Update crafter status
    const crafter = await Crafter.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    );

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    revalidatePath('/admin/crafters');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(crafter)),
    };
  } catch {
    return { success: false, error: 'Failed to update crafter status' };
  }
}

// GET ALL CRAFTERS
export async function getAllCrafters(filter?: { isActive?: boolean }) {
  try {
    await connectDB();
    const Product = (await import('../mongodb/models')).Product;

    const query = filter?.isActive !== undefined ? { isActive: filter.isActive } : {};

    const crafters = await Crafter.find(query).sort({ name: 1 }).lean();

    // Add product count and linked user for each crafter
    const craftersWithDetails = await Promise.all(
      crafters.map(async (crafter) => {
        const productCount = await Product.countDocuments({ crafter: crafter._id });
        
        // Find linked craft user
        const User = (await import('../mongodb/models')).User;
        const linkedUser = await User.findOne({ 
          crafterId: crafter._id,
          role: 'craft'
        }).select('id name email').lean();
        
        return {
          ...crafter,
          _id: crafter._id.toString(),
          productCount,
          linkedUser: linkedUser ? {
            id: linkedUser.id?.toString() || linkedUser._id?.toString(),
            name: linkedUser.name,
            email: linkedUser.email
          } : null,
          createdAt: crafter.createdAt.toString(),
          updatedAt: crafter.updatedAt.toString(),
        };
      })
    );

    return {
      success: true,
      data: JSON.parse(JSON.stringify(craftersWithDetails)),
    };
  } catch {
    return { success: false, error: 'Failed to fetch crafters', data: [] };
  }
}

// GET CRAFTER BY ID
export async function getCrafterById(id: string) {
  try {
    await connectDB();

    const crafter = await Crafter.findById(id).lean();

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    return {
      success: true,
      data: {
        ...crafter,
        _id: crafter._id.toString(),
        id: crafter._id.toString(),
        productCount: crafter.products?.length || 0,
        createdAt: crafter.createdAt.toString(),
        updatedAt: crafter.updatedAt.toString(),
      },
    };
  } catch {
    return { success: false, error: 'Crafter not found' };
  }
}

// DELETE CRAFTER (Admin only)
export async function deleteCrafter(id: string) {
  try {
    // Check admin authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    // Connect to database
    await connectDB();

    // Delete crafter
    const crafter = await Crafter.findByIdAndDelete(id);

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    revalidatePath('/admin/crafters');

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete crafter' };
  }
}
