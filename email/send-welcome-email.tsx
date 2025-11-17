// email/welcome-email.ts (example for another use case)
import { SendEmail } from "./index";
import { APP_NAME } from "@/lib/constants";

export const sendWelcomeEmail = async ({ 
  to, 
  userName 
}: { 
  to: string; 
  userName: string; 
}) => {
  const emailComponent = (
    <div>
      <h1>Welcome to {APP_NAME}!</h1>
      <p>Hello {userName}, thank you for joining us.</p>
    </div>
  );
  
  return SendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    react: emailComponent,
  });
};