import { auth } from '@/auth';
import { cleanupUnreferencedImages, getUploadThingStats } from '@/lib/actions/cleanup.actions';
import { NextResponse } from 'next/server';

// GET - Get storage statistics
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await getUploadThingStats();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error getting UploadThing stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Run cleanup
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await cleanupUnreferencedImages();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error cleaning up images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}