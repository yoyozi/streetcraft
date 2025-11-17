/**
 * Script to manage Yoco webhooks (list and delete)
 * Run with: npx tsx scripts/manage-yoco-webhooks.ts [list|delete]
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local file (in parent directory)
config({ path: join(__dirname, '..', '.env.local') });

interface YocoWebhook {
  id: string;
  name?: string;
  url: string;
  createdDate?: string;
}

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

async function listWebhooks() {
  console.log('🔄 Fetching registered webhooks...\n');

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
      return;
    }

    const data = await response.json();
    
    // Debug: log the raw response
    console.log('Raw API Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    // Handle both array and single object responses
    let webhooks: YocoWebhook[] = [];
    
    if (Array.isArray(data)) {
      webhooks = data;
    } else if (data && typeof data === 'object') {
      // If it's a single webhook object with an id property
      if (data.id) {
        webhooks = [data];
      } else if (data.webhooks && Array.isArray(data.webhooks)) {
        webhooks = data.webhooks;
      }
    }
    
    if (webhooks.length === 0) {
      console.log('ℹ️  No webhooks registered');
      return;
    }

    console.log('📋 Registered Webhooks:\n');
    webhooks.forEach((webhook: YocoWebhook & { mode?: string }, index: number) => {
      console.log(`${index + 1}. ${webhook.name || 'Unnamed'}`);
      console.log(`   ID: ${webhook.id || 'N/A'}`);
      console.log(`   URL: ${webhook.url || 'N/A'}`);
      console.log(`   Mode: ${webhook.mode || 'N/A'}`);
      console.log(`   Created: ${webhook.createdDate || 'N/A'}`);
      console.log('');
    });

    console.log(`Total: ${webhooks.length} webhook(s)`);

  } catch (error) {
    console.error('❌ Error fetching webhooks:', error);
  }
}

async function deleteWebhook(webhookId: string) {
  console.log(`🔄 Deleting webhook: ${webhookId}...\n`);

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
      return;
    }

    console.log('✅ Webhook deleted successfully!');

  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
  }
}

async function main() {
  if (!YOCO_SECRET_KEY) {
    console.error('❌ YOCO_SECRET_KEY is not set in environment variables');
    process.exit(1);
  }

  const command = process.argv[2];
  const webhookId = process.argv[3];

  switch (command) {
    case 'list':
      await listWebhooks();
      break;

    case 'delete':
      if (!webhookId) {
        console.error('❌ Please provide a webhook ID to delete');
        console.log('Usage: npx tsx scripts/manage-yoco-webhooks.ts delete <webhook-id>');
        process.exit(1);
      }
      await deleteWebhook(webhookId);
      break;

    default:
      console.log('Yoco Webhook Management');
      console.log('');
      console.log('Usage:');
      console.log('  npx tsx scripts/manage-yoco-webhooks.ts list');
      console.log('  npx tsx scripts/manage-yoco-webhooks.ts delete <webhook-id>');
      console.log('');
      console.log('Examples:');
      console.log('  npx tsx scripts/manage-yoco-webhooks.ts list');
      console.log('  npx tsx scripts/manage-yoco-webhooks.ts delete wh_abc123def456');
      break;
  }
}

main();
