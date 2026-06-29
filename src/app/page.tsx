"use client";

import * as React from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, timeAgo, formatDate, daysUntil } from "@/lib/utils";
import type { DashboardStats, Memory } from "@/lib/types";
import {
  PlusCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Brain,
  AlertTriangle,
  ShieldQuestion,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/lib/api-client";

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Failed to load dashboard data.</p>
        <Button variant="outline" onClick={loadStats} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
            Overview of your trust-aware memory system
          </p>
        </div>
        <Button asChild>
          <Link href="/memories/new">
            <PlusCircle className="h-4 w-4 mr-1" />
            New Memory
          </Link>
        </Button>
      </div>

      {/* Philosophy Banner */}
      <Card className="border-violet-200 dark:border-violet-900 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50 flex-shrink-0">
            <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200 mb-1">
              A memory that knows it might be wrong
            </h3>
            <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
              Most AI memory systems assume everything they remember is correct. 
              Memora AI takes a different approach — every memory carries explicit 
              <strong> uncertainty signals</strong>, and <strong>you</strong> stay in control.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 list-none p-0">
              <li className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400">
                <ShieldQuestion className="h-3 w-3" />
                Confidence scores show what the system is unsure about
              </li>
              <li className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400">
                <AlertTriangle className="h-3 w-3" />
                Conflicting facts are flagged, never silently overwritten
              </li>
              <li className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400">
                <Clock className="h-3 w-3" />
                Stale memories decay and expire — nothing lasts forever
              </li>
              <li className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400">
                <RefreshCw className="h-3 w-3" />
                Export, delete, or correct any memory — you own your data
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-3">
              <Button variant="outline" size="sm" asChild className="h-7 text-[11px]">
                <Link href="/verification">Review your memories</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-7 text-[11px]">
                <Link href="/settings">Manage data</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Recent Memories + Upcoming Expirations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Memories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Memories</CardTitle>
              <CardDescription>Latest 5 memories</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/memories">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentMemories.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">
                No memories yet. Create your first memory to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentMemories.map((memory: Memory) => (
                  <Link
                    key={memory.id}
                    href={`/memories/${memory.id}`}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {memory.value}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-400 uppercase">{memory.category}</span>
                        <span className="text-[10px] text-zinc-400">{timeAgo(memory.createdAt)}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        memory.confidence >= 0.7 ? "success" :
                        memory.confidence >= 0.4 ? "warning" : "danger"
                      }
                      className="text-[10px] ml-2"
                    >
                      {Math.round(memory.confidence * 100)}%
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Expirations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-amber-500" />
                Expiring Soon
              </CardTitle>
              <CardDescription>Memories needing renewal</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats.upcomingExpirations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No memories expiring soon</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Memories with expiration dates will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.upcomingExpirations.map((memory: Memory) => {
                  const days = daysUntil(memory.expiresAt);
                  return (
                    <Link
                      key={memory.id}
                      href={`/memories/${memory.id}`}
                      className="flex items-center justify-between rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {memory.value}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Expires {formatDate(memory.expiresAt)}
                        </p>
                      </div>
                      {days !== null && (
                        <Badge
                          variant={days <= 3 ? "danger" : days <= 7 ? "warning" : "secondary"}
                          className="ml-2"
                        >
                          {days}d left
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
