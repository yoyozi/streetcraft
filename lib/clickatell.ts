/**
 * Clickatell SMS integration
 * Docs: https://docs.clickatell.com/channels/sms-api/sms-api-reference
 * Note: Uses native https to avoid Next.js fetch patching which triggers CDN 403
 */

import https from 'https';

const CLICKATELL_API_KEY = process.env.CLICKATELL_API_KEY || '';
const CLICKATELL_API_URL = process.env.CLICKATELL_API_URL || 'https://platform.clickatell.com/v1/message';

interface ClickatellResponse {
  messages: Array<{
    apiMessageId: string;
    accepted: boolean;
    to: string;
    errorCode?: string;
    errorDescription?: string;
  }>;
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS via Clickatell
 * @param to - Phone number in international format without + (e.g. "27821234567")
 * @param content - Message content (keep under 160 chars for single SMS)
 */
export async function sendSms(to: string, content: string): Promise<SendSmsResult> {
  console.log('[Clickatell] --- SMS Send Request ---');
  console.log('[Clickatell] API URL:', CLICKATELL_API_URL);
  console.log('[Clickatell] API Key present:', !!CLICKATELL_API_KEY, '| length:', CLICKATELL_API_KEY.length);
  console.log('[Clickatell] To (raw):', to);
  console.log('[Clickatell] Content:', content);
  console.log('[Clickatell] Content length:', content.length, '(max 160 for single SMS)');

  if (!CLICKATELL_API_KEY) {
    console.error('[Clickatell] CLICKATELL_API_KEY not configured');
    return { success: false, error: 'SMS provider not configured' };
  }

  // Normalize phone number: remove +, spaces, dashes
  const normalizedTo = to.replace(/[+\s-]/g, '');
  console.log('[Clickatell] To (normalized):', normalizedTo);

  const requestBody = {
    messages: [
      {
        channel: 'sms',
        to: normalizedTo,
        content,
      },
    ],
  };
  console.log('[Clickatell] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const bodyStr = JSON.stringify(requestBody);
    const url = new URL(CLICKATELL_API_URL);

    const responseText = await new Promise<string>((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Authorization': CLICKATELL_API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyStr),
            'Accept': 'application/json',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            console.log('[Clickatell] Response status:', res.statusCode);
            console.log('[Clickatell] Response body:', data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            } else {
              resolve(data);
            }
          });
        }
      );
      req.on('error', reject);
      req.write(bodyStr);
      req.end();
    });

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[Clickatell] Failed to parse response JSON:', responseText);
      return { success: false, error: 'Invalid response from SMS provider' };
    }

    console.log('[Clickatell] Parsed response:', JSON.stringify(data, null, 2));

    // Response can be { messages: [...] } or { error: ... }
    const message = data.messages?.[0];

    if (message?.accepted) {
      console.log(`[Clickatell] SUCCESS - SMS sent to ${normalizedTo}, messageId: ${message.apiMessageId}`);
      return { success: true, messageId: message.apiMessageId };
    }

    console.error('[Clickatell] Message rejected:', message?.errorCode, message?.errorDescription);
    return { success: false, error: message?.errorDescription || 'Message rejected' };
  } catch (error) {
    console.error('[Clickatell] Send error:', error);
    return { success: false, error: `Failed to send SMS: ${error}` };
  }
}

/**
 * Send a crafter invite SMS
 */
export async function sendCrafterInviteSms(mobile: string, name: string, inviteCode: string): Promise<SendSmsResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const registerUrl = `${baseUrl}/register/crafter?code=${inviteCode}`;
  const content = `Hi ${name}, you've been invited to sell on StreetCraft. Register here: ${registerUrl}`;

  return sendSms(mobile, content);
}

/**
 * Send an OTP verification SMS
 */
export async function sendOtpSms(mobile: string, code: string): Promise<SendSmsResult> {
  const content = `Your StreetCraft verification code is ${code}. Expires in 5 minutes.`;
  return sendSms(mobile, content);
}
