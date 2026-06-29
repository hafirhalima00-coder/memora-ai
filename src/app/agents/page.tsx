"use client";

import * as React from "react";
import { LiveSimulation } from "@/components/dashboard/live-simulation";
import { ApprovalCenter } from "@/components/dashboard/approval-center";
import { AgentGraph } from "@/components/dashboard/agent-graph";
import { AIExplanation } from "@/components/dashboard/ai-explanation";
import { KpiMetrics } from "@/components/dashboard/kpi-metrics";
import { MissionReplay } from "@/components/dashboard/mission-replay";
import { Bot, ShieldCheck, Activity, Brain, BarChart3, Clock } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Agent Operations</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
            Live agent orchestration, human-in-the-loop control, and AI transparency
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Active Agents", value: "4", icon: Bot, color: "text-violet-500 bg-violet-100 dark:bg-violet-900/30" },
          { label: "Pending Approvals", value: "3", icon: ShieldCheck, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
          { label: "Success Rate", value: "98.7%", icon: Activity, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
          { label: "Avg Confidence", value: "76%", icon: Brain, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
          { label: "Cost/Run", value: "$0.004", icon: BarChart3, color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30" },
          { label: "Avg Time", value: "1.2s", icon: Clock, color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className={`rounded-lg p-1.5 ${stat.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <KpiMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveSimulation />
        <AgentGraph />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApprovalCenter />
        <AIExplanation />
      </div>

      <MissionReplay />
    </div>
  );
}
