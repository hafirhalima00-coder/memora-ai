"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

interface ExpiringChartProps {
  data: { date: string; count: number }[];
  className?: string;
}

export function ExpiringChart({ data, className }: ExpiringChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-amber-500" />
          Expiring Memories
        </CardTitle>
        <CardDescription>Memories expiring in the next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarClock className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No memories expiring soon</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((item) => {
              const date = new Date(item.date);
              const dayLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const daysUntil = Math.ceil((date.getTime() - Date.now()) / 86400000);

              return (
                <div key={item.date} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">{dayLabel}</span>
                  <div className="flex-1 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        daysUntil <= 3 ? "bg-red-500" : daysUntil <= 7 ? "bg-amber-500" : "bg-blue-500"
                      )}
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className={cn(
                    "w-8 text-right text-xs font-semibold",
                    daysUntil <= 3 ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"
                  )}>
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
