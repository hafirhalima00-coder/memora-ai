"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ConfidenceBadge, ConfidenceExplanation } from "@/components/confidence/confidence-badge";
import { VerificationPanel } from "@/components/verification/verification-panel";
import { cn, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import type { Memory, VerificationEvent } from "@/lib/types";
import {
  ArrowLeft,
  Trash2,
  Brain,
  Eye,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { getMemory, getVerificationHistory, getExplanation, performVerification, deleteMemory, updateMemory } from "@/lib/api-client";

const statusVariants: Record<string, "success" | "warning" | "danger" | "info" | "secondary"> = {
  verified: "success",
  unverified: "warning",
  conflicting: "danger",
  expired: "info",
  rejected: "secondary",
};

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [memory, setMemory] = React.useState<Memory | null>(null);
  const [history, setHistory] = React.useState<VerificationEvent[]>([]);
  const [factors, setFactors] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const loadMemory = React.useCallback(async () => {
    const id = params.id as string;
    if (!id) return;
    setLoading(true);
    try {
      const [mem, hist, explain] = await Promise.all([
        getMemory(id),
        getVerificationHistory(id),
        getExplanation(id),
      ]);
      setMemory(mem);
      setHistory(hist);
      setFactors(explain.factors);
    } catch (err) {
      console.error("Failed to load memory:", err);
    }
    setLoading(false);
  }, [params.id]);

  React.useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const handleConfirm = async () => {
    if (!memory) return;
    try {
      const result = await performVerification(memory.id, "confirm");
      setMemory(result.memory);
      const hist = await getVerificationHistory(memory.id);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to confirm memory:", err);
    }
  };

  const handleReject = async () => {
    if (!memory) return;
    try {
      const result = await performVerification(memory.id, "reject");
      setMemory(result.memory);
      const hist = await getVerificationHistory(memory.id);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to reject memory:", err);
    }
  };

  const handleEdit = async (newValue: string) => {
    if (!memory) return;
    try {
      await updateMemory(memory.id, { value: newValue });
      const mem = await getMemory(memory.id);
      setMemory(mem);
      const hist = await getVerificationHistory(memory.id);
      setHistory(hist);
      const explain = await getExplanation(memory.id);
      setFactors(explain.factors);
    } catch (err) {
      console.error("Failed to edit memory:", err);
    }
  };

  const handleIncreaseConfidence = async () => {
    if (!memory) return;
    try {
      const result = await performVerification(memory.id, "increase_confidence");
      setMemory(result.memory);
      const hist = await getVerificationHistory(memory.id);
      setHistory(hist);
      const explain = await getExplanation(memory.id);
      setFactors(explain.factors);
    } catch (err) {
      console.error("Failed to increase confidence:", err);
    }
  };

  const handleDelete = async () => {
    if (!memory) return;
    if (confirm("Are you sure you want to delete this memory?")) {
      try {
        await deleteMemory(memory.id);
        router.push("/memories");
      } catch (err) {
        console.error("Failed to delete memory:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading memory...</p>
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4">
          <AlertTriangle className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Memory not found</h3>
        <p className="text-sm text-zinc-500 mb-4">The memory you're looking for doesn't exist.</p>
        <Button asChild variant="outline">
          <Link href="/memories"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Memories</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/memories" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Memories
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={statusVariants[memory.verificationStatus] || "secondary"}>
                      {memory.verificationStatus}
                    </Badge>
                    <Badge variant="outline">{memory.category}</Badge>
                  </div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {memory.value}
                  </h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Separator className="mb-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Brain className="h-3 w-3" />
                    <span>Confidence</span>
                  </div>
                  <ConfidenceBadge score={memory.confidence} size="sm" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Eye className="h-3 w-3" />
                    <span>Source</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {memory.source?.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 capitalize">{memory.source?.reliability} reliability</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    <span>Created</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDateTime(memory.createdAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>Expires</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {memory.expiresAt ? formatDate(memory.expiresAt) : "Never"}
                  </p>
                </div>
              </div>

              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  {memory.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-violet-500" />
                Why This Memory Exists
              </CardTitle>
              <CardDescription>Explanation of how this memory was created and maintained</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {memory.explanation}
                </p>
              </div>

              {factors && <ConfidenceExplanation factors={factors} />}

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Verification History</h4>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {memory.confirmationCount} confirmations
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    {memory.contradictionCount} contradictions
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <VerificationPanel
            memory={memory}
            history={history}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onEdit={handleEdit}
            onIncreaseConfidence={handleIncreaseConfidence}
          />
        </div>
      </div>
    </div>
  );
}
