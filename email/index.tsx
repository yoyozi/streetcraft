// email/index.tsx
import { Resend } from "resend";
import { SENDER_EMAIL, APP_NAME } from "@/lib/constants";
// because we are not in the app folder we need to get the .env via the dotenv package
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY as string);

interface EmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  // Optional: Add other Resend options like cc, bcc, etc.
}

export const SendEmail = async ({ to, subject, react }: EmailOptions) => {
  try {
    await resend.emails.send({
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