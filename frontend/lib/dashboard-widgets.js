export const DASHBOARD_WIDGETS = [
  { id: "netWorth", label: "Net Worth", description: "Total balance overview" },
  { id: "healthScore", label: "Health Score", description: "Financial health rating" },
  { id: "netWorth3d", label: "3D Timeline", description: "Net worth chart" },
  { id: "budgetProgress", label: "Monthly Budget", description: "Budget vs spending" },
  { id: "categoryBudgets", label: "Category Budgets", description: "Per-category limits" },
  { id: "savingsGoals", label: "Savings Goals", description: "Goal progress" },
  { id: "aiCoach", label: "AI Coach", description: "Ask finance questions" },
  { id: "reportsLink", label: "Reports Card", description: "Link to reports" },
  { id: "subscriptionsLink", label: "Subscriptions Card", description: "Link to bills" },
  { id: "transactionOverview", label: "Recent Activity", description: "Latest transactions" },
  { id: "accounts", label: "Accounts", description: "Your bank accounts" },
];

export const DEFAULT_DASHBOARD_WIDGETS = DASHBOARD_WIDGETS.map((w) => w.id);

export function normalizeDashboardWidgets(widgets) {
  if (!Array.isArray(widgets) || widgets.length === 0) {
    return DEFAULT_DASHBOARD_WIDGETS;
  }
  const valid = new Set(DASHBOARD_WIDGETS.map((w) => w.id));
  return widgets.filter((id) => valid.has(id));
}

export function isWidgetVisible(widgets, id) {
  return normalizeDashboardWidgets(widgets).includes(id);
}
