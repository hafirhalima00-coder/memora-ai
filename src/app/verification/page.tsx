"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatConfidence, timeAgo } from "@/lib/utils";
import type { Memory } from "@/lib/types";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";
import { getPendingVerifications, performVerification } from "@/lib/api-client";

export default function VerificationPage() {
  const [memories, setMemories] = React.useState<Memory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const loadPending = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingVerifications();
      setMemories(data);
    } catch (err) {
      console.error("Failed to load pending verifications:", err);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { loadPending(); }, [loadPending]);

  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try {
      await performVerification(id, "confirm");
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error("Failed to confirm:", err); }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await performVerification(id, "reject");
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error("Failed to reject:", err); }
    setActionLoading(null);
  };

  const unverifiedCount = memories.filter(m => m.verificationStatus === "unverified").length;
  const conflictingCount = memories.filter(m => m.verificationStatus === "conflicting").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <ClipboardCheck className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Verification Center</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">Confirm, reject, or review memories</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPending} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{memories.length}</p><p className="text-xs text-zinc-500">Pending Review</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{unverifiedCount}</p><p className="text-xs text-zinc-500">Unverified</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-red-600 dark:text-red-400">{conflictingCount}</p><p className="text-xs text-zinc-500">Conflicting</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">All Caught Up!</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">All memories have been verified.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <Card key={memory.id} className={cn(memory.verificationStatus === "conflicting" && "border-red-200 dark:border-red-900")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={memory.verificationStatus === "conflicting" ? "danger" : "warning"} className="text-[10px]">{memory.verificationStatus}</Badge>
                      <Badge variant="outline" className="text-[10px]">{memory.category}</Badge>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">{memory.value}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>{memory.source?.name}</span>
                      <span>{timeAgo(memory.createdAt)}</span>
                      <span className={cn("font-medium", memory.confidence >= 0.7 ? "text-emerald-500" : memory.confidence >= 0.4 ? "text-yellow-500" : "text-red-500")}>
                        {formatConfidence(memory.confidence)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress value={memory.confidence * 100} variant={memory.confidence >= 0.7 ? "success" : memory.confidence >= 0.4 ? "warning" : "danger"} className="h-1.5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleConfirm(memory.id)} disabled={actionLoading === memory.id}
                      className="h-8 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(memory.id)} disabled={actionLoading === memory.id}
                      className="h-8 px-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
