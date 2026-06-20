"use client";

import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import {
  Users,
  Plus,
  Trash2,
  IndianRupee,
  Link2,
  CheckCircle2,
  Share2,
  Copy,
  MessageCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CreateSplitGroupDrawer } from "@/components/create-split-group-drawer";

function InviteLinkBar({ inviteToken, title }) {
  const url = api.splits.inviteUrl(inviteToken);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleWhatsApp = () => {
    const text = `Join "${title}" on WiseWallet — split bills together:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} — WiseWallet Split`,
          text: `Join our split group "${title}"`,
          url,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    handleCopy();
  };

  return (
    <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 space-y-2">
      <p className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
        <Link2 className="h-3.5 w-3.5" />
        Share link — friends join without bank account
      </p>
      <div className="flex gap-2">
        <Input readOnly value={url} className="text-xs h-9 bg-background" />
        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleWhatsApp} className="shrink-0">
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleShare} className="shrink-0">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SplitGroupCard({ group, onRefresh }) {
  const members = group.members ?? [];
  const expenses = group.expenses ?? [];
  const suggested = group.settlementsSuggested ?? [];
  const recorded = group.settlements ?? [];
  const isOwner = group.isOwner !== false;

  const [showForm, setShowForm] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [fromMemberId, setFromMemberId] = useState("");
  const [toMemberId, setToMemberId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const addExpense = async () => {
    const total = parseFloat(amount);
    if (!description.trim() || isNaN(total) || total <= 0 || !payerId) {
      toast.error("Fill all expense fields");
      return;
    }
    if (members.length === 0) {
      toast.error("Share invite link so friends can join first");
      return;
    }

    const perPerson = total / members.length;
    const shares = members.map((m, i) => ({
      memberId: m.id,
      amount:
        i === 0
          ? Math.round((total - perPerson * (members.length - 1)) * 100) / 100
          : Math.round(perPerson * 100) / 100,
    }));

    setSaving(true);
    try {
      await api.splits.addExpense(group.id, {
        description: description.trim(),
        amount: total,
        payerId,
        shares,
      });
      toast.success("Expense added");
      setDescription("");
      setAmount("");
      setPayerId("");
      setShowForm(false);
      onRefresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async () => {
    if (!confirm(`Delete "${group.title}"?`)) return;
    try {
      await api.splits.delete(group.id);
      toast.success("Group deleted");
      onRefresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const recordSettlement = async () => {
    const total = parseFloat(settleAmount);
    if (!fromMemberId || !toMemberId || fromMemberId === toMemberId) {
      toast.error("Select who paid and who received");
      return;
    }
    if (isNaN(total) || total <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await api.splits.recordSettlement(group.id, {
        fromMemberId,
        toMemberId,
        amount: total,
      });
      toast.success("Payment recorded!");
      setSettleAmount("");
      setFromMemberId("");
      setToMemberId("");
      setShowSettle(false);
      onRefresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const quickSettle = (s) => {
    const from = members.find((m) => m.name === s.from);
    const to = members.find((m) => m.name === s.to);
    if (from && to) {
      setFromMemberId(from.id);
      setToMemberId(to.id);
      setSettleAmount(String(s.amount));
      setShowSettle(true);
    }
  };

  return (
    <Card className="border-orange-500/10 bg-gradient-to-br from-muted/40 to-transparent hover:border-orange-500/25 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-orange-600 dark:text-orange-400">{group.title}</span>
            {!isOwner && (
              <Badge variant="secondary" className="text-xs font-normal">
                Member
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length > 0
              ? members.map((m) => m.name).join(", ")
              : "Share link to add members"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowSettle((v) => !v)}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Settle up
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Add expense
          </Button>
          {isOwner && (
            <Button size="sm" variant="ghost" onClick={deleteGroup}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner && group.inviteToken && (
          <InviteLinkBar inviteToken={group.inviteToken} title={group.title} />
        )}

        {showSettle && (
          <div className="rounded-lg border p-4 space-y-3 bg-emerald-500/5 border-emerald-500/20">
            <p className="text-sm font-medium">Record a payment</p>
            <Select value={fromMemberId} onValueChange={setFromMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={toMemberId} onValueChange={setToMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Paid to whom?" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              placeholder="Amount paid (₹)"
            />
            <Button onClick={recordSettlement} disabled={saving} size="sm">
              {saving ? "Saving..." : "Mark as paid"}
            </Button>
          </div>
        )}

        {showForm && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (Dinner, Uber...)"
            />
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (₹)"
            />
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addExpense} disabled={saving} size="sm">
              {saving ? "Adding..." : "Save expense (split equally)"}
            </Button>
          </div>
        )}

        {suggested.length > 0 ? (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Who owes whom</p>
            {suggested.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-medium">{s.from}</span>
                <span className="text-muted-foreground">owes</span>
                <span className="font-medium">{s.to}</span>
                <Badge variant="secondary" className="ml-auto gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {formatMoney(s.amount)}
                </Badge>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => quickSettle(s)}>
                  Settle
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All settled up!</p>
        )}

        {recorded.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-600">Payments recorded</p>
            {recorded.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm border-b pb-2">
                <span>
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-emerald-500" />
                  {s.fromName || "—"} paid {s.toName || "—"}
                </span>
                <span className="font-medium">{formatMoney(s.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {expenses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Expenses</p>
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between text-sm border-b pb-2">
                <div>
                  <p className="font-medium">{exp.description}</p>
                  <p className="text-muted-foreground text-xs">
                    Paid by {exp.payer?.name || "—"}
                  </p>
                </div>
                <span className="font-medium">{formatMoney(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SplitsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    try {
      const data = await api.splits.list();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      setGroups([]);
      toast.error(error.message || "Failed to load splits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <BarLoader className="mt-4" width="100%" color="hsl(var(--primary))" />;
  }

  const hasGroups = groups.length > 0;

  return (
    <>
      <div className="space-y-6 w-full max-w-4xl mx-auto">
        {hasGroups ? (
          <>
            <div className="flex items-end justify-between gap-4 flex-wrap pt-2">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold gradient-title">Split Expenses</h1>
                <p className="text-muted-foreground mt-2">
                  Splitwise style — link share karo, bank account ki zaroorat nahi.
                </p>
              </div>
              <Button
                size="lg"
                className="gap-2 shrink-0 shadow-md shadow-orange-500/10"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-5 w-5" /> New group
              </Button>
            </div>

            {groups.map((g) => (
              <SplitGroupCard key={g.id} group={g} onRefresh={load} />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-4 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-3xl scale-150" />
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30">
                <Users className="h-16 w-16 text-orange-500" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 gradient-title">Split Expenses</h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8 leading-relaxed">
              Splitwise jaisa — group banao, link share karo, bills split karo.
              <span className="block mt-1 text-sm">Bank account connect karne ki zaroorat nahi.</span>
            </p>
            <Button
              size="lg"
              className="gap-2 px-8 h-12 text-base shadow-lg shadow-orange-500/20"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Create group & get link
            </Button>
          </div>
        )}
      </div>

      <CreateSplitGroupDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />
    </>
  );
}
