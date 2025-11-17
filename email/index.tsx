// email/index.tsx
import { Resend } from "resend";
import { SENDER_EMAIL, APP_NAME } from "@/lib/constants";
// because we are not in the app folder we need to get the .env via the dotenv package
require('dotenv').config();

let resendInstance: Resend | null = null;

function getResendInstance() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
  }
  
  if (!resendInstance) {
    resendInstance = new Resend(RESEND_API_KEY as string);
  }
  
  return resendInstance;
}

interface EmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  // Optional: Add other Resend options like cc, bcc, etc.
}

export const SendEmail = async ({ to, subject, react }: EmailOptions) => {
  try {
    await getResendInstance().emails.send({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to,
      subject,
      react,
    });
    // console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Email sending failed: ${error}`);
  }
};