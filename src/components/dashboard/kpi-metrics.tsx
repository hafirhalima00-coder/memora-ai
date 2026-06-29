"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Timer,
  DollarSign,
  TrendingUp,
  Brain,
  ShieldCheck,
  ShieldX,
  BarChart3,
} from "lucide-react";

interface KpiMetric {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  color: string;
  progressValue: number;
  progressVariant: "success" | "warning" | "danger" | "default";
}

const kpiData: KpiMetric[] = [
  {
    label: "Avg Execution Time",
    value: "1.2s",
    sublabel: "-8% from last week",
    icon: <Timer className="h-4 w-4" />,
    trend: "down",
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    progressValue: 88,
    progressVariant: "success",
  },
  {
    label: "Cost per Run",
    value: "$0.0042",
    sublabel: "~4,200 runs/dollar",
    icon: <DollarSign className="h-4 w-4" />,
    trend: "down",
    color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    progressValue: 92,
    progressVariant: "success",
  },
  {
    label: "Success Rate",
    value: "98.7%",
    sublabel: "+0.3% this month",
    icon: <TrendingUp className="h-4 w-4" />,
    trend: "up",
    color: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
    progressValue: 99,
    progressVariant: "success",
  },
  {
    label: "Avg Confidence",
    value: "76.4%",
    sublabel: "Medium confidence",
    icon: <Brain className="h-4 w-4" />,
    trend: "up",
    color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
    progressValue: 76,
    progressVariant: "warning",
  },
  {
    label: "Human Approval Rate",
    value: "84%",
    sublabel: "16% auto-rejected",
    icon: <ShieldCheck className="h-4 w-4" />,
    trend: "up",
    color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
    progressValue: 84,
    progressVariant: "success",
  },
  {
    label: "Blocked Actions",
    value: "23",
    sublabel: "12 pending review",
    icon: <ShieldX className="h-4 w-4" />,
    trend: "down",
    color: "text-red-500 bg-red-100 dark:bg-red-900/30",
    progressValue: 77,
    progressVariant: "danger",
  },
];

export function KpiMetrics() {
  return (
    <Card className="border-emerald-200/50 dark:border-emerald-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-500" />
          <CardTitle className="text-base">Executive KPIs</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {kpiData.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn("rounded-lg p-1.5", kpi.color)}>
                  {kpi.icon}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  kpi.trend === "up" && "text-emerald-500",
                  kpi.trend === "down" && "text-blue-500",
                  kpi.trend === "neutral" && "text-zinc-400",
                )}>
                  {kpi.trend === "up" ? "↑" : kpi.trend === "down" ? "↓" : "→"} {kpi.sublabel.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{kpi.value}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2">{kpi.sublabel}</p>
              <Progress value={kpi.progressValue} variant={kpi.progressVariant} className="h-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
