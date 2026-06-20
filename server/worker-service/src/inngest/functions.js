import Groq from "groq-sdk";
import { db } from "@wisewallet/database";
import { SERVICE_PORTS, formatMoney } from "@wisewallet/shared";
import { inngest } from "./client.js";
import {
  buildBudgetAlertEmail,
  toNumber,
} from "../emails/budget-alert.js";
import {
  buildCategoryBudgetAlertEmail,
  getCategorySpending,
} from "../emails/category-budget-alert.js";
import {
  buildBillReminderEmail,
  daysUntil,
} from "../emails/bill-reminder.js";
import { buildWeeklyDigestEmail } from "../emails/weekly-digest.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL ||
  `http://localhost:${SERVICE_PORTS.NOTIFICATION}`;
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

async function sendEmail({ to, subject, html, userId, type, referenceId }) {
  const res = await fetch(`${NOTIFICATION_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_SECRET,
    },
    body: JSON.stringify({ to, subject, html, userId, type, referenceId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Notification service failed");
  }
  return res.json();
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

function isTransactionDue(transaction) {
  if (!transaction.lastProcessed) return true;
  return new Date(transaction.nextRecurringDate) <= new Date();
}

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

async function generateFinancialInsights(stats, month) {
  const prompt = `Analyze this financial data and provide 3 concise, actionable insights.
Focus on spending patterns and practical advice. Keep it friendly. Use Indian Rupee (₹) for amounts.

Financial Data for ${month}:
- Total Income: ${formatMoney(stats.totalIncome)}
- Total Expenses: ${formatMoney(stats.totalExpenses)}
- Net Income: ${formatMoney(stats.totalIncome - stats.totalExpenses)}
- Expense Categories: ${Object.entries(stats.byCategory)
    .map(([c, a]) => `${c}: ${formatMoney(a)}`)
    .join(", ")}

Format as JSON array of strings: ["insight 1", "insight 2", "insight 3"]`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const text = completion.choices[0]?.message?.content || "[]";
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
  } catch {
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

async function getMonthlyStats(userId, month) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = toNumber(t.amount);
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    { totalExpenses: 0, totalIncome: 0, byCategory: {} }
  );
}

// 1. Process a single recurring transaction (event-driven)
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "transaction/recurring.process" },
  async ({ event, step }) => {
    if (!event?.data?.transactionId || !event?.data?.userId) {
      return { error: "Missing required event data" };
    }

    return await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: { account: true },
      });

      if (!transaction || !isTransactionDue(transaction)) {
        return { skipped: true };
      }

      await db.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        const balanceChange =
          transaction.type === "EXPENSE"
            ? -toNumber(transaction.amount)
            : toNumber(transaction.amount);

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });

      return { processed: true, transactionId: transaction.id };
    });
  }
);

// 2. Daily cron — find due recurring txns & fire events
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              { nextRecurringDate: { lte: new Date() } },
            ],
          },
        });
      }
    );

    if (recurringTransactions.length > 0) {
      await step.sendEvent(
        "dispatch-recurring-events",
        recurringTransactions.map((transaction) => ({
          name: "transaction/recurring.process",
          data: {
            transactionId: transaction.id,
            userId: transaction.userId,
          },
        }))
      );
    }

    return { triggered: recurringTransactions.length };
  }
);

// 3. Monthly reports — 1st of every month
export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", () => db.user.findMany());

    for (const user of users) {
      await step.run(`report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        const stats = await getMonthlyStats(user.id, lastMonth);
        const insights = await generateFinancialInsights(stats, monthName);

        const html = `
          <h1>Monthly Financial Report - ${monthName}</h1>
          <p>Hello ${user.name || "there"},</p>
          <p>Total Income: ${formatMoney(stats.totalIncome)}</p>
          <p>Total Expenses: ${formatMoney(stats.totalExpenses)}</p>
          <p>Net: ${formatMoney(stats.totalIncome - stats.totalExpenses)}</p>
          <h2>AI Insights</h2>
          <ul>${insights.map((i) => `<li>${i}</li>`).join("")}</ul>
        `;

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          html,
          userId: user.id,
          type: "monthly-report",
        });
      });
    }

    return { processed: users.length };
  }
);

// 4. Budget alerts — cron + manual event from Inngest panel
export const checkBudgetAlerts = inngest.createFunction(
  {
    id: "check-budget-alerts",
    name: "Check Budget Alerts",
  },
  [{ cron: "0 */6 * * *" }, { event: "budget/alert.check" }],
  async ({ step, event }) => {
    const forceSend =
      event?.data?.force === true || process.env.NODE_ENV !== "production";

    const budgets = await step.run("fetch-budgets", () =>
      db.budget.findMany({
        include: {
          user: { include: { accounts: { where: { isDefault: true } } } },
        },
      })
    );

    const results = [];

    for (const budget of budgets) {
      const defaultAccount = budget.user?.accounts?.[0];
      if (!defaultAccount) {
        results.push({ budgetId: budget.id, action: "skipped", reason: "No default account" });
        continue;
      }

      const result = await step.run(`check-budget-${budget.id}`, async () => {
        const fresh = await db.budget.findUnique({
          where: { id: budget.id },
          include: {
            user: { include: { accounts: { where: { isDefault: true } } } },
          },
        });

        if (!fresh?.user?.email) {
          return { action: "skipped", reason: "User email not found" };
        }

        const account = fresh.user.accounts[0];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const expenses = await db.transaction.aggregate({
          where: {
            userId: fresh.userId,
            accountId: account.id,
            type: "EXPENSE",
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });

        const totalExpenses = toNumber(expenses._sum.amount);
        const budgetAmount = toNumber(fresh.amount);
        const percentageUsed = budgetAmount
          ? (totalExpenses / budgetAmount) * 100
          : 0;

        const alreadySentThisMonth =
          fresh.lastAlertSent &&
          !isNewMonth(new Date(fresh.lastAlertSent), now);

        if (percentageUsed < 80) {
          return {
            action: "skipped",
            reason: `Only ${percentageUsed.toFixed(1)}% used (need 80%+)`,
          };
        }

        if (!forceSend && alreadySentThisMonth) {
          return {
            action: "skipped",
            reason: `Alert already sent this month on ${new Date(fresh.lastAlertSent).toLocaleDateString()}`,
          };
        }

        const { html, percentageUsed: pct } = await buildBudgetAlertEmail(db, {
          userId: fresh.userId,
          userName: fresh.user.name,
          accountId: account.id,
          accountName: account.name,
          budgetAmount,
          startOfMonth,
          endOfMonth,
        });

        await sendEmail({
          to: fresh.user.email,
          subject: `⚠️ Budget Alert — ${pct.toFixed(0)}% used on ${account.name}`,
          html,
          userId: fresh.userId,
          type: "budget-alert",
        });

        await db.budget.update({
          where: { id: fresh.id },
          data: { lastAlertSent: new Date() },
        });

        return {
          action: "sent",
          to: fresh.user.email,
          percentageUsed: pct.toFixed(1),
        };
      });

      results.push({ budgetId: budget.id, ...result });
    }

    const alertsSent = results.filter((r) => r.action === "sent").length;
    return { alertsSent, results };
  }
);

// 5. Category budget alerts — cron every 6 hours
export const checkCategoryBudgetAlerts = inngest.createFunction(
  {
    id: "check-category-budget-alerts",
    name: "Check Category Budget Alerts",
  },
  [{ cron: "0 */6 * * *" }, { event: "budget/category-alert.check" }],
  async ({ step, event }) => {
    const forceSend =
      event?.data?.force === true || process.env.NODE_ENV !== "production";

    const categoryBudgets = await step.run("fetch-category-budgets", () =>
      db.categoryBudget.findMany({ include: { user: true } })
    );

    const results = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    for (const cb of categoryBudgets) {
      const result = await step.run(`check-cat-${cb.id}`, async () => {
        if (!cb.user?.email) {
          return { action: "skipped", reason: "No email" };
        }

        const spent = await getCategorySpending(
          db,
          cb.userId,
          cb.category,
          startOfMonth,
          endOfMonth
        );
        const budgetAmount = toNumber(cb.amount);
        const percentageUsed = budgetAmount ? (spent / budgetAmount) * 100 : 0;

        const alreadySentThisMonth =
          cb.lastAlertSent && !isNewMonth(new Date(cb.lastAlertSent), now);

        if (percentageUsed < 80) {
          return {
            action: "skipped",
            reason: `${percentageUsed.toFixed(0)}% used (need 80%+)`,
          };
        }

        if (!forceSend && alreadySentThisMonth) {
          return { action: "skipped", reason: "Already sent this month" };
        }

        const { subject, html } = buildCategoryBudgetAlertEmail({
          userName: cb.user.name,
          category: cb.category,
          budgetAmount,
          spent,
          percentageUsed,
        });

        await sendEmail({
          to: cb.user.email,
          subject,
          html,
          userId: cb.userId,
          type: "category-budget-alert",
          referenceId: `cat-budget-${cb.id}-${now.getFullYear()}-${now.getMonth()}`,
        });

        await db.categoryBudget.update({
          where: { id: cb.id },
          data: { lastAlertSent: new Date() },
        });

        return { action: "sent", category: cb.category, percentageUsed };
      });
      results.push({ id: cb.id, ...result });
    }

    return { sent: results.filter((r) => r.action === "sent").length, results };
  }
);

// 6. Bill reminders — daily at 9 AM
export const sendBillReminders = inngest.createFunction(
  {
    id: "send-bill-reminders",
    name: "Send Bill Reminders",
  },
  [{ cron: "0 9 * * *" }, { event: "bill/reminder.check" }],
  async ({ step, event }) => {
    const forceSend = event?.data?.force === true;
    // Dev: look 30 days ahead so manual Inngest runs find monthly bills (prod cron uses 3)
    const maxDays =
      event?.data?.daysAhead ??
      (process.env.NODE_ENV !== "production" ? 30 : 3);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + maxDays);
    horizon.setHours(23, 59, 59, 999);

    const recurring = await step.run("fetch-due-bills", () =>
      db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          nextRecurringDate: { gte: now, lte: horizon },
        },
        include: { user: true },
      })
    );

    const results = [];

    for (const tx of recurring) {
      const result = await step.run(`bill-${tx.id}`, async () => {
        const dueDate = tx.nextRecurringDate
          ? new Date(tx.nextRecurringDate)
          : null;
        if (!tx.user?.email || !dueDate || Number.isNaN(dueDate.getTime())) {
          return { action: "skipped", reason: "Missing data" };
        }

        const refId = `bill-${tx.id}-${dueDate.toISOString().slice(0, 10)}`;

        if (!forceSend) {
          const existing = await db.emailLog.findFirst({
            where: { referenceId: refId, status: "sent" },
          });
          if (existing) {
            return { action: "skipped", reason: "Already reminded" };
          }
        }

        const days = daysUntil(dueDate);
        const { subject, html } = buildBillReminderEmail({
          userName: tx.user.name,
          description: tx.description,
          amount: toNumber(tx.amount),
          dueDate,
          daysUntil: days,
          category: tx.category,
        });

        await sendEmail({
          to: tx.user.email,
          subject,
          html,
          userId: tx.userId,
          type: "bill-reminder",
          referenceId: refId,
        });

        return { action: "sent", description: tx.description, daysUntil: days };
      });
      results.push({ id: tx.id, ...result });
    }

    const sent = results.filter((r) => r.action === "sent").length;
    return {
      sent,
      maxDays,
      billsFound: recurring.length,
      hint:
        sent === 0
          ? `No recurring bills due in the next ${maxDays} days. Add a recurring transaction (Subscriptions page) or invoke with {"force": true, "daysAhead": 60}.`
          : undefined,
      results,
    };
  }
);

// 7. Weekly digest — every Monday 9 AM
export const sendWeeklyDigests = inngest.createFunction(
  {
    id: "send-weekly-digests",
    name: "Send Weekly Digests",
  },
  [{ cron: "0 9 * * 1" }, { event: "digest/weekly.send" }],
  async ({ step, event }) => {
    const forceSend = event?.data?.force === true;

    const users = await step.run("fetch-users", () =>
      db.user.findMany({ where: { email: { not: "" } } })
    );

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekLabel = `${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

    const results = [];

    for (const user of users) {
      const result = await step.run(`weekly-${user.id}`, async () => {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);

        const transactions = await db.transaction.findMany({
          where: { userId: user.id, date: { gte: start, lte: now } },
        });

        if (!forceSend && transactions.length === 0) {
          return { action: "skipped", reason: "No activity this week" };
        }

        const stats = transactions.reduce(
          (acc, t) => {
            const amount = toNumber(t.amount);
            if (t.type === "EXPENSE") {
              acc.expenses += amount;
              acc.byCategory[t.category] = (acc.byCategory[t.category] || 0) + amount;
            } else {
              acc.income += amount;
            }
            return acc;
          },
          { income: 0, expenses: 0, byCategory: {} }
        );

        const topCategories = Object.entries(stats.byCategory)
          .map(([name, amount]) => ({
            name: name
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
            amount,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        const refId = `weekly-${user.id}-${now.toISOString().slice(0, 10)}`;
        if (!forceSend) {
          const existing = await db.emailLog.findFirst({
            where: { referenceId: refId, status: "sent" },
          });
          if (existing) {
            return { action: "skipped", reason: "Already sent this week" };
          }
        }

        const { subject, html } = buildWeeklyDigestEmail({
          userName: user.name,
          weekLabel,
          income: stats.income,
          expenses: stats.expenses,
          net: stats.income - stats.expenses,
          topCategories,
        });

        await sendEmail({
          to: user.email,
          subject,
          html,
          userId: user.id,
          type: "weekly-digest",
          referenceId: refId,
        });

        return { action: "sent", transactions: transactions.length };
      });
      results.push({ userId: user.id, ...result });
    }

    return { sent: results.filter((r) => r.action === "sent").length, results };
  }
);

export const inngestFunctions = [
  processRecurringTransaction,
  triggerRecurringTransactions,
  generateMonthlyReports,
  checkBudgetAlerts,
  checkCategoryBudgetAlerts,
  sendBillReminders,
  sendWeeklyDigests,
];
