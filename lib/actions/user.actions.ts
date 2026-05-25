'use server';

import { 
    signInFormSchema, 
    signUpFormSchema, 
    updateUserSchema } from "@/lib/validations/user";
import { ShippingAddressSchema, PaymentMethodSchema } from "@/lib/validations/order";

import { auth, signIn, signOut } from "@/auth"; // root-level import
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from '@/lib/prisma';
import { formatError } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';
import { hash } from 'bcrypt-ts-edge';
import { ActionResponse, ShippingAddress } from "@/types";
import { redirect } from "next/navigation";
import z from "zod";
import { PAGE_SIZE } from "../constants";
import { revalidatePath } from "next/cache";

// --- Sign in user with credentials ---
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const userData = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const callbackUrl = (formData.get('callbackUrl') as string) || '/';
  
    // Check if user requires password reset BEFORE signing in
    const user = await prisma.user.findUnique({ where: { email: userData.email } });
    
    if (user && user.requirePasswordReset) {
      await signIn('credentials', {
        email: userData.email,
        password: userData.password,
        redirect: true,
        redirectTo: '/reset-password',
      });
    } else {
      // Normal sign in flow - redirect based on role
      let redirectUrl = callbackUrl;
      
      // If callback is home page, redirect based on role
      if (callbackUrl === '/' && user) {
        if (user.role === 'craft') {
          redirectUrl = '/crafter';
        } else if (user.role === 'admin') {
          redirectUrl = '/admin';
        }
      }
      
      await signIn('credentials', {
        email: userData.email,
        password: userData.password,
        redirect: true,
        redirectTo: redirectUrl,
      });
    }
    
    return { 
      success: true, 
      message: 'Sign in successfull',
      redirectTo: callbackUrl
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[USER ACTIONS] Sign-in exception:", error);
    return { success: false, message: 'Invalid email or password' };
  }
}

// --- Sign user out ---
export async function signOutUser() {
  try {
    await signOut({ redirect: false });
    redirect('/');
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[USER ACTIONS] Sign-out exception:", error);
  }
}




// Sign up user
export async function signUpUser(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const hashedPassword = await hash(user.password, 10);
    const callbackUrl = formData.get('callbackUrl') as string || '/';

    // Create the user
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    await signIn('credentials', {
      email: user.email,
      password: user.password,
      redirect: true,
      redirectTo: callbackUrl,
    });

    return { 
      success: true, 
      message: 'User registered successfully',
      redirectTo: callbackUrl || '/'
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    const errorResponse = formatError(error);
    const errorMessage = typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse
      ? String(errorResponse.message)
      : 'An unknown error occurred';
    return { success: false, message: errorMessage };
  }
}



// In the shipping-address page we need to get the user by ID
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user;
  } catch (error) {
    console.error("[USER ACTIONS] Get user by ID exception:", error);
    return null;
  }
}

// Update users address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "User not found" };
    }

    const address = ShippingAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { address: address as any },
    });

    return { success: true, message: "Address updated successfully" };

  } catch (error) {
    return formatError(error);
  }
};

// Update the users payment method
export async function updateUserPaymentMethod(
  data: z.infer<typeof PaymentMethodSchema>
): Promise<ActionResponse> { 
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "User not found" };
    }

    const paymentMethod = PaymentMethodSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { paymentMethod: paymentMethod.type },
    });

    return { success: true, message: "Payment method updated successfully" };
    
  } catch (error) {
    return formatError(error);
  }

}

// To udate the user profile
export async function updateProfile( user: { name:string; email:string; }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "User not found" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: user.name },
    });

    return { success: true, message: "Profile updated successfully" };
    
  } catch (error) {
    return formatError(error);
  }
}
  

// Get all users with pagination support
// @param limit - Number of users to return per page (defaults to PAGE_SIZE)
// @param page - The current page number (1-based index)
// @returns Object containing user data and pagination info
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query = '',
}: {
  limit?: number;
  page: number;
  query?: string;
}) {
  // Build Prisma where filter
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, dataCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.user.count({ where }),
  ]);

  const serializedData = data.map(user => ({
    ...user,
    _id: user.id,
    id: user.id,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  }));

  return {
    data: serializedData,
    totalPages: Math.ceil(dataCount / limit),
  };
}


// Delete user by ID
export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> { 
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/users');
    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    const errorResponse = formatError(error);
    return {
      success: false,
      message: typeof errorResponse === 'string' ? errorResponse : errorResponse.message
    };
  }
}


// Create user (Admin only)
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: typeof USER_ROLES[number];
  requirePasswordReset?: boolean;
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    const hashedPassword = await hash(userData.password, 10);

    await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: hashedPassword,
        requirePasswordReset: userData.requirePasswordReset || false,
      },
    });

    revalidatePath('/admin/users');
    
    return {
      success: true,
      message: 'User created successfully',
    };
    
  } catch (error) {
    const errorResponse = formatError(error);
    return {
      success: false,
      message: typeof errorResponse === 'string' ? errorResponse : errorResponse.message
    };
  }
}

// Update a user by admin
export async function updateUser(user: z.infer<typeof updateUserSchema>): Promise<{ success: boolean; message: string }> {
  try {
    // Prepare update data (exclude id from update)
    const updateData: {
      name: string;
      email: string;
      role: string;
      isActive?: boolean;
      requirePasswordReset?: boolean;
      password?: string;
    } = {
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (user.isActive !== undefined) {
      updateData.isActive = user.isActive;
    }

    if (user.requirePasswordReset !== undefined) {
      updateData.requirePasswordReset = user.requirePasswordReset;
    }

    if (user.password && user.password.trim() && user.password.length > 0) {
      const hashedPassword = await hash(user.password, 10);
      updateData.password = hashedPassword;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    revalidatePath('/admin/users');
    
    return {
      success: true,
      message: 'User updated successfully',
    };
    
  } catch (error) {
    const errorResponse = formatError(error);
    return {
      success: false,
      message: errorResponse.message
    };
  }
}

// Link a user to a crafter
export async function linkUserToCrafter(userId: string, crafterId: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }

    // Check if user exists and has craft role
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    if (user.role !== 'craft') {
      return { success: false, message: 'User must have craft role to be linked to a crafter' };
    }

    // Check if crafter exists
    const crafter = await prisma.crafter.findUnique({ where: { id: crafterId } });
    if (!crafter) {
      return { success: false, message: 'Crafter not found' };
    }

    // Check if user is already linked to another crafter
    if (user.crafterId && user.crafterId !== crafterId) {
      return { success: false, message: 'User is already linked to another crafter' };
    }

    // Link user to crafter
    await prisma.user.update({
      where: { id: userId },
      data: { crafterId },
    });

    revalidatePath('/admin/crafters');
    
    return {
      success: true,
      message: 'User linked to crafter successfully',
    };
    
  } catch (error) {
    const errorResponse = formatError(error);
    return {
      success: false,
      message: typeof errorResponse === 'string' ? errorResponse : errorResponse.message
    };
  }
}