import { SendEmail } from './index';

interface CollectionItem {
  name: string;
  qty: number;
}

interface CrafterCollection {
  businessName: string;
  mobile: string;
  items: CollectionItem[];
}

/**
 * Send a collection-required notification to the StreetCraft logistics email.
 * One email per order, grouped by crafter.
 */
export async function sendCollectionNotification({
  orderId,
  crafters,
}: {
  orderId: string;
  crafters: CrafterCollection[];
}) {
  const to = process.env.LOGISTICS_EMAIL || 'logistics@streetcraft.co.za';

  const totalItems = crafters.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.qty, 0), 0);

  const crafterBlocks = crafters
    .map((c) => {
      const itemRows = c.items
        .map((i) => `<tr><td style="padding:4px 12px;">${i.name}</td><td style="padding:4px 12px;text-align:center;">${i.qty}</td></tr>`)
        .join('');
      return `
        <div style="margin-bottom:20px;padding:12px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;">
          <p style="margin:0 0 8px;font-weight:bold;font-size:15px;">${c.businessName}</p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">📱 ${c.mobile}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#e5e7eb;">
                <th style="padding:4px 12px;text-align:left;">Product</th>
                <th style="padding:4px 12px;text-align:center;">Qty</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>`;
    })
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#111827;padding:16px 24px;border-radius:6px 6px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:18px;">StreetCraft — Collection Required</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;">
        <p style="margin:0 0 16px;">Order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been paid. The following items need to be collected from crafters.</p>
        ${crafterBlocks}
        <p style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
          Total items to collect: <strong>${totalItems}</strong>
        </p>
      </div>
    </div>`;

  return SendEmail({
    to,
    subject: `Collection Required — Order #${orderId.slice(-8).toUpperCase()}`,
    html,
  });
}
