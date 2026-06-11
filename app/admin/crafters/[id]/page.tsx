import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { getCrafterById, getProductCountsByImages } from '@/lib/actions/crafter.actions';
import { prisma } from '@/lib/prisma';
import EditPageClient from './edit-page-client';

export const metadata: Metadata = {
  title: 'Edit Crafter',
};

const EditCrafterPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await verifyAdmin();
  const params = await props.params;
  
  const result = await getCrafterById(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const imageCounts = result.data.workSamples?.length
    ? (await getProductCountsByImages(result.data.workSamples)).data
    : {};

  // Fetch sold products for this crafter (unique items that have been sold)
  const soldProducts = await prisma.product.findMany({
    where: {
      crafterId: params.id,
      isUnique: true,
      availability: { lte: 0 },
    },
    select: { id: true, name: true, images: true, price: true },
    orderBy: { createdAt: 'desc' },
  });

  const serializedSoldProducts = soldProducts.map(p => ({
    id: p.id,
    name: p.name,
    image: p.images?.[0] || null,
    price: p.price.toString(),
  }));

  // Fetch linked CrafterInvite if one exists for this mobile
  const invite = result.data.mobile
    ? await prisma.crafterInvite.findFirst({ where: { mobile: result.data.mobile } })
    : null;

  const serializedInvite = invite ? {
    id: invite.id,
    mobile: invite.mobile,
    name: invite.name,
    status: invite.status,
    inviteCode: invite.inviteCode,
    createdAt: invite.createdAt.toISOString(),
  } : null;

  return (
    <EditPageClient
      crafter={result.data}
      imageCounts={imageCounts}
      soldProducts={serializedSoldProducts}
      invite={serializedInvite}
    />
  );
};

export default EditCrafterPage;
