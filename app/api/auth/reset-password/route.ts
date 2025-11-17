import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, User } from '@/lib/mongodb/models';
import { compareSync, hashSync } from 'bcrypt-ts-edge';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, userId, password } = await request.json();

    // Handle forced password reset (when requirePasswordReset is true)
    if (userId && password && session.user.requirePasswordReset) {
      if (userId !== session.user.id) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      await connectDB();

      // Hash and update new password, remove requirePasswordReset flag
      const hashedPassword = hashSync(password, 10);
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        requirePasswordReset: false,
      });

      return NextResponse.json(
        { success: true, message: 'Password reset successfully' },
        { status: 200 }
      );
    }

    // Handle normal password change (with current password verification)
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user with password
    const user = await User.findById(session.user.id).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    if (!user.password || !compareSync(currentPassword, user.password)) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash and update new password
    const hashedPassword = hashSync(newPassword, 10);
    await User.findByIdAndUpdate(session.user.id, {
      password: hashedPassword
    });

    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
