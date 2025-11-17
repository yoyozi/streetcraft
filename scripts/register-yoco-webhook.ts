/**
 * Script to register Yoco webhook
 * Run with: npx tsx scripts/register-yoco-webhook.ts
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const WEBHOOK_URL = process.env.YOCO_WEBHOOK_URL; // Your ngrok URL + /api/webhooks/yoco

async function registerYocoWebhook() {
  if (!YOCO_SECRET_KEY) {
    console.error('❌ YOCO_SECRET_KEY is not set in environment variables');
    process.exit(1);
  }

  if (!WEBHOOK_URL) {
    console.error('❌ YOCO_WEBHOOK_URL is not set in environment variables');
    console.log('Example: YOCO_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app/api/webhooks/yoco');
    process.exit(1);
  }

  console.log('🔄 Registering Yoco webhook...');
  console.log('📍 Webhook URL:', WEBHOOK_URL);

  try {
    const response = await fetch('https://payments.yoco.com/api/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'OzoneShop Payment Webhook',
        url: WEBHOOK_URL,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to register webhook');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Webhook registered successfully!');
    console.log('\n📋 Webhook Details:');
    console.log(JSON.stringify(data, null, 2));

    if (data.secret) {
      console.log('\n⚠️  IMPORTANT: Save this webhook secret to your .env file:');
      console.log(`YOCO_WEBHOOK_SECRET=${data.secret}`);
      console.log('\n⚠️  This secret is used to verify webhook authenticity.');
      console.log('⚠️  Keep it secure and never commit it to version control!');
    }

    console.log('\n✅ Next steps:');
    console.log('1. Add YOCO_WEBHOOK_SECRET to your .env file');
    console.log('2. Restart your development server');
    console.log('3. Test a payment to trigger the webhook');

  } catch (error) {
    console.error('❌ Error registering webhook:', error);
    process.exit(1);
  }
}

// Run the script
registerYocoWebhook();
