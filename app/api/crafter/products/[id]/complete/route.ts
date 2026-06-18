import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the product belongs to this crafter
    const crafter = await prisma.crafter.findFirst({
      where: { userId: session.user.id },
    });

    if (!crafter) {
      return NextResponse.json({ error: 'Crafter not found' }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { id, crafterId: crafter.id, needsCompletion: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found or already complete' }, { status: 404 });
    }

    const body = await request.json();
    const { costPrice, weight, height, width, depth, availability, description, isUnique } = body;

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

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        costPrice: cp,
        price: cp * 1.5,
        weight: wt,
        height: ht,
        width: wd,
        depth: dp,
        availability: isUnique ? 0 : (availability !== undefined ? parseInt(availability) : product.availability),
        isUnique: typeof isUnique === 'boolean' ? isUnique : product.isUnique,
        description: description?.trim() || product.description,
        needsCompletion: false,
      },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Error completing product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
