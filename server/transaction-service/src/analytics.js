import { db } from "@wisewallet/database";
import { formatMoney } from "@wisewallet/shared";

function monthLabel(date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function aggregateTransactions(transactions) {
  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.expenses += amount;
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.income += amount;
      }
      return stats;
    },
    { income: 0, expenses: 0, byCategory: {} }
  );
}

export async function getMonthlyAnalytics(userId, months = 6) {
  const now = new Date();
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const transactions = await db.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
    });

    const stats = aggregateTransactions(transactions);
    results.push({
      month: monthLabel(monthDate),
      monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      income: Math.round(stats.income * 100) / 100,
      expenses: Math.round(stats.expenses * 100) / 100,
      net: Math.round((stats.income - stats.expenses) * 100) / 100,
      byCategory: stats.byCategory,
    });
  }

  return results;
}

export async function getOverview(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [accounts, monthTransactions, allTransactions, budget, recurring] =
    await Promise.all([
      db.account.findMany({ where: { userId } }),
      db.transaction.findMany({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      db.transaction.count({ where: { userId } }),
      db.budget.findFirst({ where: { userId } }),
      db.transaction.count({
        where: { userId, isRecurring: true },
      }),
    ]);

  const monthStats = aggregateTransactions(monthTransactions);
  const netWorth = accounts.reduce((sum, a) => sum + a.balance.toNumber(), 0);

  const topCategory = Object.entries(monthStats.byCategory).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return {
    netWorth: Math.round(netWorth * 100) / 100,
    accountCount: accounts.length,
    monthlyIncome: Math.round(monthStats.income * 100) / 100,
    monthlyExpenses: Math.round(monthStats.expenses * 100) / 100,
    monthlyNet: Math.round((monthStats.income - monthStats.expenses) * 100) / 100,
    transactionCount: allTransactions,
    recurringCount: recurring,
    budgetAmount: budget ? budget.amount.toNumber() : null,
    topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
  };
}

export async function getNetWorthTimeline(userId, months = 6) {
  const accounts = await db.account.findMany({ where: { userId } });
  const currentNetWorth = accounts.reduce((sum, a) => sum + a.balance.toNumber(), 0);

  const allTx = await db.transaction.findMany({
    where: { userId },
    select: { type: true, amount: true, date: true },
  });

  const now = new Date();
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    let changeAfter = 0;
    for (const t of allTx) {
      if (new Date(t.date) > end) {
        const amt = t.amount.toNumber();
        changeAfter += t.type === "INCOME" ? amt : -amt;
      }
    }

    results.push({
      month: monthDate.toLocaleString("en-US", { month: "short", year: "numeric" }),
      monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      netWorth: Math.round((currentNetWorth - changeAfter) * 100) / 100,
    });
  }

  return results;
}

export async function getWeeklyStats(userId) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: start, lte: now } },
  });

  return aggregateTransactions(transactions);
}

export async function buildFinanceContext(userId) {
  const [overview, monthly, recent] = await Promise.all([
    getOverview(userId),
    getMonthlyAnalytics(userId, 3),
    db.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 15,
    }),
  ]);

  const recentLines = recent
    .map(
      (t) =>
        `${t.type} ${formatMoney(t.amount.toNumber())} - ${t.category} - ${t.description || "N/A"} (${t.date.toISOString().slice(0, 10)})`
    )
    .join("\n");

  return {
    overview,
    monthly,
    recentLines,
  };
}

export function transactionsToCsv(transactions) {
  const header = "Date,Type,Category,Description,Amount,Account\n";
  const rows = transactions
    .map((t) => {
      const date = t.date.toISOString().slice(0, 10);
      const desc = (t.description || "").replace(/"/g, '""');
      const account = (t.account?.name || "").replace(/"/g, '""');
      return `${date},${t.type},${t.category},"${desc}",${t.amount.toNumber()},"${account}"`;
    })
    .join("\n");
  return header + rows;
}
