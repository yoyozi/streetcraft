import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, name: true, crafterId: true, crafter: { select: { businessName: true } } },
  });
  console.table(products.map(p => ({
    name: p.name,
    crafterId: p.crafterId || 'NULL',
    crafterName: p.crafter?.businessName || 'NONE',
  })));
}

main().finally(() => prisma.$disconnect());
