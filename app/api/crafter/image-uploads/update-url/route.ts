import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'craft') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { uploadId, newUrl, oldUrl } = body;

    if (!uploadId || !newUrl) {
      return NextResponse.json(
        { error: 'uploadId and newUrl are required' },
        { status: 400 }
      );
    }

    // Update the image URL in the database
    const updatedUpload = await prisma.productImageUpload.update({
      where: { id: uploadId },
      data: { imageUrl: newUrl },
    });

    console.log('Updated image URL in database:', {
      uploadId,
      oldUrl,
      newUrl
    });

    return NextResponse.json({ 
      success: true,
      data: updatedUpload
    });

  } catch (error) {
    console.error('Error updating image URL:', error);
    return NextResponse.json(
      { error: 'Failed to update image URL' },
      { status: 500 }
    );
  }
}