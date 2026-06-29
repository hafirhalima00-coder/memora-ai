"use client";

import { cn, formatConfidence } from "@/lib/utils";
import { getConfidenceLevel, getConfidenceColor, getConfidenceBgColor } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react";

interface ConfidenceBadgeProps {
  score: number;
  showIcon?: boolean;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ConfidenceBadge({
  score,
  showIcon = true,
  showProgress = false,
  size = "md",
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const colorClass = getConfidenceColor(level);
  const bgClass = getConfidenceBgColor(level);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const IconComponent = score >= 0.7
    ? TrendingUp
    : score >= 0.4
    ? Minus
    : TrendingDown;

  const progressVariant = score >= 0.7 ? "success" : score >= 0.4 ? "warning" : "danger";

  return (
    <div className={cn("space-y-1", className)}>
      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        bgClass,
        sizeClasses[size],
        colorClass
      )}>
        {showIcon && <IconComponent className={cn("flex-shrink-0", iconSize[size])} />}
        <span>{formatConfidence(score)}</span>
        <span className="opacity-60">({level.replace("_", " ")})</span>
      </div>

      {showProgress && (
        <Progress
          value={score * 100}
          variant={progressVariant}
          className="h-1.5"
        />
      )}
    </div>
  );
}

export function ConfidenceExplanation({ factors }: {
  factors: {
    baseScore: number;
    confirmationBonus: number;
    contradictionPenalty: number;
    sourceReliabilityMultiplier: number;
    ageDecay: number;
    finalScore: number;
  };
}) {
  const items = [
    { label: "Base Score", value: factors.baseScore, positive: true },
    { label: "Source Reliability", value: factors.sourceReliabilityMultiplier, positive: true },
    { label: "Confirmation Bonus", value: factors.confirmationBonus, positive: true },
    { label: "Contradiction Penalty", value: factors.contradictionPenalty, positive: false },
    { label: "Age Decay", value: factors.ageDecay, positive: false },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Confidence Calculation
      </h4>
      <div className="space-y-1.5">
        {items.map((item) => {
          const isZero = item.value === 0;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-zinc-500 dark:text-zinc-400">
                {item.label}
              </span>
              <span className={cn(
                "font-medium",
                isZero ? "text-zinc-400" :
                item.positive ? "text-emerald-600 dark:text-emerald-400" :
                "text-red-600 dark:text-red-400"
              )}>
                {item.positive ? "+" : "-"}
                {Math.round(item.value * 100)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200 dark:border-zinc-700">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Final Score
        </span>
        <span className={cn(
          "text-sm font-bold",
          getConfidenceColor(getConfidenceLevel(factors.finalScore))
        )}>
          {Math.round(factors.finalScore * 100)}%
        </span>
      </div>
    </div>
  );
}
