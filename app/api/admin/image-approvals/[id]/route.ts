import { auth } from '@/auth';
import { approveImageUpload, rejectImageUpload } from '@/lib/actions/product-image-upload.actions';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, reason } = body;

    if (action === 'approve') {
      const result = await approveImageUpload(params.id);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } else if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { error: 'Reason is required for rejection' },
          { status: 400 }
        );
      }
      const result = await rejectImageUpload(params.id, reason);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}