"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Users, IndianRupee, UserPlus, Link2 } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/logo";
import { BarLoader } from "react-spinners";
import { api, getToken } from "@/lib/api";
import { toast } from "sonner";

export default function PublicSplitPage() {
  const { token } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [joining, setJoining] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    const hasToken = !!getToken();
    setLoggedIn(hasToken);
    if (hasToken) {
      api.auth
        .getMe()
        .then((data) => {
          const name =
            data?.user?.name ||
            data?.user?.email?.split("@")[0] ||
            "";
          setUserName(name);
          setMemberName(name);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/splits/public/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Not found");
        setGroup(data.group);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  const handleJoin = async () => {
    if (!loggedIn) {
      router.push(`/sign-in?redirect=/split/${token}`);
      return;
    }

    setJoining(true);
    try {
      const payload = memberId
        ? { memberId }
        : { memberName: memberName.trim() || userName || undefined };
      const result = await api.splits.join(token, payload);
      toast.success(
        result.alreadyJoined ? "Already in this group" : "Joined! Add expenses now."
      );
      router.push("/splits");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <BarLoader color="#f97316" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/20 p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        {error || !group ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Split group not found or link expired.</p>
              <Link href="/">
                <Button variant="link" className="mt-4">
                  Go to WiseWallet
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {group.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {group.members.map((m) => m.name).join(", ")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.settlements?.length > 0 ? (
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <p className="text-sm font-medium">Who owes whom</p>
                    {group.settlements.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="font-medium">{s.from}</span>
                        <span className="text-muted-foreground">owes</span>
                        <span className="font-medium">{s.to}</span>
                        <Badge variant="secondary" className="ml-auto gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatMoney(s.amount)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All settled up!</p>
                )}

                {group.expenses?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Expenses</p>
                    {group.expenses.map((exp, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">{exp.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid by {exp.payerName}
                          </p>
                        </div>
                        <span>{formatMoney(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-orange-500" />
                  Join this group
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" />
                  No bank account needed — just sign in & join
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {loggedIn ? (
                  <>
                    {group.members.some((m) => !m.claimed) && (
                      <Select value={memberId} onValueChange={setMemberId}>
                        <SelectTrigger>
                          <SelectValue placeholder="I'm already listed as... (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {group.members
                            .filter((m) => !m.claimed)
                            .map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      placeholder="Your name (if not in list)"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleJoin} disabled={joining}>
                      {joining
                        ? "Joining..."
                        : `Join${userName ? ` as ${userName}` : ""}`}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Sign in to join — free, no bank account required.
                    </p>
                    <Link href={`/sign-in?redirect=/split/${token}`}>
                      <Button className="w-full">Sign in to join</Button>
                    </Link>
                    <Link href={`/sign-in?mode=register&redirect=/split/${token}`}>
                      <Button variant="outline" className="w-full">
                        Create free account
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              Shared via WiseWallet · Splitwise-style bill splitting
            </p>
          </>
        )}
      </div>
    </div>
  );
}
