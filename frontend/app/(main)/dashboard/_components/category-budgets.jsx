"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, PieChart } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { expenseCategories, formatCategoryName, getCategoryColor } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CategoryBudgets() {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.budgets.listCategories().then(setItems).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const usedCategories = new Set(items.map((i) => i.category));
  const available = expenseCategories.filter((c) => !usedCategories.has(c.id));

  const handleAdd = async () => {
    const val = parseFloat(amount);
    if (!category || isNaN(val) || val <= 0) {
      toast.error("Select category and enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await api.budgets.upsertCategory(category, val);
      toast.success("Category budget saved");
      setAdding(false);
      setCategory("");
      setAmount("");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    try {
      await api.budgets.deleteCategory(cat);
      toast.success("Category budget removed");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChart className="h-4 w-4 text-orange-500" />
          Category Budgets
        </CardTitle>
        {!adding && available.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="flex flex-wrap gap-2 items-end p-3 rounded-lg border bg-muted/30">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Limit ₹"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 h-9"
            />
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        {items.length === 0 && !adding ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Set limits per category — e.g. Food ₹5,000, Travel ₹3,000
          </p>
        ) : (
          items.map((item) => {
            const pct = item.percentUsed || 0;
            const color = getCategoryColor(item.category);
            return (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {formatCategoryName(item.category)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {formatMoney(item.spent)} / {formatMoney(item.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.category)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={Math.min(pct, 100)}
                  extraStyles={
                    pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-green-500"
                  }
                />
                {pct >= 100 && (
                  <p className="text-xs text-red-500">
                    Over budget by {formatMoney(Math.abs(item.remaining))}
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
