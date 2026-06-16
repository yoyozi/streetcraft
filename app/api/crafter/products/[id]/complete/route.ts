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
    const { costPrice, weight, height, width, depth, availability, description } = body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        costPrice: costPrice ? parseFloat(costPrice) : product.costPrice,
        price: costPrice ? parseFloat(costPrice) * 1.5 : product.price,
        weight: weight ? parseFloat(weight) : product.weight,
        height: height ? parseFloat(height) : product.height,
        width: width ? parseFloat(width) : product.width,
        depth: depth ? parseFloat(depth) : product.depth,
        availability: availability !== undefined ? parseInt(availability) : product.availability,
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
