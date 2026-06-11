import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user || session.user.role !== 'craft') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Only allow deletion of REJECTED uploads
    if (upload.status !== 'REJECTED') {
      return NextResponse.json({ error: 'Can only delete rejected uploads' }, { status: 400 });
    }

    await prisma.productImageUpload.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Error deleting upload:', error);
    return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
  }
}