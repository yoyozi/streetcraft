/**
 * Script to update Yoco webhook (delete old + create new)
 * Run with: npx tsx scripts/update-yoco-webhook.ts <new-webhook-url>
 * 
 * Example:
 *   npx tsx scripts/update-yoco-webhook.ts https://your-app.vercel.app/api/webhooks/yoco
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

interface YocoWebhook {
  id: string;
  name?: string;
  url: string;
  createdDate?: string;
  mode?: string;
}

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

async function listWebhooks(): Promise<YocoWebhook[]> {
  console.log('🔄 Fetching existing webhooks...\n');

  try {
    const response = await fetch('https://payments.yoco.com/api/webhooks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch webhooks');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return [];
    }

    const data = await response.json();
    
    // Handle both array and single object responses
    let webhooks: YocoWebhook[] = [];
    
    if (Array.isArray(data)) {
      webhooks = data;
    } else if (data && typeof data === 'object') {
      if (data.id) {
        webhooks = [data];
      } else if (data.webhooks && Array.isArray(data.webhooks)) {
        webhooks = data.webhooks;
      }
    }
    
    return webhooks;

  } catch (error) {
    console.error('❌ Error fetching webhooks:', error);
    return [];
  }
}

async function deleteWebhook(webhookId: string): Promise<boolean> {
  console.log(`🗑️  Deleting webhook: ${webhookId}...`);

  try {
    const response = await fetch(`https://payments.yoco.com/api/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to delete webhook');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return false;
    }

    console.log('✅ Webhook deleted successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
    return false;
  }
}

async function createWebhook(webhookUrl: string) {
  console.log('🔄 Creating new webhook...');
  console.log('📍 Webhook URL:', webhookUrl);

  try {
    const response = await fetch('https://payments.yoco.com/api/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'OzoneShop Payment Webhook',
        url: webhookUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create webhook');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Webhook created successfully!\n');
    console.log('📋 Webhook Details:');
    console.log(JSON.stringify(data, null, 2));

    if (data.secret) {
      console.log('\n⚠️  IMPORTANT: Update your .env file with this webhook secret:');
      console.log(`YOCO_WEBHOOK_SECRET=${data.secret}`);
      console.log('\n⚠️  This secret is used to verify webhook authenticity.');
      console.log('⚠️  Keep it secure and never commit it to version control!');
    }

    return true;

  } catch (error) {
    console.error('❌ Error creating webhook:', error);
    return false;
  }
}

async function main() {
  if (!YOCO_SECRET_KEY) {
    console.error('❌ YOCO_SECRET_KEY is not set in environment variables');
    process.exit(1);
  }

  const newWebhookUrl = process.argv[2];

  if (!newWebhookUrl) {
    console.error('❌ Please provide the new webhook URL');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/update-yoco-webhook.ts <new-webhook-url>');
    console.log('\nExample:');
    console.log('  npx tsx scripts/update-yoco-webhook.ts https://your-app.vercel.app/api/webhooks/yoco');
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(newWebhookUrl);
  } catch (error) {
    console.error('❌ Invalid webhook URL provided');
    process.exit(1);
  }

  console.log('🚀 Yoco Webhook Update Script\n');
  console.log('═'.repeat(50));
  console.log('');

  // Step 1: List existing webhooks
  const existingWebhooks = await listWebhooks();

  if (existingWebhooks.length === 0) {
    console.log('ℹ️  No existing webhooks found\n');
  } else {
    console.log(`📋 Found ${existingWebhooks.length} existing webhook(s):\n`);
    existingWebhooks.forEach((webhook, index) => {
      console.log(`${index + 1}. ${webhook.name || 'Unnamed'}`);
      console.log(`   ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log('');
    });

    // Step 2: Delete all existing webhooks
    console.log('🗑️  Deleting existing webhooks...\n');
    for (const webhook of existingWebhooks) {
      await deleteWebhook(webhook.id);
    }
  }

  // Step 3: Create new webhook
  console.log('═'.repeat(50));
  console.log('');
  const success = await createWebhook(newWebhookUrl);

  if (success) {
    console.log('\n✅ Webhook update complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the YOCO_WEBHOOK_SECRET above');
    console.log('2. Update your .env file (or Vercel environment variables)');
    console.log('3. Restart your server (or redeploy on Vercel)');
    console.log('4. Test a payment to verify webhook is working');
  } else {
    console.log('\n❌ Webhook update failed');
    process.exit(1);
  }
}

main();
