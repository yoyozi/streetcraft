'use server';

import { prisma } from '@/lib/prisma';
import { getLinkedCrafterId } from '@/lib/auth-utils';

const PAGE_SIZE = 20;

export async function getCrafterSoldItemsCount(): Promise<number> {
  try {
    const crafterId = await getLinkedCrafterId();
    if (!crafterId) return 0;

    return prisma.orderItem.count({
      where: {
        crafterId,
        order: { isPaid: true },
      },
    });
  } catch {
    return 0;
  }
}

export async function getCrafterSoldItems(page = 1): Promise<{
  success: boolean;
  data: {
    id: string;
    name: string;
    image: string;
    price: number;
    qty: number;
    orderId: string;
    paidAt: string | null;
  }[];
  totalPages: number;
  totalCount: number;
}> {
  try {
    const crafterId = await getLinkedCrafterId();
    if (!crafterId) return { success: false, data: [], totalPages: 0, totalCount: 0 };

    const where = {
      crafterId,
      order: { isPaid: true },
    };

    const [items, totalCount] = await Promise.all([
      prisma.orderItem.findMany({
        where,
        include: { order: { select: { paidAt: true } } },
        orderBy: { order: { paidAt: 'desc' } },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.orderItem.count({ where }),
    ]);

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        qty: item.qty,
        orderId: item.orderId,
        paidAt: item.order.paidAt?.toISOString() ?? null,
      })),
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      totalCount,
    };
  } catch {
    return { success: false, data: [], totalPages: 0, totalCount: 0 };
  }
}
