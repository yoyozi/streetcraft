import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user || session.user.role !== 'craft') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { costPrice, weight, height, width, depth, availability, isUnique } = body;

    console.log('Received form data:', { costPrice, weight, height, width, depth, availability, isUnique });

    // Verify the upload belongs to this crafter
    const crafter = await prisma.crafter.findUnique({
      where: { userId: session.user.id },
    });

    if (!crafter) {
      return NextResponse.json({ error: 'Crafter not found' }, { status: 404 });
    }

    const upload = await prisma.productImageUpload.findUnique({
      where: { id },
    });

    if (!upload || upload.crafterId !== crafter.id) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    // Update the upload with product details (status remains PENDING, waiting for admin approval)
    const updated = await prisma.productImageUpload.update({
      where: { id },
      data: {
        costPrice: costPrice && costPrice.trim() !== '' ? parseFloat(costPrice) : upload.costPrice,
        weight: weight && weight.trim() !== '' ? parseFloat(weight) : upload.weight,
        height: height && height.trim() !== '' ? parseFloat(height) : upload.height,
        width: width && width.trim() !== '' ? parseFloat(width) : upload.width,
        depth: depth && depth.trim() !== '' ? parseFloat(depth) : upload.depth,
        availability: isUnique ? 1 : (availability && availability.trim() !== '' ? parseInt(availability) : upload.availability),
        isUnique: typeof isUnique === 'boolean' ? isUnique : upload.isUnique,
      },
    });

    return NextResponse.json({ success: true, message: 'Upload details saved', data: updated });
  } catch (error) {
    console.error('Error submitting upload details:', error);
    return NextResponse.json({ error: 'Failed to submit details' }, { status: 500 });
  }
}