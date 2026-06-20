"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatMoney } from "@/lib/currency";
import { formatCategoryName, getCategoryColor } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CategoryDonutChart({ data }) {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">
            No expense data this month
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 8).map((d) => ({
    name: formatCategoryName(d.category),
    value: d.amount,
    category: d.category,
    percent: d.percent,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatMoney(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {data.slice(0, 6).map((d) => (
            <div key={d.category} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: getCategoryColor(d.category) }}
                />
                {formatCategoryName(d.category)}
              </span>
              <span className="text-muted-foreground shrink-0 ml-2">
                {d.percent}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
