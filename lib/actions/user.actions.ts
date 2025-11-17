'use server';

import { 
    ShippingAddressSchema, 
    signInFormSchema, 
    signUpFormSchema, 
    PaymentMethodSchema, 
    updateUserSchema } from "../validators";

import { auth, signIn, signOut } from "@/auth"; // root-level import
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { connectDB } from '../mongodb/models';
import { formatError } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';
import { User } from '../mongodb/models';
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
    // Log all form data for debugging NBNBNBN dont leave uncommented!
    console.log('signInWithCredentials - form data entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const userData = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const callbackUrl = (formData.get('callbackUrl') as string) || '/';

    console.log("[USER ACTIONS] Sending creds to AUTH - signing in:", userData.email);
    console.log("[USER ACTIONS] Callback URL:", callbackUrl);
  
    // Check if user requires password reset BEFORE signing in
    await connectDB();
    const user = await User.findOne({ email: userData.email });
    
    if (user && user.requirePasswordReset) {
      console.log("[USER ACTIONS] 🔐 User requires password reset, will redirect to reset page");
      // Sign in but redirect to reset password page
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
    
    // console.log("[USER ACTIONS] ❌ FALLBACK Next auth redirect to CBUrl failed trying redirectTo");
    // This return is a fallback in case redirect doesn't work
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
    // console.log("[USER ACTIONS] Signing out user");
    await signOut({ redirect: false });
    
    // Optionally clear custom cookies if needed
    // const cookieStore = cookies();
    // cookieStore.delete('cart-session-id');
    // cookieStore.delete('user-preferences');
    
    // console.log("[USER ACTIONS] Signed out successfully, redirecting to home");
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

    const plainPass = user.password; 

    const hashedPassword = await hashSync(plainPass, 10);
    const callbackUrl = formData.get('callbackUrl') as string || '/';
    console.log('[SIGN UP USER -SIGNING IN] signUpWithCredentials - Using callbackUrl:', callbackUrl);

    // Create the user
    await connectDB();
    await User.create({
      name: user.name,
      email: user.email,
      password: hashedPassword,
    });

    await signIn('credentials', {
      email: user.email,
      password: user.password,
      redirect: true,
      redirectTo: callbackUrl,
    });
    

    // Redirect if above fails
    return { 
      success: true, 
      message: 'User registered successfully',
      redirectTo: callbackUrl || '/'
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    // Get the error message from formatError and ensure it's a string
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
    await connectDB();
    const user = await User.findById(userId);
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
    await connectDB();

    const currentUser = await User.findById(session?.user?.id);

    if (!currentUser) {
      return { success: false, message: "User not found" };
    }

    const address = ShippingAddressSchema.parse(data);

    await User.findByIdAndUpdate(currentUser.id, { address });

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
    await connectDB();
    const currentUser = await User.findById(session?.user?.id);

    if (!currentUser) {
      return { success: false, message: "User not found" };
    }

    const paymentMethod = PaymentMethodSchema.parse(data);

    await User.findByIdAndUpdate(currentUser.id, { paymentMethod: paymentMethod.type });

    return { success: true, message: "Payment method updated successfully" };
    
  } catch (error) {
    // formatError already returns an ActionResponse with a string message
    return formatError(error);
  }

}

// To udate the user profile
export async function updateProfile( user: { name:string; email:string; }) {
  try {
    const session = await auth();
    await connectDB();
    const currentUser = await User.findById(session?.user?.id);

    if (!currentUser) {
      return { success: false, message: "User not found" };
    }

    await User.findByIdAndUpdate(currentUser.id, { name: user.name });

    return { success: true, message: "Profile updated successfully" };
    
  } catch (error) {
    // formatError already returns an ActionResponse with a string message
    return formatError(error);
  }
}
  

// Get all users with pagination support
// @param limit - Number of users to return per page (defaults to PAGE_SIZE)
// @param page - The current page number (1-based index)
// @returns Object containing user data and pagination info
export async function getAllUsers({
  limit = PAGE_SIZE,  // Default to PAGE_SIZE if limit is not provided
  page,               // Current page number (required)
  query = '',         // Search query string
}: {
  limit?: number;     // Typing limit to be optional and a number
  page: number;       // Required parameter for current page, is a number
  query?: string;     // Optional search query
}) {
  await connectDB();
  
  // Build the search filter
  const searchFilter = query
    ? {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      }
    : {};

  // Fetch paginated and filtered user data from the database using MongoDB
  const [data, dataCount] = await Promise.all([
    User.find(searchFilter)
      .sort({ createdAt: -1 })  // Sort users by creation date, newest first
      .limit(limit)            // Limit the number of results per page
      .skip((page - 1) * limit) // Calculate how many records to skip for pagination
      .lean()                  // Return plain JavaScript objects
      .exec(),
    User.countDocuments(searchFilter),  // Get the count of filtered users
  ]);

  // Serialize the data to remove MongoDB artifacts
  const serializedData = data.map(user => ({
    ...user,
    _id: user._id.toString(),
    id: user._id.toString(),
    createdAt: user.createdAt?.toString(),
    updatedAt: user.updatedAt?.toString(),
  }));

  // Return the paginated data along with total pages info
  return {
    data: JSON.parse(JSON.stringify(serializedData)),  // The array of user data for the current page
    totalPages: Math.ceil(dataCount / limit),  // ceil to round up to the nearest integer
  };
}


// Delete user by ID
export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> { 
  try {
    await connectDB();
    await User.findByIdAndDelete(id);
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
    // Check admin authorization
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Hash the password
    const hashedPassword = await hash(userData.password, 10);

    // Create user with hashed password
    await User.create({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      password: hashedPassword,
      requirePasswordReset: userData.requirePasswordReset || false,
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
    await connectDB();

    // Debug: Log the incoming user data
    console.log('Update user data:', user);

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

    // Only include isActive if it's explicitly provided
    if (user.isActive !== undefined) {
      updateData.isActive = user.isActive;
    }

    // Add password reset flag if provided
    if (user.requirePasswordReset !== undefined) {
      updateData.requirePasswordReset = user.requirePasswordReset;
    }

    // Add new password if provided
    if (user.password && user.password.trim() && user.password.length > 0) {
      console.log('Hashing new password...');
      const hashedPassword = await hash(user.password, 10);
      updateData.password = hashedPassword;
      console.log('Password hashed and added to update data');
    } else {
      console.log('No password provided or empty password, skipping password update');
    }

    // Debug: Log the update data
    console.log('MongoDB update data:', updateData);

    try {
      await User.findByIdAndUpdate(user.id, updateData);
    } catch (mongoError) {
      console.error('MongoDB update error:', mongoError);
      throw mongoError;
    }

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
    // Check admin authorization
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }

    await connectDB();

    // Check if user exists and has craft role
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    if (user.role !== 'craft') {
      return { success: false, message: 'User must have craft role to be linked to a crafter' };
    }

    // Check if crafter exists
    const Crafter = (await import('../mongodb/models')).Crafter;
    const crafter = await Crafter.findById(crafterId);
    if (!crafter) {
      return { success: false, message: 'Crafter not found' };
    }

    // Check if user is already linked to another crafter
    if (user.crafterId && user.crafterId.toString() !== crafterId) {
      return { success: false, message: 'User is already linked to another crafter' };
    }

    // Link user to crafter
    await User.findByIdAndUpdate(userId, { crafterId });

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