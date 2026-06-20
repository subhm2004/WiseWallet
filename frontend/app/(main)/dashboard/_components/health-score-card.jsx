"use client";

import { Activity, Info } from "lucide-react";
import { BarLoader } from "react-spinners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function scoreColor(score) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-orange-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}

function ringColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function gradeBg(score) {
  if (score >= 80) return "from-emerald-500/10 to-emerald-600/5";
  if (score >= 60) return "from-orange-500/10 to-orange-600/5";
  if (score >= 40) return "from-yellow-500/10 to-yellow-600/5";
  return "from-red-500/10 to-red-600/5";
}

export function HealthScoreCard({ data, loading = false }) {
  if (loading) {
    return (
      <Card className="border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <BarLoader width="100%" color="#f97316" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add transactions and set a budget to calculate your score.
          </p>
        </CardContent>
      </Card>
    );
  }

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (data.score / 100) * circumference;

  return (
    <Card className={`border-orange-500/25 bg-gradient-to-br ${gradeBg(data.score)} shadow-sm`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative h-32 w-32 shrink-0">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={ringColor(data.score)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${scoreColor(data.score)}`}>
                {data.score}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>

          <div className="flex-1 w-full min-w-0">
            <p className={`text-2xl font-bold ${scoreColor(data.score)}`}>
              {data.grade}
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Budget, savings, category limits, cash flow & tracking
            </p>
            <TooltipProvider>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.factors.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground flex items-center gap-1 truncate">
                      {f.name}
                      {f.tip && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>{f.tip}</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    <span className="font-semibold ml-2 shrink-0">
                      {f.score}/{f.max}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
