import { formatMoney } from "@wisewallet/shared";
import { formatCategory, toNumber } from "./budget-alert.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function emailShell({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;">
          <span style="font-size:22px;font-weight:700;color:#fff;">
            <span style="color:#fff;">Wise</span><span style="color:#fff;">Wallet</span>
          </span>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${title}</p>
        </td></tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr><td style="padding:0 32px 28px;text-align:center;">
          <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Open Dashboard</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <span style="color:#f97316;font-weight:600;">Wise</span><span style="color:#0f172a;font-weight:600;">Wallet</span> · Smart money management
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function buildCategoryBudgetAlertEmail({
  userName,
  category,
  budgetAmount,
  spent,
  percentageUsed,
}) {
  const catLabel = formatCategory(category);
  const remaining = Math.max(budgetAmount - spent, 0);
  const barColor = percentageUsed >= 100 ? "#ef4444" : percentageUsed >= 90 ? "#f97316" : "#eab308";
  const pct = Math.min(percentageUsed, 100);

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      Hi ${userName || "there"}, your <strong>${catLabel}</strong> budget is at
      <strong style="color:${barColor};">${percentageUsed.toFixed(0)}%</strong> this month.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:13px;">Budget</td>
          <td align="right" style="font-weight:600;color:#0f172a;">${formatMoney(budgetAmount)}</td>
        </tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr>
          <td style="color:#64748b;font-size:13px;">Spent</td>
          <td align="right" style="font-weight:600;color:#0f172a;">${formatMoney(spent)}</td>
        </tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr>
          <td style="color:#64748b;font-size:13px;">Remaining</td>
          <td align="right" style="font-weight:600;color:${remaining > 0 ? "#16a34a" : "#ef4444"};">${formatMoney(remaining)}</td>
        </tr>
      </table>
    </div>
    <div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden;margin-bottom:8px;">
      <div style="background:${barColor};height:10px;width:${pct}%;border-radius:999px;"></div>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">${catLabel} · ${percentageUsed.toFixed(0)}% used</p>
  `;

  return {
    subject: `⚠️ ${catLabel} budget — ${percentageUsed.toFixed(0)}% used`,
    html: emailShell({ title: "Category Budget Alert", bodyHtml }),
  };
}

export async function getCategorySpending(db, userId, category, start, end) {
  const result = await db.transaction.aggregate({
    where: {
      userId,
      type: "EXPENSE",
      category,
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}
