import { formatMoney } from "@wisewallet/shared";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export function buildBillReminderEmail({
  userName,
  description,
  amount,
  dueDate,
  daysUntil,
  category,
}) {
  const dueLabel = new Date(dueDate).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      Hi ${userName || "there"}, <strong>${description}</strong> is due
      ${daysUntil === 0 ? "<strong>today</strong>" : `in <strong>${daysUntil} day${daysUntil === 1 ? "" : "s"}</strong>`}.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Amount</p>
      <p style="margin:0 0 16px;font-size:28px;font-weight:700;color:#0f172a;">${formatMoney(amount)}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Due date</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${dueLabel}</p>
      ${category ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;">Category: ${category}</p>` : ""}
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;">
      This is a recurring bill tracked in WiseWallet. Make sure you have enough balance set aside.
    </p>
  `;

  return {
    subject: `📅 ${description} due ${daysUntil === 0 ? "today" : `in ${daysUntil} days`}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;">
          <span style="font-size:22px;font-weight:700;color:#fff;">Bill Reminder</span>
        </td></tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr><td style="padding:0 32px 28px;text-align:center;">
          <a href="${FRONTEND_URL}/subscriptions" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">View Subscriptions</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <span style="color:#f97316;font-weight:600;">Wise</span><span style="color:#0f172a;font-weight:600;">Wallet</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}

export function daysUntil(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
}
