"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate, timeAgo, formatConfidence, daysUntil, truncate } from "@/lib/utils";
import type { Memory } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface MemoryCardProps {
  memory: Memory;
  className?: string;
}

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  preference: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  fact: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  habit: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  goal: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  opinion: { bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-600 dark:text-pink-400", dot: "bg-pink-500" },
  relationship: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  location: { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400", dot: "bg-cyan-500" },
  event: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  identity: { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
  knowledge: { bg: "bg-teal-50 dark:bg-teal-950/30", text: "text-teal-600 dark:text-teal-400", dot: "bg-teal-500" },
};

const statusConfig: Record<string, { icon: React.ElementType; label: string; variant: "success" | "warning" | "danger" | "info" | "secondary" }> = {
  verified: { icon: CheckCircle2, label: "Verified", variant: "success" },
  unverified: { icon: HelpCircle, label: "Unverified", variant: "warning" },
  conflicting: { icon: AlertCircle, label: "Conflicting", variant: "danger" },
  expired: { icon: Clock, label: "Expired", variant: "info" },
  rejected: { icon: XCircle, label: "Rejected", variant: "secondary" },
};

export function MemoryCard({ memory, className }: MemoryCardProps) {
  const catColor = categoryColors[memory.category] ?? categoryColors.fact;
  const status = statusConfig[memory.verificationStatus] ?? statusConfig.unverified;
  const StatusIcon = status.icon;

  const progressVariant = memory.confidence >= 0.7 ? "success" : memory.confidence >= 0.4 ? "warning" : "danger";
  const expiresIn = memory.expiresAt ? daysUntil(memory.expiresAt) : null;

  return (
    <Link href={`/memories/${memory.id}`}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800",
        className
      )}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-1.5", catColor.dot)} />
              <span className={cn("text-xs font-medium uppercase tracking-wider", catColor.text)}>
                {memory.category}
              </span>
            </div>
            <Badge variant={status.variant} className="flex items-center gap-1 flex-shrink-0">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          {/* Value */}
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3 line-clamp-2">
            {memory.value}
          </p>

          {/* Confidence bar */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Confidence</span>
              <span className={cn(
                "font-semibold",
                memory.confidence >= 0.7 ? "text-emerald-600 dark:text-emerald-400" :
                memory.confidence >= 0.4 ? "text-yellow-600 dark:text-yellow-400" :
                "text-red-600 dark:text-red-400"
              )}>
                {formatConfidence(memory.confidence)}
              </span>
            </div>
            <Progress
              value={memory.confidence * 100}
              variant={progressVariant}
            />
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {memory.source.name}
            </span>
            <span>{timeAgo(memory.createdAt)}</span>
            {expiresIn !== null && (
              <span className={cn(
                expiresIn <= 7 ? "text-red-500 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
              )}>
                {expiresIn <= 0 ? "Expired" : `${expiresIn}d left`}
              </span>
            )}
          </div>

          {/* Tags */}
          {memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {memory.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {tag}
                </span>
              ))}
              {memory.tags.length > 3 && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  +{memory.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
