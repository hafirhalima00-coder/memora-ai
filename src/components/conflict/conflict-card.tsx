"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate } from "@/lib/utils";
import type { MemoryConflict } from "@/lib/types";
import { AlertTriangle, CheckCircle2, XCircle, Merge, ArrowRight } from "lucide-react";

interface ConflictCardProps {
  conflict: MemoryConflict;
  onResolve: (id: string, resolution: "keep_a" | "keep_b" | "merge" | "reject_both") => void;
  className?: string;
}

export function ConflictCard({ conflict, onResolve, className }: ConflictCardProps) {
  const [resolving, setResolving] = React.useState(false);

  const handleResolve = (resolution: "keep_a" | "keep_b" | "merge" | "reject_both") => {
    setResolving(true);
    onResolve(conflict.id, resolution);
  };

  if (conflict.resolvedAt) {
    return (
      <Card className={cn("opacity-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Resolved ({conflict.resolution?.replace("_", " ")})
            </span>
            <span className="text-xs text-zinc-400 ml-auto">
              {formatDate(conflict.resolvedAt)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Resolved by: {conflict.resolvedBy}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-red-200 dark:border-red-900/50",
      "bg-gradient-to-r from-red-50/50 to-amber-50/50 dark:from-red-950/20 dark:to-amber-950/20",
      className
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
            Conflict Detected
          </span>
          <Badge variant="danger" className="ml-auto text-[10px]">
            {conflict.category}
          </Badge>
        </div>

        {/* Conflicting values */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className="rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {conflict.valueA}
            </p>
            <span className="text-[10px] text-zinc-400">Memory A</span>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <ArrowRight className="h-4 w-4 text-red-500" />
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {conflict.valueB}
            </p>
            <span className="text-[10px] text-zinc-400">Memory B</span>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {conflict.explanation}
        </p>

        <Separator />

        {/* Resolution actions */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Choose resolution:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve("keep_a")}
              disabled={resolving}
              className="text-xs h-8"
            >
              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
              Keep A
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve("keep_b")}
              disabled={resolving}
              className="text-xs h-8"
            >
              <CheckCircle2 className="h-3 w-3 mr-1 text-blue-500" />
              Keep B
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve("merge")}
              disabled={resolving}
              className="text-xs h-8"
            >
              <Merge className="h-3 w-3 mr-1 text-purple-500" />
              Merge
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve("reject_both")}
              disabled={resolving}
              className="text-xs h-8 text-red-600 hover:text-red-700"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject Both
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-zinc-400">
          Detected: {formatDate(conflict.detectedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
