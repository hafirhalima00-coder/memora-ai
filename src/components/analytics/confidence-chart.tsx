"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface ConfidenceChartProps {
  data: { level: string; count: number }[];
  className?: string;
}

const barColors: Record<string, string> = {
  "Very High (90-100%)": "bg-emerald-500",
  "High (70-89%)": "bg-green-500",
  "Medium (50-69%)": "bg-yellow-500",
  "Low (30-49%)": "bg-orange-500",
  "Very Low (0-29%)": "bg-red-500",
};

export function ConfidenceChart({ data, className }: ConfidenceChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-violet-500" />
          Confidence Distribution
        </CardTitle>
        <CardDescription>How memories are distributed by confidence level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.level} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{item.level}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.count}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    barColors[item.level] || "bg-zinc-500"
                  )}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
