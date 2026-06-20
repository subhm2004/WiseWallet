import { BrevoClient } from "@getbrevo/brevo";

function parseEmailFrom(from) {
  if (!from) return { name: "WiseWallet", email: "" };
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "WiseWallet", email: from.trim() };
}

function getClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY not configured");
  }
  return new BrevoClient({ apiKey });
}

export async function sendBrevoEmail({ to, subject, html, toName }) {
  const sender = parseEmailFrom(process.env.EMAIL_FROM);
  if (!sender.email) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const brevo = getClient();

  try {
    const data = await brevo.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender,
      to: [{ email: to, name: toName || to }],
    });
    return { success: true, data };
  } catch (error) {
    const message =
      error?.body?.message || error?.message || "Brevo rejected the email";
    return { success: false, error: message };
  }
}
