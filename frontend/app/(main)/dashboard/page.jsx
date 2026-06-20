"use client";

import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { api } from "@/lib/api";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BarChart3, RefreshCw } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";
import { NetWorthCard } from "./_components/net-worth-card";
import { NetWorth3DChart } from "./_components/net-worth-3d-chart";
import { AiFinanceCoach } from "./_components/ai-coach";
import { HealthScoreCard } from "./_components/health-score-card";
import { CategoryBudgets } from "./_components/category-budgets";
import { SavingsGoals } from "./_components/savings-goals";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  isWidgetVisible,
} from "@/lib/dashboard-widgets";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [netWorthTimeline, setNetWorthTimeline] = useState([]);
  const [widgetPrefs, setWidgetPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  const show = (id) => isWidgetVisible(widgetPrefs, id);

  const loadData = async () => {
    try {
      const [accountsData, transactionsData, overviewData, timelineData, healthData, meData] =
        await Promise.all([
          api.accounts.list(),
          api.transactions.list(),
          api.analytics.overview(),
          api.analytics.netWorthTimeline(6),
          api.analytics.healthScore().catch(() => null),
          api.auth.getMe().catch(() => null),
        ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
      setOverview(overviewData);
      setNetWorthTimeline(timelineData);
      setHealthScore(healthData);
      setWidgetPrefs(meData?.user?.dashboardWidgets ?? null);

      const defaultAccount = accountsData?.find((a) => a.isDefault);
      if (defaultAccount?.id) {
        const budget = await api.budgets.get(defaultAccount.id);
        setBudgetData(budget);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <BarLoader className="mt-4" width={"100%"} color="hsl(var(--primary))" />;
  }

  return (
    <div className="space-y-8 w-full">
      {show("netWorth") && <NetWorthCard overview={overview} />}

      {show("healthScore") && (
        <HealthScoreCard data={healthScore} loading={loading} />
      )}

      {show("netWorth3d") && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-1">Net worth — last 6 months</h3>
            <p className="text-sm text-muted-foreground mb-4">
              3D timeline of your total balance
            </p>
            <NetWorth3DChart data={netWorthTimeline} />
          </CardContent>
        </Card>
      )}

      {show("budgetProgress") && (
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
          onBudgetUpdate={loadData}
        />
      )}

      {(show("categoryBudgets") || show("savingsGoals")) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {show("categoryBudgets") && <CategoryBudgets />}
          {show("savingsGoals") && <SavingsGoals />}
        </div>
      )}

      {(show("aiCoach") || show("reportsLink") || show("subscriptionsLink")) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {show("aiCoach") && <AiFinanceCoach />}
          {show("reportsLink") && (
            <Card className="flex flex-col justify-center items-center text-center p-8">
              <BarChart3 className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Monthly Reports</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                View 6-month trends, category breakdown, and AI insights.
              </p>
              <Link href="/reports">
                <Button>View Reports</Button>
              </Link>
            </Card>
          )}
          {show("subscriptionsLink") && (
            <Card className="flex flex-col justify-center items-center text-center p-8">
              <RefreshCw className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Subscriptions</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Track recurring expenses — Netflix, gym, rent and more.
              </p>
              <Link href="/subscriptions">
                <Button variant="outline">View Subscriptions</Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {show("transactionOverview") && (
        <DashboardOverview accounts={accounts} transactions={transactions} />
      )}

      {show("accounts") && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer onSuccess={loadData}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
              <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
                <Plus className="h-10 w-10 mb-2" />
                <p className="text-sm font-medium">Add New Account</p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              accounts={accounts}
              onUpdate={loadData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
