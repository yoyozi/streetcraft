/**
 * GET /api/test/courier
 * Sandbox test: quotes a small parcel from the collection address to a test
 * Johannesburg address. Use this to verify your API key and env vars are correct.
 * Remove or protect this route before going to production.
 */
import { NextResponse } from 'next/server';
import { getCourierRates } from '@/lib/courier/the-courier-guy';

export async function GET() {
  const collectionAddress = {
    type: 'business',
    company: process.env.COURIERGUY_COLLECTION_COMPANY || 'StreetCraft',
    streetAddress: process.env.COURIERGUY_COLLECTION_STREET || '',
    localArea: process.env.COURIERGUY_COLLECTION_SUBURB || '',
    city: process.env.COURIERGUY_COLLECTION_CITY || '',
    zone: process.env.COURIERGUY_COLLECTION_PROVINCE || '',
    country: 'ZA',
    code: process.env.COURIERGUY_COLLECTION_POSTCODE || '',
  };

  const deliveryAddress = {
    type: 'residential',
    streetAddress: '10 Sandton Drive',
    localArea: 'Sandton',
    city: 'Johannesburg',
    zone: 'Gauteng',
    country: 'ZA',
    code: '2196',
  };

  const parcels = [
    { lengthCm: 20, widthCm: 15, heightCm: 10, weightKg: 1 },
  ];

  const result = await getCourierRates({ collectionAddress, deliveryAddress, parcels, declaredValue: 500 });

  return NextResponse.json({
    config: {
      apiUrl: process.env.COURIERGUY_API_URL,
      apiKeyPresent: !!process.env.COURIERGUY_API_KEY,
      apiKeyLength: process.env.COURIERGUY_API_KEY?.length ?? 0,
      collectionAddress,
      deliveryAddress,
    },
    result,
  });
}
