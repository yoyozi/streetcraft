import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'craft') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const crafter = await prisma.crafter.findUnique({
    where: { userId: session.user.id },
    select: {
      profileImage: true,
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { images: true },
      },
    },
  });

  if (!crafter) {
    return NextResponse.json({ success: false, error: 'Crafter not found' }, { status: 404 });
  }

  const fallbackImage = crafter.products[0]?.images[0] ?? null;

  return NextResponse.json({
    success: true,
    profileImage: crafter.profileImage ?? null,
    fallbackImage,
  });
}
