import { Resend } from "resend";
import { getEmailRuntimeConfig } from "@/lib/email/config";

export type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const config = await getEmailRuntimeConfig();

  if (!config) {
    console.warn(
      "Email skipped: missing RESEND_API_KEY or RESEND_FROM_EMAIL",
    );
    return false;
  }

  const recipients = input.to.map((email) => email.trim()).filter(Boolean);
  if (recipients.length === 0) {
    console.warn("Email skipped: no recipients");
    return false;
  }

  const resend = new Resend(config.apiKey);
  const { error } = await resend.emails.send({
    from: config.fromAddress,
    to: recipients,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo ?? config.replyToEmail,
  });

  if (error) {
    console.error("Failed to send email:", error);
    return false;
  }

  return true;
}

export async function sendEmailsSafely(
  emails: SendEmailInput[],
): Promise<void> {
  await Promise.allSettled(emails.map((email) => sendEmail(email)));
}
