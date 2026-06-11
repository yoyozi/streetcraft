import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const products = await p.product.findMany({
    select: { name: true, isActive: true, isFirstPage: true },
  });
  console.table(products);

  const settings = await p.siteSetting.findMany();
  console.log('\nSite Settings:');
  console.table(settings.map(s => ({ key: s.key, value: s.value })));

  await p.$disconnect();
}

main();
