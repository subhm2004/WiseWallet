"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { expenseCategories, formatCategoryName } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarLoader } from "react-spinners";

export function TransactionFilters() {
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    type: "",
    accountId: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });
  const [applied, setApplied] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.accounts.list().then(setAccounts).catch(console.error);
  }, []);

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await api.transactions.list({ ...params, limit: 100 });
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(applied);
  }, [applied, load]);

  const apply = () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category && filters.category !== "all") params.category = filters.category;
    if (filters.type && filters.type !== "all") params.type = filters.type;
    if (filters.accountId && filters.accountId !== "all") params.accountId = filters.accountId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.minAmount) params.minAmount = filters.minAmount;
    if (filters.maxAmount) params.maxAmount = filters.maxAmount;
    setApplied(params);
  };

  const clear = () => {
    setFilters({
      search: "",
      category: "",
      type: "",
      accountId: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
    });
    setApplied({});
  };

  const hasFilters = Object.keys(applied).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search description..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
          <Select
            value={filters.accountId || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, accountId: v === "all" ? "" : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, category: v === "all" ? "" : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {expenseCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.type || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, type: v === "all" ? "" : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            title="From date"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            title="To date"
          />
          <Input
            type="number"
            placeholder="Min amount (₹)"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Max amount (₹)"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={apply}>
            Apply filters
          </Button>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clear} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          <BarLoader width="100%" color="hsl(var(--primary))" />
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No transactions match your filters
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Account</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-3 max-w-[200px] truncate">
                      {t.description || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {t.account?.name || "—"}
                    </td>
                    <td className="p-3">{formatCategoryName(t.category)}</td>
                    <td
                      className={`p-3 text-right font-medium whitespace-nowrap ${
                        t.type === "INCOME" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatMoney(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground p-2 text-center">
              Showing {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
