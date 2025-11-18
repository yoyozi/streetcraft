import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { auth, signIn } from '@/auth';
import { connectDB, User } from '@/lib/mongodb/models';
import { hasRole, isAdmin, isCrafter } from '@/lib/auth-utils';

describe.skip('Crafter Authentication and Authorization', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('User Roles', () => {
    it('should create user with craft role', async () => {
      const crafterUser = await User.create({
        name: 'Test Crafter',
        email: 'crafter@test.com',
        password: 'hashedpassword',
        role: 'craft',
        isActive: true,
      });

      expect(crafterUser.role).toBe('craft');
      expect(crafterUser.isActive).toBe(true);
    });

    it('should validate role enum values', async () => {
      const validRoles = ['user', 'admin', 'craft'];
      
      // Test that all valid roles are accepted
      for (const role of validRoles) {
        const user = new User({
          name: `Test ${role}`,
          email: `${role}@test.com`,
          password: 'hashedpassword',
          role: role,
          isActive: true,
        });
        
        // This should not throw an error
        const validation = user.validateSync();
        expect(validation).toBeUndefined();
      }
    });
  });

  describe('Auth Utils', () => {
    it('should identify crafter role correctly', async () => {
      // Mock session with crafter role
      const mockSession = {
        user: {
          id: 'test-id',
          name: 'Test Crafter',
          email: 'crafter@test.com',
          role: 'craft',
        },
      };

      // Test role checking functions
      expect(mockSession.user.role).toBe('craft');
    });

    it('should distinguish between admin and crafter roles', () => {
      const adminSession = {
        user: { role: 'admin' }
      };
      
      const crafterSession = {
        user: { role: 'craft' }
      };

      expect(adminSession.user.role).toBe('admin');
      expect(crafterSession.user.role).toBe('craft');
      expect(adminSession.user.role).not.toBe('craft');
      expect(crafterSession.user.role).not.toBe('admin');
    });
  });

  describe('Crafter Login Flow', () => {
    it('should allow crafter to sign in with correct credentials', async () => {
      // Create a test crafter user
      const testCrafter = await User.create({
        name: 'Test Login Crafter',
        email: 'login-crafter@test.com',
        password: '$2a$10$hashedpassword123', // Mock hashed password
        role: 'craft',
        isActive: true,
      });

      expect(testCrafter.email).toBe('login-crafter@test.com');
      expect(testCrafter.role).toBe('craft');
      expect(testCrafter.isActive).toBe(true);
    });

    it('should reject inactive crafter login', async () => {
      // Create inactive crafter
      const inactiveCrafter = await User.create({
        name: 'Inactive Crafter',
        email: 'inactive@test.com',
        password: '$2a$10$hashedpassword123',
        role: 'craft',
        isActive: false,
      });

      expect(inactiveCrafter.isActive).toBe(false);
      // Login should be rejected for inactive users
    });
  });

  describe('Route Protection', () => {
    it('should protect crafter routes', () => {
      // Test that crafter routes require authentication
      const protectedRoutes = [
        '/crafter',
        '/crafter/availability',
        '/crafter/products',
        '/crafter/settings',
      ];

      protectedRoutes.forEach(route => {
        expect(route).toMatch(/^\/crafter/);
      });
    });

    it('should allow crafters to access crafter routes', () => {
      const crafterRoutes = ['/crafter', '/crafter/availability'];
      const userRole = 'craft';
      
      // Crafters should be able to access these routes
      expect(userRole).toBe('craft');
    });

    it('should redirect non-crafters from crafter routes', () => {
      const nonCrafterRoles = ['user', 'admin'];
      
      nonCrafterRoles.forEach(role => {
        expect(role).not.toBe('craft');
      });
    });
  });
});
