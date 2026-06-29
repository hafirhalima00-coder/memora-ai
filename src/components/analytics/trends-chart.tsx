"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface TrendsChartProps {
  data: { date: string; verified: number; rejected: number; total: number }[];
  className?: string;
}

export function TrendsChart({ data, className }: TrendsChartProps) {
  if (data.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            Verification Trends
          </CardTitle>
          <CardDescription>Verification activity over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No verification data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.total), 1);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-violet-500" />
          Verification Trends
        </CardTitle>
        <CardDescription>Verification activity over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.slice(-14).map((item) => { // Show last 14 days
            const date = new Date(item.date);
            const dayLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <div key={item.date} className="flex items-center gap-3">
                <span className="w-16 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">{dayLabel}</span>
                <div className="flex-1 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(item.verified / maxCount) * 100}%` }}
                    title={`${item.verified} verified`}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${(item.rejected / maxCount) * 100}%` }}
                    title={`${item.rejected} rejected`}
                  />
                </div>
                <span className="w-10 text-right text-xs text-zinc-600 dark:text-zinc-400">
                  {item.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-zinc-500">Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="text-xs text-zinc-500">Rejected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
