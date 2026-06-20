"use client";

import { useEffect, useState, useCallback } from "react";
import { BarLoader } from "react-spinners";
import {
  RefreshCw,
  Calendar,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Bell,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { formatCategoryName } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RecurringBillForm } from "./_components/recurring-bill-form";

const INTERVAL_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <Card className="border-orange-500/10 bg-gradient-to-br from-muted/40 to-transparent overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <p className={`text-3xl sm:text-4xl font-bold tracking-tight ${accent || ""}`}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              <Icon className="h-5 w-5 text-orange-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BillCard({ sub, onEdit, onRemove }) {
  return (
    <Card className="group border-orange-500/10 hover:border-orange-500/25 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-200">
      <CardContent className="flex items-center gap-5 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20">
          <CreditCard className="h-7 w-7 text-orange-500" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold truncate">
            {sub.description || formatCategoryName(sub.category)}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {formatCategoryName(sub.category)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {INTERVAL_LABELS[sub.recurringInterval] || sub.recurringInterval}
            </Badge>
            {sub.accountName && (
              <span className="text-xs text-muted-foreground">{sub.accountName}</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-2xl font-bold text-orange-500">
            {formatMoney(sub.monthlyCost)}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatMoney(sub.amount)} per cycle
          </p>
          {sub.nextRecurringDate && (
            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1.5 mt-2">
              <Calendar className="h-3.5 w-3.5" />
              Next: {new Date(sub.nextRecurringDate).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>

        <div className="flex gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await api.recurring.list();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeBill = async (id, name) => {
    if (!confirm(`Stop tracking "${name}" as recurring?`)) return;
    try {
      await api.recurring.remove(id);
      toast.success("Recurring bill removed");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <BarLoader width={200} color="hsl(var(--primary))" />
      </div>
    );
  }

  const { subscriptions = [], totalMonthly = 0, count = 0 } = data || {};
  const isEmpty = subscriptions.length === 0;

  if (isEmpty && (showForm || editingBill)) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 relative w-fit">
            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl scale-125" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30">
              <RefreshCw className="h-12 w-12 text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold gradient-title">Add recurring bill</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Set up reminders for Netflix, rent, gym & more
          </p>
        </div>
        <RecurringBillForm
          bill={editingBill}
          onSaved={() => {
            setShowForm(false);
            setEditingBill(null);
            load();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingBill(null);
          }}
        />
      </div>
    );
  }

  if (isEmpty && !showForm && !editingBill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-3xl scale-150" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30">
            <RefreshCw className="h-16 w-16 text-orange-500" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 gradient-title">
          Recurring Bills
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8 leading-relaxed">
          Netflix, rent, gym — track subscriptions and get email reminders before each due date.
        </p>

        <Button
          size="lg"
          className="gap-2 px-8 h-12 text-base shadow-lg shadow-orange-500/20"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-5 w-5" />
          Add your first bill
        </Button>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full text-left">
          {[
            { icon: Receipt, title: "Add bills", desc: "Spotify, Netflix, rent, EMI" },
            { icon: Bell, title: "Get reminders", desc: "Email alerts before due date" },
            { icon: TrendingUp, title: "Track spending", desc: "Monthly & yearly cost summary" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-muted/30 px-5 py-4 flex gap-3">
              <Icon className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-12 space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-title">Recurring Bills</h1>
          <p className="text-muted-foreground mt-2">
            Netflix, rent, gym — manage subscriptions & bill reminders
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 shrink-0 shadow-md shadow-orange-500/10"
          onClick={() => {
            setEditingBill(null);
            setShowForm((v) => !v);
          }}
        >
          <Plus className="h-5 w-5" />
          Add Bill
        </Button>
      </div>

      {(showForm || editingBill) && (
        <RecurringBillForm
          bill={editingBill}
          onSaved={() => {
            setShowForm(false);
            setEditingBill(null);
            load();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingBill(null);
          }}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Bills" value={count} icon={Receipt} />
        <StatCard
          label="Monthly Cost"
          value={formatMoney(totalMonthly)}
          accent="text-orange-500"
          icon={CreditCard}
        />
        <StatCard
          label="Yearly Estimate"
          value={formatMoney(totalMonthly * 12)}
          icon={TrendingUp}
        />
      </div>

      {/* Bill list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-center sm:text-left">
          Your Bills
          <span className="text-muted-foreground font-normal ml-2">({count})</span>
        </h2>
        {subscriptions.map((sub) => (
          <BillCard
            key={sub.id}
            sub={sub}
            onEdit={() => {
              setShowForm(false);
              setEditingBill(sub);
            }}
            onRemove={() => removeBill(sub.id, sub.description)}
          />
        ))}
      </div>
    </div>
  );
}
