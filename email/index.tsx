// email/index.tsx
import React from 'react';
import nodemailer from 'nodemailer';
import { APP_NAME } from "@/lib/constants";
// because we are not in the app folder we need to get the .env via the dotenv package
require('dotenv').config({ path: '.env.local' });

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const SMTP2GO_USERNAME = process.env.SMTP2GO_USERNAME;
  const SMTP2GO_PASSWORD = process.env.SMTP2GO_PASSWORD;
  const SMTP2GO_EMAIL = process.env.SMTP2GO_EMAIL;
  const SMTP2GO_HOST = process.env.SMTP2GO_HOST || 'mail.smtp2go.com';
  const SMTP2GO_PORT = parseInt(process.env.SMTP2GO_PORT || '2525');
  
  if (!SMTP2GO_USERNAME || !SMTP2GO_PASSWORD) {
    throw new Error('SMTP2GO_USERNAME and SMTP2GO_PASSWORD must be defined in environment variables');
  }
  
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP2GO_HOST,
      port: SMTP2GO_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: SMTP2GO_USERNAME,
        pass: SMTP2GO_PASSWORD,
      },
    });
  }
  
  return transporter;
}

// Helper function to get the sender email
function getSenderEmail() {
  return process.env.SMTP2GO_EMAIL || process.env.SENDER_EMAIL || 'noreply@streetcraft.co.za';
}

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  react?: React.ReactElement;
  // Optional: Add other options like cc, bcc, etc.
}

export const SendEmail = async ({ to, subject, html, react }: EmailOptions) => {
  let htmlContent = html ?? '';
  if (react) {
    // Dynamic require avoids Next.js App Router static-analysis rejection of react-dom/server
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { renderToStaticMarkup } = require('react-dom/server');
    htmlContent = renderToStaticMarkup(react);
  }
  try {
    const senderEmail = getSenderEmail();
    await getTransporter().sendMail({
      from: `${APP_NAME} <${senderEmail}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Email sending failed: ${error}`);
  }
};