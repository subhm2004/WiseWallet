"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { expenseCategories } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INTERVALS = [
  { id: "DAILY", label: "Daily" },
  { id: "WEEKLY", label: "Weekly" },
  { id: "MONTHLY", label: "Monthly" },
  { id: "YEARLY", label: "Yearly" },
];

export function RecurringBillForm({ bill, onSaved, onCancel }) {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("entertainment");
  const [interval, setInterval] = useState("MONTHLY");
  const [nextDueDate, setNextDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(bill?.id);

  useEffect(() => {
    api.accounts.list().then((data) => {
      setAccounts(data);
      if (!bill) {
        const def = data.find((a) => a.isDefault) || data[0];
        if (def) setAccountId(def.id);
      }
    });
  }, [bill]);

  useEffect(() => {
    if (bill) {
      setDescription(bill.description || "");
      setAmount(String(bill.amount || ""));
      setCategory(bill.category || "other");
      setInterval(bill.recurringInterval || "MONTHLY");
      setNextDueDate(
        bill.nextRecurringDate
          ? new Date(bill.nextRecurringDate).toISOString().slice(0, 10)
          : ""
      );
    } else {
      setDescription("");
      setAmount("");
      setCategory("entertainment");
      setInterval("MONTHLY");
      setNextDueDate(new Date().toISOString().slice(0, 10));
    }
  }, [bill]);

  const save = async () => {
    const parsed = parseFloat(amount);
    if (!description.trim() || isNaN(parsed) || parsed <= 0) {
      toast.error("Name and valid amount required");
      return;
    }
    if (!isEdit && !accountId) {
      toast.error("Pehle ek bank account banao ya select karo");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.recurring.update(bill.id, {
          description: description.trim(),
          amount: parsed,
          category,
          recurringInterval: interval,
          nextDueDate: nextDueDate || undefined,
        });
        toast.success("Bill updated");
      } else {
        await api.recurring.create({
          accountId,
          description: description.trim(),
          amount: parsed,
          category,
          recurringInterval: interval,
          nextDueDate: nextDueDate || undefined,
        });
        toast.success("Recurring bill added");
      }
      onSaved?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEdit ? "Edit recurring bill" : "Add recurring bill"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Netflix, Rent, Gym..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {!isEdit && (
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={interval} onValueChange={setInterval}>
          <SelectTrigger>
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            {INTERVALS.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={nextDueDate}
          onChange={(e) => setNextDueDate(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update" : "Add bill"}
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
