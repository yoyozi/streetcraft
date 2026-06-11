import { auth } from '@/auth';
import { approveImageUpload, rejectImageUpload } from '@/lib/actions/product-image-upload.actions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, reason, formData } = body;

    if (action === 'approve') {
      // If form data is provided, update the upload first
      if (formData) {
        await prisma.productImageUpload.update({
          where: { id },
          data: {
            costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            height: formData.height ? parseFloat(formData.height) : undefined,
            width: formData.width ? parseFloat(formData.width) : undefined,
            depth: formData.depth ? parseFloat(formData.depth) : undefined,
            availability: formData.isUnique ? 1 : (formData.availability ? parseInt(formData.availability) : undefined),
            isUnique: typeof formData.isUnique === 'boolean' ? formData.isUnique : undefined,
          },
        });
      }
      
      const result = await approveImageUpload(id);
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
      const result = await rejectImageUpload(id, reason);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.productImageUpload.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}