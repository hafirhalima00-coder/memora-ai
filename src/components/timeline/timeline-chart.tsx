"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";
import {
  PlusCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  AlertTriangle,
  TrendingUp,
  History,
} from "lucide-react";

interface TimelineChartProps {
  events: TimelineEvent[];
  title?: string;
  description?: string;
  className?: string;
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  created: { icon: PlusCircle, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/50", label: "Created" },
  confirmed: { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50", label: "Confirmed" },
  rejected: { icon: XCircle, color: "text-red-500 bg-red-100 dark:bg-red-900/50", label: "Rejected" },
  updated: { icon: Edit3, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/50", label: "Updated" },
  expired: { icon: Clock, color: "text-gray-500 bg-gray-100 dark:bg-gray-800", label: "Expired" },
  conflicted: { icon: AlertTriangle, color: "text-orange-500 bg-orange-100 dark:bg-orange-900/50", label: "Conflicted" },
  verified: { icon: TrendingUp, color: "text-violet-500 bg-violet-100 dark:bg-violet-900/50", label: "Verified" },
};

export function TimelineChart({
  events,
  title = "Memory Timeline",
  description = "Visual history of memory events",
  className,
}: TimelineChartProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-violet-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No timeline events yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Events will appear as memories are created, verified, and expire
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-700" />

            <div className="space-y-0">
              {events.map((event, index) => {
                const config = eventConfig[event.type] || eventConfig.created;
                const Icon = config.icon;

                return (
                  <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Icon */}
                    <div className={cn(
                      "relative z-10 flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full",
                      config.color
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {formatDateTime(event.timestamp)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {event.detail.split(":")[0]}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {event.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
