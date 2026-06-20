"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

function GoalForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [target, setTarget] = useState(initial?.targetAmount?.toString() || "");
  const [saved, setSaved] = useState(initial?.savedAmount?.toString() || "0");
  const [deadline, setDeadline] = useState(
    initial?.deadline ? initial.deadline.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const targetAmount = parseFloat(target);
    const savedAmount = parseFloat(saved);
    if (!name.trim() || isNaN(targetAmount) || targetAmount <= 0) {
      toast.error("Enter goal name and target amount");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        targetAmount,
        savedAmount: isNaN(savedAmount) ? 0 : savedAmount,
        deadline: deadline || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <Input placeholder="Goal name (e.g. Emergency Fund)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Target ₹" value={target} onChange={(e) => setTarget(e.target.value)} />
        <Input type="number" placeholder="Saved ₹" value={saved} onChange={(e) => setSaved(e.target.value)} />
      </div>
      <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save Goal"}
        </Button>
      </div>
    </div>
  );
}

export function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.budgets.listGoals().then(setGoals).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data) => {
    try {
      await api.budgets.createGoal(data);
      toast.success("Goal created");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.budgets.updateGoal(editing.id, data);
      toast.success("Goal updated");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.budgets.deleteGoal(id);
      toast.success("Goal deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-500" />
          Savings Goals
        </CardTitle>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>New Savings Goal</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              <GoalForm onSave={handleCreate} onCancel={() => setOpen(false)} />
            </div>
          </DrawerContent>
        </Drawer>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Set a goal — emergency fund, vacation, new phone...
          </p>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="space-y-2 p-3 rounded-lg border bg-muted/20">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{goal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(goal.savedAmount)} of {formatMoney(goal.targetAmount)}
                    {goal.deadline && (
                      <> · by {new Date(goal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(goal)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Progress value={goal.percentComplete} extraStyles="bg-orange-500" />
              <p className="text-xs text-right text-muted-foreground">
                {goal.percentComplete}% complete
              </p>
            </div>
          ))
        )}
      </CardContent>

      <Drawer open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Goal</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {editing && (
              <GoalForm
                initial={editing}
                onSave={handleUpdate}
                onCancel={() => setEditing(null)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </Card>
  );
}
