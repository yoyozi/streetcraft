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

    const cp = parseFloat(costPrice);
    const wt = parseFloat(weight);
    const ht = parseFloat(height);
    const wd = parseFloat(width);
    const dp = parseFloat(depth);

    if (!costPrice || isNaN(cp) || cp <= 0)
      return NextResponse.json({ error: 'Cost price is required and must be greater than 0' }, { status: 400 });
    if (!weight || isNaN(wt) || wt <= 0)
      return NextResponse.json({ error: 'Weight is required and must be greater than 0' }, { status: 400 });
    if (!height || isNaN(ht) || ht <= 0)
      return NextResponse.json({ error: 'Height is required and must be greater than 0' }, { status: 400 });
    if (!width || isNaN(wd) || wd <= 0)
      return NextResponse.json({ error: 'Width is required and must be greater than 0' }, { status: 400 });
    if (!depth || isNaN(dp) || dp <= 0)
      return NextResponse.json({ error: 'Depth is required and must be greater than 0' }, { status: 400 });

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
        costPrice: cp,
        weight: wt,
        height: ht,
        width: wd,
        depth: dp,
        availability: isUnique ? 1 : (availability && String(availability).trim() !== '' ? parseInt(availability) : (upload.availability ?? 3)),
        isUnique: typeof isUnique === 'boolean' ? isUnique : upload.isUnique,
      },
    });

    return NextResponse.json({ success: true, message: 'Upload details saved', data: updated });
  } catch (error) {
    console.error('Error submitting upload details:', error);
    return NextResponse.json({ error: 'Failed to submit details' }, { status: 500 });
  }
}