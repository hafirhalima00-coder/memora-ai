"use client";

import * as React from "react";
import { cn, formatConfidence, daysUntil } from "@/lib/utils";
import type { Memory } from "@/lib/types";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Clock,
  TrendingDown,
  Info,
} from "lucide-react";

interface RiskIndicatorProps {
  memory: Memory;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

type RiskLevel = "low" | "medium" | "high" | "critical";

interface RiskInfo {
  level: RiskLevel;
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
}

function calculateRisk(memory: Memory): RiskInfo {
  const { confidence, verificationStatus, contradictionCount, expiresAt, confirmationCount } = memory;
  const expiresIn = expiresAt ? daysUntil(expiresAt) : null;
  let riskScore = 0;

  // Confidence-based risk
  if (confidence < 0.3) riskScore += 40;
  else if (confidence < 0.5) riskScore += 25;
  else if (confidence < 0.7) riskScore += 10;

  // Status-based risk
  if (verificationStatus === "expired") riskScore += 30;
  else if (verificationStatus === "conflicting") riskScore += 25;
  else if (verificationStatus === "rejected") riskScore += 35;
  else if (verificationStatus === "unverified") riskScore += 15;

  // Contradiction risk
  if (contradictionCount >= 2) riskScore += 20;
  else if (contradictionCount >= 1) riskScore += 10;

  // Expiration risk
  if (expiresIn !== null && expiresIn <= 0) riskScore += 30;
  else if (expiresIn !== null && expiresIn <= 7) riskScore += 20;
  else if (expiresIn !== null && expiresIn <= 30) riskScore += 10;

  // Confirmation risk (low confirmations + high importance)
  if (confirmationCount === 0 && verificationStatus !== "rejected") riskScore += 10;

  riskScore = Math.min(100, riskScore);

  if (riskScore >= 65) {
    return {
      level: "critical",
      icon: ShieldX,
      label: "Critical Risk",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
      border: "border-red-200 dark:border-red-900",
      description: "This memory requires immediate attention — high chance of being incorrect or expired.",
    };
  }
  if (riskScore >= 40) {
    return {
      level: "high",
      icon: ShieldAlert,
      label: "High Risk",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      border: "border-orange-200 dark:border-orange-900",
      description: "This memory has significant risk factors and should be verified soon.",
    };
  }
  if (riskScore >= 20) {
    return {
      level: "medium",
      icon: AlertTriangle,
      label: "Medium Risk",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/40",
      border: "border-yellow-200 dark:border-yellow-900",
      description: "This memory has some risk factors. Consider re-verification.",
    };
  }
  return {
    level: "low",
    icon: ShieldCheck,
    label: "Low Risk",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900",
    description: "This memory is well-verified and has high confidence.",
  };
}

const sizeStyles = {
  sm: { badge: "text-[10px] px-1.5 py-0.5 gap-0.5", icon: "h-3 w-3", text: "text-[10px]" },
  md: { badge: "text-xs px-2 py-1 gap-1", icon: "h-3.5 w-3.5", text: "text-xs" },
  lg: { badge: "text-sm px-3 py-1.5 gap-1.5", icon: "h-4 w-4", text: "text-sm" },
};

export function RiskIndicator({ memory, showDetails = false, size = "md", className }: RiskIndicatorProps) {
  const risk = calculateRisk(memory);
  const RiskIcon = risk.icon;
  const styles = sizeStyles[size];

  const expiresIn = memory.expiresAt ? daysUntil(memory.expiresAt) : null;

  return (
    <div className={cn("space-y-1", className)}>
      {/* Badge */}
      <div className={cn(
        "inline-flex items-center rounded-full border font-medium",
        risk.bg, risk.border, risk.color,
        styles.badge
      )}>
        <RiskIcon className={styles.icon} />
        <span>{risk.label}</span>
      </div>

      {showDetails && (
        <div className={cn(
          "rounded-lg border p-3 space-y-2",
          risk.bg, risk.border
        )}>
          <div className="flex items-start gap-2">
            <Info className={cn("h-4 w-4 mt-0.5 flex-shrink-0", risk.color)} />
            <p className={cn("text-zinc-600 dark:text-zinc-400 leading-relaxed", styles.text)}>
              {risk.description}
            </p>
          </div>

          {/* Risk factors */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Shield className="h-3 w-3" />
              <span>Confidence: {formatConfidence(memory.confidence)}</span>
            </div>
            {expiresIn !== null && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                <span>{expiresIn <= 0 ? "Expired" : `Expires in ${expiresIn}d`}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <AlertTriangle className="h-3 w-3" />
              <span>{memory.contradictionCount} contradictions</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <TrendingDown className="h-3 w-3" />
              <span>{memory.confirmationCount} confirmations</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function getRiskLevel(memory: Memory): RiskLevel {
  return calculateRisk(memory).level;
}

export { type RiskLevel };
