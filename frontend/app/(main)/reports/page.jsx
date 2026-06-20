"use client";

import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { Sparkles, TrendingUp, TrendingDown, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MonthlyTrendChart } from "./_components/monthly-trend-chart";
import { CategoryDonutChart } from "./_components/category-donut-chart";
import { TransactionFilters } from "./_components/transaction-filters";
import { NetWorthCard } from "../dashboard/_components/net-worth-card";

export default function ReportsPage() {
  const [monthly, setMonthly] = useState([]);
  const [overview, setOverview] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [monthlyData, overviewData, categoryBreakdown, insightsData] =
          await Promise.all([
            api.analytics.monthly(6),
            api.analytics.overview(),
            api.analytics.categoryBreakdown(),
            api.analytics.monthlyInsights(),
          ]);
        setMonthly(monthlyData);
        setOverview(overviewData);
        setCategoryData(categoryBreakdown);
        setInsights(insightsData.insights || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        setInsightsLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <BarLoader className="mt-4" width="100%" color="hsl(var(--primary))" />;
  }

  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  const expenseChange =
    previous && current
      ? ((current.expenses - previous.expenses) / (previous.expenses || 1)) * 100
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold sr-only">Reports</h1>
        <Button
          variant="outline"
          size="sm"
          disabled={exportingPdf}
          onClick={async () => {
            setExportingPdf(true);
            try {
              await api.analytics.exportPdf();
              toast.success("PDF report downloaded");
            } catch (e) {
              toast.error(e.message);
            } finally {
              setExportingPdf(false);
            }
          }}
        >
          <FileText className="h-4 w-4 mr-2" />
          {exportingPdf ? "Generating..." : "Export PDF"}
        </Button>
      </div>

      <NetWorthCard overview={overview} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              This Month Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${(current?.net || 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {formatMoney(current?.net || 0, { showSign: true })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              Expense Change
              {expenseChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-emerald-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {expenseChange > 0 ? "+" : ""}
              {expenseChange.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              AI Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2 w-full">
                Ask a question
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyTrendChart data={monthly} />
        <CategoryDonutChart data={categoryData} />
      </div>

      <TransactionFilters />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            AI Monthly Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <BarLoader width="100%" color="hsl(var(--primary))" />
          ) : (
            <ul className="space-y-3">
              {insights.map((insight, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm leading-relaxed"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
