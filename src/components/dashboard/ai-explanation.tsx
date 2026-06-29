"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Brain,
  ShieldX,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ArrowRight,
  Scale,
} from "lucide-react";

interface Decision {
  id: string;
  action: string;
  target: string;
  decision: "allowed" | "blocked" | "escalated";
  confidence: number;
  reason: string;
  policy: string;
  recommendedAction: string;
  agent: string;
  category: string;
}

const sampleDecisions: Decision[] = [
  {
    id: "1",
    action: "Refund $1,200",
    target: "Order #A-421",
    decision: "blocked",
    confidence: 97,
    reason: "Missing customer approval signature",
    policy: "FIN-004",
    recommendedAction: "Escalate to manager",
    agent: "Sales Agent",
    category: "Finance",
  },
  {
    id: "2",
    action: "Merge Accounts",
    target: "acme_corp & user_acme",
    decision: "escalated",
    confidence: 84,
    reason: "Records indicate different ownership structures",
    policy: "DATA-001",
    recommendedAction: "Manual identity verification required",
    agent: "CRM Agent",
    category: "Data",
  },
  {
    id: "3",
    action: "Send Promotion",
    target: "Segment: enterprise@acme.com",
    decision: "allowed",
    confidence: 92,
    reason: "All compliance checks passed",
    policy: "MKT-003",
    recommendedAction: "Proceed with delivery",
    agent: "Email Agent",
    category: "Marketing",
  },
];

export function AIExplanation() {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-base">AI Decision Explanations</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sampleDecisions.map((d) => (
          <div
            key={d.id}
            className={cn(
              "rounded-lg border p-3 cursor-pointer transition-all duration-200",
              expanded === d.id && "ring-2 ring-indigo-500/30",
              d.decision === "blocked" && "border-red-200 dark:border-red-900/50",
              d.decision === "allowed" && "border-emerald-200 dark:border-emerald-900/50",
              d.decision === "escalated" && "border-amber-200 dark:border-amber-900/50",
            )}
            onClick={() => setExpanded(expanded === d.id ? null : d.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      d.decision === "allowed" ? "success" :
                      d.decision === "blocked" ? "destructive" : "warning"
                    }
                    className="text-[9px] uppercase"
                  >
                    {d.decision}
                  </Badge>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{d.agent}</span>
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {d.action}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400">Confidence</p>
                  <p className={cn(
                    "text-xs font-bold",
                    d.confidence >= 90 ? "text-emerald-500" : d.confidence >= 70 ? "text-amber-500" : "text-red-500",
                  )}>
                    {d.confidence}%
                  </p>
                </div>
                {d.decision === "blocked" ? (
                  <ShieldX className="h-5 w-5 text-red-500" />
                ) : d.decision === "allowed" ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
              </div>
            </div>

            {expanded === d.id && (
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1">
                      <Scale className="h-3 w-3" />
                      Decision
                    </div>
                    <span className={cn(
                      "text-xs font-bold capitalize",
                      d.decision === "allowed" && "text-emerald-500",
                      d.decision === "blocked" && "text-red-500",
                      d.decision === "escalated" && "text-amber-500",
                    )}>
                      {d.decision}
                    </span>
                  </div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1">
                      <Brain className="h-3 w-3" />
                      Confidence
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{d.confidence}%</span>
                      <Progress value={d.confidence} variant={d.confidence >= 90 ? "success" : d.confidence >= 70 ? "warning" : "danger"} className="h-1.5 flex-1" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Reason
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">{d.reason}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1">
                      <FileText className="h-3 w-3" />
                      Policy
                    </div>
                    <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">{d.policy}</span>
                  </div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1">
                      <ArrowRight className="h-3 w-3" />
                      Recommended Action
                    </div>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{d.recommendedAction}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
