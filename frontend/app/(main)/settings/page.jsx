"use client";

import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { Download, Mail, User, Wallet, Palette, Lock, FileText, Monitor, LogOut, LayoutGrid } from "lucide-react";
import { api, setAuthTokens } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { EmailLogs } from "../dashboard/_components/email-logs";
import { ThemeToggle } from "@/components/theme-toggle";
import { CsvImport } from "./_components/csv-import";
import { DashboardWidgetSettings } from "../dashboard/_components/dashboard-widget-settings";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [userData, accounts] = await Promise.all([
          api.auth.getMe(),
          api.accounts.list(),
        ]);
        setUser(userData.user);
        setName(userData.user?.name || "");
        setImageUrl(userData.user?.imageUrl || "");

        const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
        if (defaultAccount?.id) {
          const budget = await api.budgets.get(defaultAccount.id);
          if (budget?.budget?.amount) {
            setBudgetAmount(String(budget.budget.amount));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
    api.auth
      .listSessions()
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = {};
      if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
      if (imageUrl !== (user?.imageUrl || "")) payload.imageUrl = imageUrl.trim();
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save");
        return;
      }

      const result = await api.auth.updateProfile(payload);
      if (result.token) setAuthTokens({ token: result.token });
      setUser(result.user);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Profile updated");
      window.dispatchEvent(new Event("wisewallet-auth-changed"));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid budget amount");
      return;
    }
    setSaving(true);
    try {
      await api.budgets.update(amount);
      toast.success("Budget updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await api.analytics.exportCsv();
      toast.success("Transactions exported");
    } catch (error) {
      toast.error(error.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      await api.analytics.exportPdf();
      toast.success("PDF report downloaded");
    } catch (error) {
      toast.error(error.message || "PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  };

  const revokeSession = async (id) => {
    try {
      await api.auth.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session revoked");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logoutAllDevices = async () => {
    if (!confirm("Log out all other devices?")) return;
    setLoggingOutAll(true);
    try {
      await api.auth.logoutAll();
      const data = await api.auth.listSessions();
      setSessions(data.sessions ?? []);
      toast.success("Other devices logged out");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoggingOutAll(false);
    }
  };

  if (loading) {
    return <BarLoader className="mt-4" width="100%" color="hsl(var(--primary))" />;
  }

  return (
    <div className="space-y-8 w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Choose which widgets appear on your dashboard — net worth, budgets, AI coach, and more.
          </p>
          <DashboardWidgetSettings
            widgets={user?.dashboardWidgets}
            onChange={(next) => setUser((prev) => (prev ? { ...prev, dashboardWidgets: next } : prev))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Choose light, dark, or match your system preference.
          </p>
          <ThemeToggle variant="dropdown" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="avatar" className="text-sm font-medium">Avatar URL</label>
            <Input
              id="avatar"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Avatar preview"
                className="h-14 w-14 rounded-full object-cover border"
              />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <Mail className="h-3.5 w-3.5" /> Email
            </p>
            <p className="font-medium text-sm">{user?.email}</p>
          </div>

          {user?.hasPassword && (
            <>
              <div className="space-y-2 pt-2 border-t">
                <label htmlFor="currentPassword" className="text-sm font-medium flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Change password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                />
              </div>
            </>
          )}

          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={logoutAllDevices}
            disabled={loggingOutAll || sessions.length <= 1}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {loggingOutAll ? "Logging out..." : "Log out all devices"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Devices where you&apos;re signed in. Revoke any session you don&apos;t recognize.
          </p>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {session.device}
                    {session.current && (
                      <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last active {new Date(session.lastUsedAt).toLocaleString()}
                  </p>
                </div>
                {!session.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeSession(session.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CsvImport />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Monthly Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            type="number"
            placeholder="5000"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={saveBudget} disabled={saving}>
            {saving ? "Saving..." : "Save Budget"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Download your transactions as CSV or a monthly PDF report with charts.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportCsv} disabled={exporting}>
              {exporting ? "Exporting..." : "Download CSV"}
            </Button>
            <Button variant="outline" onClick={exportPdf} disabled={exportingPdf}>
              <FileText className="h-4 w-4 mr-2" />
              {exportingPdf ? "Generating..." : "Download PDF Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmailLogs />
    </div>
  );
}
