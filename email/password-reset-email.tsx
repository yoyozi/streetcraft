import { SendEmail } from "./index";
import { APP_NAME } from "@/lib/constants";

export const sendPasswordResetEmail = async ({ 
  to, 
  resetLink,
  userName 
}: { 
  to: string; 
  resetLink: string;
  userName?: string;
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
          Password Reset Request
        </h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          ${userName ? `Hello ${userName},` : 'Hello,'}
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          We received a request to reset your password for your ${APP_NAME} account. 
          Click the button below to reset your password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a 
            href="${resetLink}"
            style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;"
          >
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #0070f3; font-size: 14px; word-break: break-all; margin-bottom: 20px;">
          ${resetLink}
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
          This link will expire in 1 hour. If you didn't request a password reset, 
          please ignore this email or contact support if you have concerns.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  return SendEmail({
    to,
    subject: `Reset Your ${APP_NAME} Password`,
    html,
  });
};