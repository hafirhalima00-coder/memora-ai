"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConflictCard } from "@/components/conflict/conflict-card";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { getConflicts, resolveConflict } from "@/lib/api-client";

export default function ConflictsPage() {
  const [conflicts, setConflicts] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({ total: 0, unresolved: 0, resolved: 0 });
  const [loading, setLoading] = React.useState(true);

  const loadConflicts = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConflicts();
      setConflicts(data.conflicts);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to load conflicts:", err);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  const handleResolve = async (id: string, resolution: "keep_a" | "keep_b" | "merge" | "reject_both") => {
    try {
      await resolveConflict(id, resolution);
      loadConflicts();
    } catch (err) {
      console.error("Failed to resolve conflict:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Conflict Detection</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
            Detect and resolve conflicting memories
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadConflicts} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unresolved}</p><p className="text-xs text-zinc-500">Unresolved</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</p><p className="text-xs text-zinc-500">Resolved</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</p><p className="text-xs text-zinc-500">Total</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : conflicts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">No Conflicts Detected</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Your memory system is in harmony. When conflicting memories are detected, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-zinc-500">{conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} need resolution</span>
          </div>
          {conflicts.map((conflict) => (
            <ConflictCard key={conflict.id} conflict={conflict} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
