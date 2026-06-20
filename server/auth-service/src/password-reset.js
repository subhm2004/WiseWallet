import crypto from "crypto";
import { SERVICE_PORTS } from "@wisewallet/shared";

const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL ||
  `http://localhost:${SERVICE_PORTS.NOTIFICATION}`;
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export function createResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function buildPasswordResetEmail({ userName, resetUrl }) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;">
          <span style="font-size:22px;font-weight:700;color:#fff;">Reset your password</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            Hi ${userName || "there"}, we received a request to reset your WiseWallet password.
          </p>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <span style="color:#f97316;font-weight:600;">Wise</span><span style="color:#0f172a;font-weight:600;">Wallet</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: "Reset your WiseWallet password",
    html,
  };
}

export async function sendPasswordResetEmail({ to, userName, resetUrl, userId }) {
  const { subject, html } = buildPasswordResetEmail({ userName, resetUrl });
  const res = await fetch(`${NOTIFICATION_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_SECRET,
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      userId,
      type: "password-reset",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to send reset email");
  }
}

export function resetPasswordUrl(token) {
  return `${WEB_URL}/reset-password?token=${token}`;
}
