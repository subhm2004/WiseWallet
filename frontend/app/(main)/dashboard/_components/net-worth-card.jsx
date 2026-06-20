"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Repeat } from "lucide-react";
import { formatMoney } from "@/lib/currency";

export function NetWorthCard({ overview }) {
  if (!overview) return null;

  const isPositive = overview.monthlyNet >= 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 w-full">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium text-muted-foreground">
            Net Worth
          </CardTitle>
          <Wallet className="h-5 w-5 text-orange-500" />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-3xl xl:text-4xl font-bold tracking-tight">{formatMoney(overview.netWorth, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Across {overview.accountCount} account{overview.accountCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium text-muted-foreground">
            This Month Income
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-3xl xl:text-4xl font-bold tracking-tight text-emerald-600">
            {formatMoney(overview.monthlyIncome)}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium text-muted-foreground">
            This Month Expenses
          </CardTitle>
          <TrendingDown className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-3xl xl:text-4xl font-bold tracking-tight text-red-500">
            {formatMoney(overview.monthlyExpenses)}
          </p>
          {overview.topCategory && (
            <p className="text-sm text-muted-foreground mt-2">
              Top: {overview.topCategory.name}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium text-muted-foreground">
            Monthly Net
          </CardTitle>
          <Repeat className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent className="pt-0">
          <p
            className={`text-3xl xl:text-4xl font-bold tracking-tight ${isPositive ? "text-emerald-600" : "text-red-500"}`}
          >
            {formatMoney(overview.monthlyNet, { showSign: true })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {overview.recurringCount} recurring · {overview.transactionCount} total txns
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
