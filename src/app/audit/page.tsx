"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";
import {
  History,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details: string;
  previousValue: string | null;
  newValue: string | null;
}

const actionColors: Record<string, "success" | "danger" | "warning" | "info" | "secondary"> = {
  create: "success",
  delete: "danger",
  update: "warning",
  confirm: "success",
  reject: "danger",
  edit: "warning",
  increase_confidence: "info",
  decrease_confidence: "warning",
};

export default function AuditPage() {
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [actionFilter, setActionFilter] = React.useState("");

  const loadAudit = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load audit log:", err);
    }
    setLoading(false);
  }, [actionFilter]);

  React.useEffect(() => { loadAudit(); }, [loadAudit]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600">
              <History className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
            Track all changes and operations in the system
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAudit} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              aria-label="Filter by action"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="confirm">Confirm</option>
              <option value="reject">Reject</option>
              <option value="edit">Edit</option>
              <option value="increase_confidence">Increase Confidence</option>
              <option value="decrease_confidence">Decrease Confidence</option>
            </select>
            <span className="text-xs text-zinc-400 ml-auto">{total} total entries</span>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-semibold mb-1">No Audit Entries</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Audit entries will appear here as memories are created, updated, verified, and deleted.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={actionColors[entry.action] || "secondary"} className="text-[10px] capitalize">
                        {entry.action.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{entry.entityType}</Badge>
                      <span className="text-[10px] text-zinc-400">{formatDateTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">{entry.details}</p>
                    {entry.previousValue && entry.newValue && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Changed from "{entry.previousValue.substring(0, 50)}" to "{entry.newValue.substring(0, 50)}"
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 flex-shrink-0">{entry.userId}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
