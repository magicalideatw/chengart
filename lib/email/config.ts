export function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !fromEmail || !adminEmail) {
    return null;
  }

  return { apiKey, fromEmail, adminEmail };
}
