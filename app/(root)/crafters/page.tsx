import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';

export const metadata: Metadata = { title: 'Our Crafters' };

async function getCrafters() {
  return prisma.crafter.findMany({
    where: { status: 'APPROVED', isActive: true },
    select: {
      id: true,
      businessName: true,
      profileImage: true,
    },
    orderBy: { businessName: 'asc' },
  });
}

export default async function CraftersPage() {
  const crafters = await getCrafters();

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {crafters.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          Crafter profiles coming soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {crafters.map((crafter) => (
            crafter.profileImage ? (
              <div key={crafter.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={crafter.profileImage}
                  alt={crafter.businessName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
