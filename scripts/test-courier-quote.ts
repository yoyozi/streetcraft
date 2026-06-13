/**
 * Test the Courier Guy / Shiplogic rates API directly so we can confirm the
 * endpoint, auth header and response shape against a real key.
 *
 * Run:
 *   node_modules/.bin/tsx --env-file=.env.local scripts/test-courier-quote.ts
 */

const BASE = process.env.COURIERGUY_API_URL || 'https://api.shiplogic.com';
const KEY = process.env.COURIERGUY_API_KEY || '';

async function main() {
  if (!KEY) {
    console.error('COURIERGUY_API_KEY not found in env');
    process.exit(1);
  }

  const body = {
    collection_address: {
      type: 'business',
      company: 'StreetCraft',
      street_address: '101 Main Road',
      local_area: 'Claremont',
      city: 'Cape Town',
      zone: 'Western Cape',
      country: 'ZA',
      code: '7708',
    },
    delivery_address: {
      type: 'residential',
      street_address: '12 Smith Street',
      local_area: 'Braamfontein',
      city: 'Johannesburg',
      zone: 'Gauteng',
      country: 'ZA',
      code: '2001',
    },
    parcels: [
      {
        submitted_length_cm: 20,
        submitted_width_cm: 15,
        submitted_height_cm: 10,
        submitted_weight_kg: 1.5,
      },
    ],
    declared_value: 500,
  };

  const url = `${BASE}/v2/rates`;
  console.log('POST', url);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify(body),
  });

  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  try {
    console.log('Response JSON:\n', JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log('Response (raw):\n', text);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
