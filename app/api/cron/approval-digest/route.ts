import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SendEmail } from '@/email';
import { APP_NAME } from '@/lib/constants';
import { getDigestSettings } from '@/lib/actions/settings.actions';

/**
 * Daily digest for admins. Sends ONE summary email listing:
 *  - product image uploads that are pending and ready for approval (details filled)
 *  - products a crafter changed that need review (priceNeedsReview)
 *
 * Triggered by an external scheduler (cron / systemd timer) once a day:
 *   curl -H "x-cron-secret: $CRON_SECRET" https://<domain>/api/cron/approval-digest
 *
 * If nothing is outstanding, no email is sent.
 */
export async function GET(request: Request) {
  // Auth: require the shared cron secret
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const provided = request.headers.get('x-cron-secret');
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Respect the admin on/off toggle in Settings
  const { enabled } = await getDigestSettings();
  if (!enabled) {
    return NextResponse.json({ success: true, sent: false, message: 'Digest disabled in settings' });
  }

  try {
    // Pending uploads that have their details filled in (ready for the admin to approve)
    const pendingUploads = await prisma.productImageUpload.findMany({
      where: {
        status: 'PENDING',
        costPrice: { not: null },
        weight: { not: null },
        height: { not: null },
        width: { not: null },
        depth: { not: null },
      },
      include: { crafter: { select: { businessName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Products a crafter changed that need review
    const reviewProducts = await prisma.product.findMany({
      where: { priceNeedsReview: true },
      select: { id: true, name: true, reviewReason: true, crafter: { select: { businessName: true } } },
      orderBy: { lastCostPriceUpdate: 'desc' },
    });

    // Nothing outstanding -> don't send
    if (pendingUploads.length === 0 && reviewProducts.length === 0) {
      return NextResponse.json({ success: true, sent: false, message: 'Nothing outstanding' });
    }

    // Resolve recipients: ADMIN_DIGEST_EMAILS (comma-separated) or fall back to admin users' real emails
    const envEmails = (process.env.ADMIN_DIGEST_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    let recipients = envEmails;
    if (recipients.length === 0) {
      const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { email: true } });
      recipients = admins
        .map((a) => a.email)
        .filter((e): e is string => !!e && !e.endsWith('@phone.local'));
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No admin recipients configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';

    const uploadsRows = pendingUploads
      .map(
        (u) =>
          `<li>${u.crafter?.businessName || 'Unknown crafter'}${u.isUnique ? ' — <strong>Unique item</strong>' : ''} (cost R${u.costPrice})</li>`
      )
      .join('');

    const reviewRows = reviewProducts
      .map(
        (p) =>
          `<li>${p.crafter?.businessName || 'Unknown crafter'}: ${p.name}${p.reviewReason ? ` — <em>${p.reviewReason}</em>` : ''}</li>`
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>${APP_NAME} — Daily summary</h2>
        ${
          pendingUploads.length > 0
            ? `<h3>${pendingUploads.length} product${pendingUploads.length === 1 ? '' : 's'} awaiting approval</h3><ul>${uploadsRows}</ul>`
            : ''
        }
        ${
          reviewProducts.length > 0
            ? `<h3>${reviewProducts.length} product${reviewProducts.length === 1 ? '' : 's'} need review (crafter changes)</h3><ul>${reviewRows}</ul>`
            : ''
        }
        <p style="margin-top:16px;">
          <a href="${baseUrl}/admin/image-approvals" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Review approvals</a>
          &nbsp;
          <a href="${baseUrl}/admin/products" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Review products</a>
        </p>
      </div>
    `;

    const subject = `${APP_NAME}: ${pendingUploads.length} to approve, ${reviewProducts.length} to review`;

    await SendEmail({ to: recipients.join(','), subject, html });

    return NextResponse.json({
      success: true,
      sent: true,
      recipients: recipients.length,
      pendingApprovals: pendingUploads.length,
      priceReviews: reviewProducts.length,
    });
  } catch (error) {
    console.error('Approval digest failed:', error);
    return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 });
  }
}
