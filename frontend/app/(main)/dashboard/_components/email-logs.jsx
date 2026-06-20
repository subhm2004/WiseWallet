"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Mail, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS = {
  test: "Test Email",
  "budget-alert": "Budget Alert",
  "monthly-report": "Monthly Report",
  general: "General",
};

export function EmailLogs({ refreshKey = 0 }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const data = await api.notifications.list();
      setEmails(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-red-500" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Sent emails appear here — budget alerts, reports, etc.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadEmails} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && emails.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading emails...</p>
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No emails sent yet</p>
            <p className="text-xs mt-1">Budget alerts and monthly reports will show up here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {emails.map((email) => (
              <div
                key={email.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[email.type] || email.type}
                    </Badge>
                    {email.status === "sent" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </div>
                  <p className="font-medium text-sm mt-1 truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground">To: {email.to}</p>
                  {email.error && (
                    <p className="text-xs text-red-500 mt-1">{email.error}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(email.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
