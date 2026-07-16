import { siteConfig } from "@/lib/data/site";
import { getEmailSettings } from "@/lib/settings/queries";

export const EMAIL_LOGO_URL = `${siteConfig.url}/images/hero-performance.jpg`;

export type EmailRuntimeConfig = {
  apiKey: string;
  fromAddress: string;
  fromEmail: string;
  senderName: string;
  adminEmail: string;
  replyToEmail: string;
};

export async function getEmailRuntimeConfig(): Promise<EmailRuntimeConfig | null> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return null;
  }

  const settings = await getEmailSettings();
  const adminEmail =
    settings.adminEmail ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    siteConfig.email;
  const replyToEmail = settings.replyToEmail || siteConfig.email;
  const senderName = settings.senderName || siteConfig.name;

  return {
    apiKey,
    fromEmail,
    senderName,
    adminEmail,
    replyToEmail,
    fromAddress: `${senderName} <${fromEmail}>`,
  };
}
