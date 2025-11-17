import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export type UserRole = 'user' | 'admin' | 'craft';

/**
 * Gets the current session and validates user role
 * @param requiredRoles - Array of roles that are allowed to access the resource
 * @param redirectTo - Path to redirect to if user doesn't have required role
 * @returns Session object if user has required role
 */
export async function requireAuth(requiredRoles: UserRole[] = [], redirectTo: string = '/sign-in') {
  const session = await auth();
  
  if (!session?.user) {
    redirect(redirectTo);
  }
  
  if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role as UserRole)) {
    redirect('/unauthorized');
  }
  
  return session;
}

/**
 * Checks if current user has specific role
 * @param role - Role to check
 * @returns boolean indicating if user has the role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === role;
}

/**
 * Checks if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Checks if current user is crafter
 */
export async function isCrafter(): Promise<boolean> {
  return hasRole('craft');
}

/**
 * Protects admin routes
 */
export async function protectAdmin() {
  return requireAuth(['admin']);
}

/**
 * Protects crafter routes
 */
export async function protectCrafter() {
  return requireAuth(['craft']);
}

/**
 * Protects routes that can be accessed by admin or crafter
 */
export async function protectAdminOrCrafter() {
  return requireAuth(['admin', 'craft']);
}

/**
 * Gets the Crafter account ID linked to the current user
 * Queries database for fresh data (not from session)
 * @returns Crafter ID if user has a linked crafter account, null otherwise
 */
export async function getLinkedCrafterId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  // Import here to avoid circular dependencies
  const { connectDB, User } = await import('@/lib/mongodb/models');
  
  await connectDB();
  const user = await User.findById(session.user.id).select('crafterId');
  return user?.crafterId?.toString() || null;
}

/**
 * Checks if current user has a linked crafter account
 */
export async function hasLinkedCrafter(): Promise<boolean> {
  const crafterId = await getLinkedCrafterId();
  return !!crafterId;
}

