import { formatMoney } from "@wisewallet/shared";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export function buildWeeklyDigestEmail({
  userName,
  weekLabel,
  income,
  expenses,
  net,
  topCategories,
}) {
  const categoryRows = topCategories
    .map(
      (c) =>
        `<tr><td style="padding:8px 0;color:#64748b;">${c.name}</td><td align="right" style="font-weight:600;color:#0f172a;">${formatMoney(c.amount)}</td></tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      Hi ${userName || "there"}, here's your weekly money snapshot for <strong>${weekLabel}</strong>.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;">Income</td><td align="right" style="font-weight:600;color:#16a34a;">${formatMoney(income)}</td></tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr><td style="color:#64748b;">Expenses</td><td align="right" style="font-weight:600;color:#ef4444;">${formatMoney(expenses)}</td></tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr><td style="color:#64748b;">Net</td><td align="right" style="font-weight:700;color:#0f172a;">${formatMoney(net)}</td></tr>
      </table>
    </div>
    ${
      categoryRows
        ? `<p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Top spending</p><table width="100%">${categoryRows}</table>`
        : '<p style="color:#64748b;">No expenses recorded this week.</p>'
    }
  `;

  return {
    subject: `📊 Your weekly digest — ${weekLabel}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;">
          <span style="font-size:22px;font-weight:700;color:#fff;">Weekly Digest</span>
        </td></tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr><td style="padding:0 32px 28px;text-align:center;">
          <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View Dashboard</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}
