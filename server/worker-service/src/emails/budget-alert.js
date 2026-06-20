import Groq from "groq-sdk";
import { formatMoney } from "@wisewallet/shared";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

export function formatCategory(name) {
  return String(name)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function getBudgetExpenseStats(db, userId, accountId, start, end) {
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      accountId,
      type: "EXPENSE",
      date: { gte: start, lte: end },
    },
    select: { amount: true, category: true },
  });

  const byCategory = {};
  let totalExpenses = 0;

  for (const t of transactions) {
    const amount = toNumber(t.amount);
    totalExpenses += amount;
    byCategory[t.category] = (byCategory[t.category] || 0) + amount;
  }

  const categories = Object.entries(byCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { totalExpenses, byCategory, categories };
}

export async function generateBudgetInsights({
  userName,
  accountName,
  budgetAmount,
  totalExpenses,
  percentageUsed,
  categories,
}) {
  const categoryText = categories
    .slice(0, 8)
    .map((c) => `${formatCategory(c.name)}: ${formatMoney(c.amount)}`)
    .join(", ");

  const prompt = `You are a personal finance coach for WiseWallet app. Analyze this budget overspend situation and give practical advice.
Always use Indian Rupee (₹) for amounts.

User: ${userName || "User"}
Account: ${accountName}
Monthly Budget: ${formatMoney(budgetAmount)}
Total Spent: ${formatMoney(totalExpenses)} (${percentageUsed.toFixed(1)}% of budget used)
Spending by category: ${categoryText || "No category data"}

Return ONLY valid JSON with this exact shape:
{
  "summary": "One friendly sentence about their spending situation",
  "topSpending": ["Category Name — ₹X spent, short note on why it matters", "..."],
  "savingsTips": ["Specific actionable tip to cut spending", "tip 2", "tip 3"]
}

Rules:
- topSpending: 2-3 items from highest categories
- savingsTips: 3 concrete, realistic tips (not generic)
- Keep each string under 120 characters
- Be direct and helpful, not preachy`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());

    return {
      summary:
        parsed.summary ||
        `You've used ${percentageUsed.toFixed(0)}% of your monthly budget — time to review where your money is going.`,
      topSpending: Array.isArray(parsed.topSpending) ? parsed.topSpending : [],
      savingsTips: Array.isArray(parsed.savingsTips) ? parsed.savingsTips : [],
    };
  } catch {
    const top = categories.slice(0, 3).map(
      (c) =>
        `${formatCategory(c.name)} — ${formatMoney(c.amount)} (${((c.amount / totalExpenses) * 100).toFixed(0)}% of spending)`
    );

    return {
      summary: `You've exceeded your ${formatMoney(budgetAmount)} budget by ${formatMoney(totalExpenses - budgetAmount)} this month.`,
      topSpending: top.length
        ? top
        : ["Review your recent transactions for unusual charges"],
      savingsTips: [
        "Pause non-essential purchases for the rest of this month",
        "Set a weekly spending cap for your top 2 categories",
        "Review subscriptions and recurring charges you can cancel",
      ],
    };
  }
}

const CATEGORY_COLORS = {
  housing: "#ef4444",
  food: "#f97316",
  groceries: "#84cc16",
  entertainment: "#a855f7",
  shopping: "#ec4899",
  transportation: "#06b6d4",
  utilities: "#6366f1",
  healthcare: "#14b8a6",
  travel: "#0ea5e9",
};

function categoryColor(name) {
  return CATEGORY_COLORS[name] || "#64748b";
}

function appBaseUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

function logoMarkSvg() {
  return `<svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
    <defs>
      <linearGradient id="ww-email-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ef4444"/>
        <stop offset="0.45" stop-color="#f97316"/>
        <stop offset="1" stop-color="#fbbf24"/>
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="13" fill="url(#ww-email-grad)"/>
    <rect x="13" y="19" width="22" height="15" rx="3.5" stroke="#ffffff" stroke-width="2.2" fill="none"/>
    <path d="M13 23.5h22" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="30.5" cy="26.5" r="2.2" fill="#ffffff"/>
  </svg>`;
}

export function renderBudgetAlertEmail({
  userName,
  accountName,
  budgetAmount,
  totalExpenses,
  percentageUsed,
  categories,
  insights,
  monthLabel,
  endOfMonth = new Date(),
}) {
  const remaining = budgetAmount - totalExpenses;
  const isOver = remaining < 0;
  const barWidth = Math.min(percentageUsed, 100);
  const barColor =
    percentageUsed >= 100 ? "#ef4444" : percentageUsed >= 80 ? "#f97316" : "#22c55e";
  const appUrl = appBaseUrl();

  const now = new Date();
  const daysRemaining = Math.max(endOfMonth.getDate() - now.getDate(), 0);
  const daysElapsed = Math.max(now.getDate(), 1);
  const avgDailySpend = totalExpenses / daysElapsed;
  const dailyAllowanceLeft =
    daysRemaining > 0 && remaining > 0 ? remaining / daysRemaining : 0;

  const categoryRows = categories
    .slice(0, 6)
    .map((c) => {
      const pct = totalExpenses ? (c.amount / totalExpenses) * 100 : 0;
      const color = categoryColor(c.name);
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>
            <span style="font-size:14px;color:#334155;">${formatCategory(c.name)}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:600;color:#0f172a;">
            ${formatMoney(c.amount)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;color:#64748b;width:60px;">
            ${pct.toFixed(0)}%
          </td>
        </tr>`;
    })
    .join("");

  const topSpendingHtml = (insights.topSpending || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 14px;background:#fff7ed;border-radius:10px;border:1px solid #fed7aa;">
          <span style="color:#f97316;margin-right:8px;font-size:10px;">●</span>
          <span style="font-size:14px;color:#334155;line-height:1.5;">${item}</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>`
    )
    .join("");

  const savingsHtml = (insights.savingsTips || [])
    .map(
      (tip, i) => `
      <tr>
        <td style="padding:12px 14px;background:#fffbeb;border-left:4px solid #f97316;border-radius:0 10px 10px 0;">
          <span style="font-size:13px;color:#f97316;font-weight:700;margin-right:8px;">${i + 1}.</span>
          <span style="font-size:14px;color:#334155;line-height:1.5;">${tip}</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>`
    )
    .join("");

  const statusBadge = isOver
    ? `<span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.35);border-radius:999px;font-size:12px;font-weight:600;color:#ffffff;letter-spacing:0.3px;">Over budget</span>`
    : percentageUsed >= 80
      ? `<span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.35);border-radius:999px;font-size:12px;font-weight:600;color:#ffffff;letter-spacing:0.3px;">Approaching limit</span>`
      : `<span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.35);border-radius:999px;font-size:12px;font-weight:600;color:#ffffff;letter-spacing:0.3px;">On track</span>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(249,115,22,0.12);border:1px solid #f1f5f9;">

        <!-- Branded header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ef4444 0%,#f97316 55%,#fbbf24 100%);padding:28px 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  ${logoMarkSvg()}
                  <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Wise<span style="opacity:0.95;">Wallet</span></span>
                </td>
                <td align="right" style="vertical-align:middle;">${statusBadge}</td>
              </tr>
            </table>
            <h1 style="margin:20px 0 0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Budget Alert</h1>
            <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.92);">${monthLabel} · ${accountName}</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 8px;font-size:16px;color:#0f172a;">Hi <strong>${userName || "there"}</strong>,</p>
            <p style="margin:0;font-size:15px;color:#64748b;line-height:1.65;">${insights.summary}</p>
          </td>
        </tr>

        <!-- Stats cards -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Budget</p>
                  <p style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">${formatMoney(budgetAmount)}</p>
                </td>
                <td width="4%"></td>
                <td width="33%" style="padding:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Spent</p>
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ea580c;">${formatMoney(totalExpenses)}</p>
                </td>
                <td width="4%"></td>
                <td width="33%" style="padding:16px;background:${isOver ? "#fef2f2" : "#f0fdf4"};border:1px solid ${isOver ? "#fecaca" : "#bbf7d0"};border-radius:14px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">${isOver ? "Over Budget" : "Remaining"}</p>
                  <p style="margin:0;font-size:20px;font-weight:700;color:${isOver ? "#ef4444" : "#16a34a"};">${isOver ? formatMoney(Math.abs(remaining)) : formatMoney(remaining)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Progress bar -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#64748b;padding-bottom:10px;">Budget used</td>
                <td align="right" style="font-size:14px;font-weight:700;color:${barColor};padding-bottom:10px;">${percentageUsed.toFixed(1)}%</td>
              </tr>
            </table>
            <div style="background:#f1f5f9;border-radius:999px;height:14px;overflow:hidden;">
              <div style="width:${barWidth}%;background:linear-gradient(90deg,#ef4444,#f97316);height:14px;border-radius:999px;"></div>
            </div>
          </td>
        </tr>

        <!-- Month snapshot -->
        <tr>
          <td style="padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed 0%,#fffbeb 100%);border:1px solid #fed7aa;border-radius:14px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.6px;">This month at a glance</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="33%" style="text-align:center;padding:8px;">
                        <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;">Days left</p>
                        <p style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">${daysRemaining}</p>
                      </td>
                      <td width="33%" style="text-align:center;padding:8px;border-left:1px solid #fed7aa;border-right:1px solid #fed7aa;">
                        <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;">Avg / day</p>
                        <p style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">${formatMoney(avgDailySpend)}</p>
                      </td>
                      <td width="33%" style="text-align:center;padding:8px;">
                        <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;">${isOver ? "Action" : "Safe / day"}</p>
                        <p style="margin:0;font-size:18px;font-weight:700;color:${isOver ? "#ef4444" : "#16a34a"};">${isOver ? "Cut back" : formatMoney(dailyAllowanceLeft)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Category breakdown -->
        ${categories.length ? `
        <tr>
          <td style="padding:0 40px 28px;">
            <h2 style="margin:0 0 16px;font-size:17px;font-weight:700;color:#0f172a;">Where you're spending</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding-bottom:8px;">Category</td>
                <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding-bottom:8px;text-align:right;">Amount</td>
                <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding-bottom:8px;text-align:right;">Share</td>
              </tr>
              ${categoryRows}
            </table>
          </td>
        </tr>` : ""}

        <!-- AI top spending -->
        ${topSpendingHtml ? `
        <tr>
          <td style="padding:0 40px 28px;">
            <h2 style="margin:0 0 16px;font-size:17px;font-weight:700;color:#0f172a;">AI spending analysis</h2>
            <table width="100%" cellpadding="0" cellspacing="0">${topSpendingHtml}</table>
          </td>
        </tr>` : ""}

        <!-- AI savings tips -->
        <tr>
          <td style="padding:0 40px 28px;">
            <h2 style="margin:0 0 16px;font-size:17px;font-weight:700;color:#0f172a;">Where you can save</h2>
            <table width="100%" cellpadding="0" cellspacing="0">${savingsHtml}</table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 32px;" align="center">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:10px;">
                  <a href="${appUrl}/dashboard" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#ef4444,#f97316);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;">Open Dashboard</a>
                </td>
                <td>
                  <a href="${appUrl}/reports" style="display:inline-block;padding:14px 28px;background:#ffffff;color:#ea580c;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;border:2px solid #fed7aa;">View Reports</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0 0 6px;font-size:14px;color:#64748b;">Sent by <strong style="font-weight:800;font-size:15px;"><span style="color:#f97316;">Wise</span><span style="color:#0f172a;">Wallet</span></strong></p>
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">AI-powered personal finance · Built for India, priced in INR</p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">You're receiving this because your budget crossed the alert threshold.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function buildBudgetAlertEmail(db, {
  userId,
  userName,
  accountId,
  accountName,
  budgetAmount,
  startOfMonth,
  endOfMonth,
}) {
  const stats = await getBudgetExpenseStats(
    db,
    userId,
    accountId,
    startOfMonth,
    endOfMonth
  );

  const percentageUsed = budgetAmount
    ? (stats.totalExpenses / budgetAmount) * 100
    : 0;

  const monthLabel = startOfMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const insights = await generateBudgetInsights({
    userName,
    accountName,
    budgetAmount,
    totalExpenses: stats.totalExpenses,
    percentageUsed,
    categories: stats.categories,
  });

  const html = renderBudgetAlertEmail({
    userName,
    accountName,
    budgetAmount,
    totalExpenses: stats.totalExpenses,
    percentageUsed,
    categories: stats.categories,
    insights,
    monthLabel,
    endOfMonth,
  });

  return { html, percentageUsed, totalExpenses: stats.totalExpenses, insights };
}
