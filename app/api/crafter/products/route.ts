import { auth } from '@/auth';
import { getAllProductsByLinkedCrafter } from '@/lib/actions/product.actions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verify authentication and crafter role
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'craft') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch products for the authenticated crafter
    const result = await getAllProductsByLinkedCrafter();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error('Error fetching crafter products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
