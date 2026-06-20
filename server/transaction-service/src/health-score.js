import { db } from "@wisewallet/database";
import { getOverview } from "./analytics.js";

function monthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

export async function getHealthScore(userId) {
  const [overview, categoryBudgets, { start, end }] = await Promise.all([
    getOverview(userId),
    db.categoryBudget.findMany({ where: { userId } }),
    Promise.resolve(monthRange()),
  ]);

  const monthExpenses = await db.transaction.findMany({
    where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
  });

  const byCategory = monthExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount.toNumber();
    return acc;
  }, {});

  let score = 0;
  const factors = [];

  if (overview.budgetAmount) {
    const ratio = overview.monthlyExpenses / overview.budgetAmount;
    const budgetScore = ratio <= 1 ? 30 : Math.max(0, 30 - (ratio - 1) * 30);
    score += budgetScore;
    factors.push({
      name: "Budget adherence",
      score: Math.round(budgetScore),
      max: 30,
      tip: ratio > 1 ? "Spending exceeded your monthly budget" : null,
    });
  } else {
    factors.push({
      name: "Budget adherence",
      score: 0,
      max: 30,
      tip: "Set a monthly budget to improve your score",
    });
  }

  if (overview.monthlyIncome > 0) {
    const savingsRate =
      (overview.monthlyIncome - overview.monthlyExpenses) / overview.monthlyIncome;
    const savingsScore = Math.min(25, Math.max(0, savingsRate * 25));
    score += savingsScore;
    factors.push({
      name: "Savings rate",
      score: Math.round(savingsScore),
      max: 25,
      tip: savingsRate < 0.1 ? "Try to save at least 10% of income" : null,
    });
  } else {
    const fallback = overview.monthlyNet >= 0 ? 15 : 5;
    score += fallback;
    factors.push({ name: "Savings rate", score: fallback, max: 25 });
  }

  if (categoryBudgets.length > 0) {
    let catScore = 0;
    categoryBudgets.forEach((cb) => {
      const spent = byCategory[cb.category] || 0;
      const limit = cb.amount.toNumber();
      const share = 20 / categoryBudgets.length;
      if (spent <= limit) catScore += share;
      else catScore += Math.max(0, share * (1 - (spent - limit) / (limit || 1)));
    });
    score += catScore;
    factors.push({
      name: "Category budgets",
      score: Math.round(catScore),
      max: 20,
    });
  } else {
    score += 10;
    factors.push({
      name: "Category budgets",
      score: 10,
      max: 20,
      tip: "Set per-category limits for better control",
    });
  }

  const cashFlowScore =
    overview.monthlyNet >= 0
      ? 15
      : Math.max(0, 15 + overview.monthlyNet / Math.max(overview.monthlyExpenses, 1) / 0.1);
  score += cashFlowScore;
  factors.push({
    name: "Cash flow",
    score: Math.round(cashFlowScore),
    max: 15,
    tip: overview.monthlyNet < 0 ? "Expenses exceed income this month" : null,
  });

  const activityScore = overview.transactionCount >= 5 ? 10 : overview.transactionCount >= 1 ? 6 : 0;
  score += activityScore;
  factors.push({
    name: "Tracking activity",
    score: activityScore,
    max: 10,
    tip: activityScore < 10 ? "Log more transactions to stay on top" : null,
  });

  const finalScore = Math.round(Math.min(100, Math.max(0, score)));
  const grade =
    finalScore >= 80
      ? "Excellent"
      : finalScore >= 60
        ? "Good"
        : finalScore >= 40
          ? "Fair"
          : "Needs work";

  return { score: finalScore, grade, factors };
}

export async function getCategoryBreakdown(userId) {
  const { start, end } = monthRange();
  const transactions = await db.transaction.findMany({
    where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
  });

  const byCategory = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount.toNumber();
    return acc;
  }, {});

  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);

  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getSubscriptions(userId) {
  const recurring = await db.transaction.findMany({
    where: { userId, isRecurring: true, type: "EXPENSE" },
    orderBy: { amount: "desc" },
    include: { account: true },
  });

  function monthlyEquivalent(amount, interval) {
    switch (interval) {
      case "DAILY":
        return amount * 30;
      case "WEEKLY":
        return amount * 4.33;
      case "MONTHLY":
        return amount;
      case "YEARLY":
        return amount / 12;
      default:
        return amount;
    }
  }

  const subscriptions = recurring.map((t) => {
    const amount = t.amount.toNumber();
    const monthlyCost =
      Math.round(monthlyEquivalent(amount, t.recurringInterval) * 100) / 100;
    return {
      id: t.id,
      description: t.description,
      category: t.category,
      amount,
      recurringInterval: t.recurringInterval,
      nextRecurringDate: t.nextRecurringDate,
      monthlyCost,
      accountName: t.account?.name,
    };
  });

  const totalMonthly =
    Math.round(subscriptions.reduce((s, t) => s + t.monthlyCost, 0) * 100) / 100;

  return { subscriptions, totalMonthly, count: subscriptions.length };
}
