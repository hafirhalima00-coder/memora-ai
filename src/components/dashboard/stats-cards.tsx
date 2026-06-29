"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatConfidence } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";
import {
  Brain,
  Shield,
  HelpCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
  className?: string;
}

const statCards = [
  {
    key: "totalMemories" as const,
    label: "Total Memories",
    icon: Brain,
    color: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
    format: (v: number) => v.toString(),
  },
  {
    key: "trustedMemories" as const,
    label: "Trusted",
    icon: Shield,
    color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    format: (v: number) => v.toString(),
  },
  {
    key: "unverifiedMemories" as const,
    label: "Unverified",
    icon: HelpCircle,
    color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
    format: (v: number) => v.toString(),
  },
  {
    key: "expiredMemories" as const,
    label: "Expired",
    icon: Clock,
    color: "text-gray-500 bg-gray-100 dark:bg-gray-800",
    format: (v: number) => v.toString(),
  },
  {
    key: "conflictingMemories" as const,
    label: "Conflicting",
    icon: AlertTriangle,
    color: "text-red-500 bg-red-100 dark:bg-red-900/30",
    format: (v: number) => v.toString(),
  },
];

export function StatsCards({ stats, className }: StatsCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];
        return (
          <Card key={card.key} className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("rounded-lg p-2 transition-colors", card.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {card.format(value)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {card.label}
              </p>
            </CardContent>
          </Card>
        );
      })}

      {/* Average Confidence */}
      <Card className="md:col-span-2 lg:col-span-5 group hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-2">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Average Confidence
              </span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              stats.averageConfidence >= 0.7 ? "text-emerald-600 dark:text-emerald-400" :
              stats.averageConfidence >= 0.4 ? "text-yellow-600 dark:text-yellow-400" :
              "text-red-600 dark:text-red-400"
            )}>
              {formatConfidence(stats.averageConfidence)}
            </span>
          </div>
          <Progress
            value={stats.averageConfidence * 100}
            variant={stats.averageConfidence >= 0.7 ? "success" : stats.averageConfidence >= 0.4 ? "warning" : "danger"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
