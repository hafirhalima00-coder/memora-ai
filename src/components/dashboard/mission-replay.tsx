"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Play,
  StepForward,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface ReplayStep {
  id: number;
  time: string;
  agent: string;
  action: string;
  detail: string;
  status: "success" | "error" | "info" | "blocked";
}

const replayTimeline: ReplayStep[] = [
  { id: 1, time: "T+0.0s", agent: "CEO", action: "Dispatch", detail: "Received request: Refund $1,200 for Order #A-421", status: "info" },
  { id: 2, time: "T+0.3s", agent: "CEO", action: "Route", detail: "Delegating to Sales Agent", status: "info" },
  { id: 3, time: "T+0.6s", agent: "Sales Agent", action: "Validate", detail: "Checking order validity and customer history", status: "info" },
  { id: 4, time: "T+1.0s", agent: "Sales Agent", action: "Policy Check", detail: "Verifying against FIN-004: refund policy", status: "success" },
  { id: 5, time: "T+1.4s", agent: "Sales Agent", action: "Risk Assessment", detail: "Amount $1,200 exceeds $500 auto-approval limit", status: "blocked" },
  { id: 6, time: "T+1.8s", agent: "Finance Agent", action: "Review", detail: "Flagged for human approval: High risk", status: "info" },
  { id: 7, time: "T+2.2s", agent: "Compliance Agent", action: "Audit", detail: "Checking for fraud patterns and history", status: "info" },
  { id: 8, time: "T+2.6s", agent: "Compliance Agent", action: "Report", detail: "No fraud detected. Awaiting human decision.", status: "success" },
  { id: 9, time: "T+3.0s", agent: "CEO", action: "Escalate", detail: "Sending to Human Approval Center for review", status: "blocked" },
  { id: 10, time: "T+3.5s", agent: "Human", action: "Approve", detail: "Manager reviewed and approved refund", status: "success" },
  { id: 11, time: "T+3.8s", agent: "Sales Agent", action: "Execute", detail: "Processing refund of $1,200", status: "info" },
  { id: 12, time: "T+4.2s", agent: "Email Agent", action: "Notify", detail: "Sending confirmation to customer", status: "success" },
];

export function MissionReplay() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= replayTimeline.length) {
      setIsPlaying(false);
      setCompleted(true);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const handlePlay = () => {
    if (completed) {
      setCurrentStep(0);
      setCompleted(false);
    }
    setIsPlaying(true);
  };

  const handleStep = () => {
    if (completed) {
      setCurrentStep(0);
      setCompleted(false);
    }
    setCurrentStep((prev) => Math.min(prev + 1, replayTimeline.length));
    if (currentStep >= replayTimeline.length - 1) {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setCompleted(false);
  };

  const statusIcon = (status: ReplayStep["status"]) => {
    switch (status) {
      case "success": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "error": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case "blocked": return <XCircle className="h-3.5 w-3.5 text-amber-500" />;
      case "info": return <ArrowRight className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  return (
    <Card className="border-blue-200/50 dark:border-blue-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-base">Mission Replay</CardTitle>
          {completed && <Badge variant="success" className="text-[10px]">Complete</Badge>}
          {isPlaying && <Badge variant="info" className="text-[10px] animate-pulse-soft">Playing</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleReset}
            disabled={currentStep === 0 && !completed}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={handleStep}
            disabled={isPlaying || completed}
          >
            <StepForward className="h-3 w-3 mr-1" />
            Step
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px]"
            onClick={handlePlay}
            disabled={isPlaying}
          >
            {isPlaying ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {completed ? "Replay" : isPlaying ? "Playing" : "Play"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Progress
          value={replayTimeline.length > 0 ? (currentStep / replayTimeline.length) * 100 : 0}
          variant="default"
          className="h-1 mb-4"
        />
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {replayTimeline.slice(0, currentStep).map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg animate-slide-in text-[11px]"
            >
              <span className="text-[10px] font-mono text-zinc-400 w-12 flex-shrink-0">{step.time}</span>
              {statusIcon(step.status)}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 w-24 flex-shrink-0">{step.agent}</span>
              <Badge
                variant={
                  step.status === "success" ? "success" :
                  step.status === "error" ? "destructive" :
                  step.status === "blocked" ? "warning" : "secondary"
                }
                className="text-[9px] w-16 flex-shrink-0 justify-center"
              >
                {step.action}
              </Badge>
              <span className="text-zinc-500 dark:text-zinc-400 truncate">{step.detail}</span>
            </div>
          ))}
          {currentStep === 0 && (
            <div className="flex items-center justify-center py-8 text-zinc-400 text-xs">
              <Play className="h-4 w-4 mr-2" />
              Press Play to start the mission replay
            </div>
          )}
          {isPlaying && currentStep < replayTimeline.length && (
            <div className="flex items-center gap-2 py-1.5 px-2 animate-pulse-soft">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-[10px] text-blue-500">Executing next step...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
