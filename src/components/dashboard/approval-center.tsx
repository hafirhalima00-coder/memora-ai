"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface ApprovalRequest {
  id: string;
  agent: string;
  action: string;
  target: string;
  amount?: string;
  risk: "low" | "medium" | "high" | "critical";
  reason: string;
  policy?: string;
  status: "pending" | "approved" | "rejected";
  timestamp: Date;
}

const initialRequests: ApprovalRequest[] = [
  {
    id: "1",
    agent: "Sales Agent",
    action: "Refund",
    target: "Order #A-421",
    amount: "$1,200",
    risk: "high",
    reason: "Amount exceeds policy limit of $500 without manager approval",
    policy: "FIN-004",
    status: "pending",
    timestamp: new Date(),
  },
  {
    id: "2",
    agent: "Finance Agent",
    action: "Payment Release",
    target: "Invoice #INV-892",
    amount: "$4,500",
    risk: "critical",
    reason: "Vendor not on approved list. Requires compliance sign-off.",
    policy: "PROC-012",
    status: "pending",
    timestamp: new Date(),
  },
  {
    id: "3",
    agent: "CRM Agent",
    action: "Account Merge",
    target: "User acme_corp & user_acme",
    risk: "medium",
    reason: "Potential data loss risk — 2,347 records affected",
    policy: "DATA-001",
    status: "pending",
    timestamp: new Date(),
  },
  {
    id: "4",
    agent: "Support Agent",
    action: "Escalate",
    target: "Ticket #T-889",
    risk: "low",
    reason: "Customer requested manager callback. Standard escalation.",
    status: "pending",
    timestamp: new Date(),
  },
];

const riskColor = (risk: ApprovalRequest["risk"]) => {
  switch (risk) {
    case "low": return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50";
    case "medium": return "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50";
    case "high": return "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50";
    case "critical": return "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50";
  }
};

export function ApprovalCenter() {
  const [requests, setRequests] = React.useState<ApprovalRequest[]>(initialRequests);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const handleAction = (id: string, action: "approved" | "rejected") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <Card className="border-amber-200/50 dark:border-amber-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">Human Approval Center</CardTitle>
          {pending.length > 0 && (
            <Badge variant="warning" className="text-[10px] animate-pulse-soft">
              {pending.length} pending
            </Badge>
          )}
        </div>
        <CardDescription className="text-[10px]">
          Human-in-the-loop control
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className={cn(
              "rounded-lg border p-3 transition-all duration-200",
              req.status === "pending" && "border-amber-200 dark:border-amber-900/50",
              req.status === "approved" && "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10",
              req.status === "rejected" && "border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10",
              activeId === req.id && "ring-2 ring-violet-500/30",
            )}
            onClick={() => setActiveId(req.id === activeId ? null : req.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      req.risk === "low" ? "secondary" :
                      req.risk === "medium" ? "warning" :
                      req.risk === "high" ? "destructive" : "destructive"
                    }
                    className="text-[9px] uppercase"
                  >
                    {req.risk} risk
                  </Badge>
                  <span className="text-xs font-medium">{req.agent}</span>
                  {req.amount && (
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{req.amount}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                  {req.action} — {req.target}
                </p>
                {activeId === req.id && (
                  <div className="space-y-1.5 mt-2 animate-fade-in">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{req.reason}</p>
                    </div>
                    {req.policy && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-violet-500 flex-shrink-0" />
                        <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400">Policy {req.policy}</span>
                      </div>
                    )}
                    {req.status === "pending" && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={(e) => { e.stopPropagation(); handleAction(req.id, "approved"); }}
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-[11px]"
                          onClick={(e) => { e.stopPropagation(); handleAction(req.id, "rejected"); }}
                        >
                          <ShieldX className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {req.status !== "pending" && (
                      <Badge
                        variant={req.status === "approved" ? "success" : "danger"}
                        className="text-[10px]"
                      >
                        {req.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 ml-2">
                {req.status === "pending" ? (
                  <div className={cn("rounded-lg p-1.5", riskColor(req.risk))}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                ) : req.status === "approved" ? (
                  <div className="rounded-lg p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="rounded-lg p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <ShieldX className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
