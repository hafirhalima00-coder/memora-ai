"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate, formatConfidence, timeAgo } from "@/lib/utils";
import type { Memory, VerificationEvent } from "@/lib/types";
import {
  CheckCircle2,
  XCircle,
  Edit3,
  TrendingUp,
  History,
  FileText,
  Eye,
} from "lucide-react";

interface VerificationPanelProps {
  memory: Memory;
  history: VerificationEvent[];
  onConfirm: () => void;
  onReject: () => void;
  onEdit: (newValue: string) => void;
  onIncreaseConfidence: () => void;
  className?: string;
}

export function VerificationPanel({
  memory,
  history,
  onConfirm,
  onReject,
  onEdit,
  onIncreaseConfidence,
  className,
}: VerificationPanelProps) {
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(memory.value);

  const handleEdit = () => {
    if (editValue.trim() && editValue !== memory.value) {
      onEdit(editValue.trim());
    }
    setEditing(false);
  };

  const actionIcons = {
    confirm: CheckCircle2,
    reject: XCircle,
    edit: Edit3,
    increase_confidence: TrendingUp,
    decrease_confidence: TrendingUp,
  };

  const actionLabels = {
    confirm: "Confirmed",
    reject: "Rejected",
    edit: "Edited",
    increase_confidence: "Confidence Increased",
    decrease_confidence: "Confidence Decreased",
  };

  const actionVariants: Record<string, "success" | "danger" | "warning" | "info"> = {
    confirm: "success",
    reject: "danger",
    edit: "warning",
    increase_confidence: "info",
    decrease_confidence: "warning",
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-violet-500" />
          Verification Center
        </CardTitle>
        <CardDescription>
          Manage and verify this memory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Memory Value */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {memory.value}
            </p>
          </div>
        )}

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Current Confidence</span>
            <span className={cn(
              "font-bold",
              memory.confidence >= 0.7 ? "text-emerald-600 dark:text-emerald-400" :
              memory.confidence >= 0.4 ? "text-yellow-600 dark:text-yellow-400" :
              "text-red-600 dark:text-red-400"
            )}>
              {formatConfidence(memory.confidence)}
            </span>
          </div>
          <Progress value={memory.confidence * 100} variant={memory.confidence >= 0.7 ? "success" : memory.confidence >= 0.4 ? "warning" : "danger"} />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onConfirm}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Confirm
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit Value
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onIncreaseConfidence}
            className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Trust More
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-900">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{memory.confirmationCount}</p>
            <p className="text-[10px] text-zinc-500">Confirmations</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-900">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{memory.contradictionCount}</p>
            <p className="text-[10px] text-zinc-500">Contradictions</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-900">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{memory.confidenceLevel.replace("_", " ")}</p>
            <p className="text-[10px] text-zinc-500">Level</p>
          </div>
        </div>

        <Separator />

        {/* Verification History */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            <History className="h-4 w-4" />
            Verification History
          </h4>
          {history.length === 0 ? (
            <p className="text-xs text-zinc-400">No verification events yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((event) => {
                const ActionIcon = actionIcons[event.action] || History;
                const variant = actionVariants[event.action] || "default";
                return (
                  <div key={event.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={variant} className="flex items-center gap-1 flex-shrink-0">
                        <ActionIcon className="h-3 w-3" />
                        {actionLabels[event.action]}
                      </Badge>
                      <span className="text-xs text-zinc-500 truncate">{event.note}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-2">
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
