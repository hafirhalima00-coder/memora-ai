"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Bot,
  RefreshCw,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "running" | "waiting" | "blocked" | "idle" | "error";
  progress: number;
  task: string;
}

interface ToolCall {
  id: string;
  agent: string;
  tool: string;
  input: string;
  output: string;
  status: "success" | "error" | "running";
  timestamp: Date;
}

interface LiveEvent {
  id: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp: Date;
}

const initialAgents: Agent[] = [
  { id: "1", name: "Sales Agent", role: "Sales", status: "running", progress: 67, task: "Processing refund request #A-421" },
  { id: "2", name: "CRM Agent", role: "CRM", status: "waiting", progress: 34, task: "Syncing contact records" },
  { id: "3", name: "Email Agent", role: "Email", status: "idle", progress: 100, task: "Awaiting instructions" },
  { id: "4", name: "Support Agent", role: "Support", status: "running", progress: 82, task: "Resolving ticket #T-889" },
  { id: "5", name: "Finance Agent", role: "Finance", status: "blocked", progress: 45, task: "Awaiting approval for $1,200 refund" },
  { id: "6", name: "Compliance Agent", role: "Compliance", status: "running", progress: 23, task: "Auditing recent transactions" },
];

const toolNames = ["read_database", "write_memory", "send_email", "process_payment", "validate_policy", "fetch_crm", "generate_report", "classify_intent"];
const toolInputs = [
  'SELECT * FROM orders WHERE amount > 1000',
  'UPDATE customer SET status = "vip"',
  'To: user@example.com, Subject: Refund Confirmed',
  'Amount: $1,200, Method: Credit Card',
  'Policy FIN-004: Missing customer signature',
  'GET /api/v2/contacts?segment=enterprise',
  'Type: Monthly Summary, Period: Q2-2026',
  'Intent: refund_request, Confidence: 97%',
];

const eventMessages = [
  "Sales Agent dispatched to handle refund request",
  "CRM Agent syncing 1,247 new contacts",
  "Finance Agent flagged transaction #A-421 for review",
  "Compliance Agent completed audit of 89 records",
  "Email Agent sent confirmation to user@example.com",
  "Support Agent escalated ticket #T-889 to level 2",
  "Memory confidence decay detected for 3 old records",
  "Conflict detected: location 'Paris' vs 'London'",
  "Verification queue has 12 pending items",
  "Trust score updated for source 'AI Inference'",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateToolCall(agentName: string): ToolCall {
  const tool = getRandomItem(toolNames);
  const input = getRandomItem(toolInputs);
  return {
    id: Math.random().toString(36).slice(2, 9),
    agent: agentName,
    tool,
    input,
    output: "",
    status: "running",
    timestamp: new Date(),
  };
}

export function LiveSimulation() {
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents);
  const [toolCalls, setToolCalls] = React.useState<ToolCall[]>([]);
  const [events, setEvents] = React.useState<LiveEvent[]>([]);
  const [isRunning, setIsRunning] = React.useState(true);
  const eventsEndRef = React.useRef<HTMLDivElement>(null);

  const addEvent = React.useCallback((type: LiveEvent["type"], message: string) => {
    setEvents((prev) => {
      const next = [...prev, { id: Math.random().toString(36).slice(2, 9), type, message, timestamp: new Date() }];
      return next.slice(-50);
    });
  }, []);

  React.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          const newProgress = Math.min(a.progress + Math.floor(Math.random() * 15) + 1, 100);
          const newStatus = a.status === "idle" ? "idle" : newProgress >= 100 ? "idle" : getRandomItem(["running", "running", "running", "waiting", "blocked"]) as Agent["status"];
          return { ...a, progress: newProgress >= 100 ? 0 : newProgress, status: newProgress >= 100 ? "idle" : newStatus, task: newProgress >= 100 ? getRandomItem(["Completed", "Awaiting instructions"]) : a.task };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning]);

  React.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const agent = getRandomItem(agents);
      const call = generateToolCall(agent.name);
      setToolCalls((prev) => {
        const next = [call, ...prev];
        return next.slice(-20);
      });
      addEvent("info", `${agent.name} called ${call.tool}`);
      setTimeout(() => {
        setToolCalls((prev) =>
          prev.map((tc) =>
            tc.id === call.id
              ? { ...tc, status: Math.random() > 0.15 ? "success" as const : "error" as const, output: tc.status === "success" ? "Completed successfully" : "Failed: timeout exceeded" }
              : tc
          )
        );
      }, 1500);
    }, 2500);
    return () => clearInterval(interval);
  }, [isRunning, agents, addEvent]);

  React.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const msg = getRandomItem(eventMessages);
      const type = getRandomItem<LiveEvent["type"]>(["info", "info", "info", "success", "warning"]);
      addEvent(type, msg);
    }, 4000);
    return () => clearInterval(interval);
  }, [isRunning, addEvent]);

  React.useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const statusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "running": return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case "waiting": return <Clock className="h-3 w-3 text-amber-500" />;
      case "blocked": return <XCircle className="h-3 w-3 text-red-500" />;
      case "idle": return <CheckCircle2 className="h-3 w-3 text-zinc-400" />;
      case "error": return <XCircle className="h-3 w-3 text-red-600" />;
    }
  };

  const eventIcon = (type: LiveEvent["type"]) => {
    switch (type) {
      case "info": return <Terminal className="h-3 w-3 text-blue-400" />;
      case "success": return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
      case "error": return <XCircle className="h-3 w-3 text-red-400" />;
      case "warning": return <Clock className="h-3 w-3 text-amber-400" />;
    }
  };

  return (
    <Card className="border-violet-200/50 dark:border-violet-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-500" />
          <CardTitle className="text-base">Live Agent Simulation</CardTitle>
          <Badge variant={isRunning ? "success" : "secondary"} className="text-[10px]">
            {isRunning ? "LIVE" : "PAUSED"}
          </Badge>
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <RefreshCw className={cn("h-3 w-3", isRunning && "animate-spin")} />
          {isRunning ? "Pause" : "Resume"}
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                "rounded-lg border p-3 transition-all duration-300",
                agent.status === "running" && "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20",
                agent.status === "blocked" && "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20",
                agent.status === "waiting" && "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
                agent.status === "idle" && "border-zinc-200 dark:border-zinc-800",
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {statusIcon(agent.status)}
                  <span className="text-xs font-semibold">{agent.name}</span>
                </div>
                <Badge
                  variant={
                    agent.status === "running" ? "info" :
                    agent.status === "waiting" ? "warning" :
                    agent.status === "blocked" ? "danger" : "secondary"
                  }
                  className="text-[9px] uppercase px-1.5 py-0"
                >
                  {agent.status}
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mb-2">
                {agent.task}
              </p>
              <Progress
                value={agent.progress}
                variant={
                  agent.status === "running" ? "default" :
                  agent.status === "blocked" ? "danger" :
                  agent.status === "waiting" ? "warning" : "success"
                }
                className="h-1"
              />
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Terminal className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Recent Tool Calls</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {toolCalls.length === 0 && (
              <p className="text-[10px] text-zinc-400 italic">No tool calls yet...</p>
            )}
            {toolCalls.map((call) => (
              <div key={call.id} className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 animate-slide-in">
                <span className={cn(
                  "flex-shrink-0",
                  call.status === "success" && "text-emerald-500",
                  call.status === "error" && "text-red-500",
                  call.status === "running" && "text-blue-500",
                )}>
                  {call.status === "running" ? "●" : call.status === "success" ? "✓" : "✗"}
                </span>
                <span className="text-violet-500 dark:text-violet-400">{call.agent}</span>
                <ArrowRight className="h-2.5 w-2.5" />
                <span className="text-amber-500">{call.tool}</span>
                <span className="truncate text-zinc-400">{call.input.slice(0, 40)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Event Log</span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {events.length === 0 && (
              <p className="text-[10px] text-zinc-400 italic">Waiting for events...</p>
            )}
            {events.map((evt) => (
              <div key={evt.id} className="flex items-center gap-2 text-[10px] animate-slide-in">
                {eventIcon(evt.type)}
                <span className="text-zinc-500">{evt.timestamp.toLocaleTimeString()}</span>
                <span className={cn(
                  "flex-1",
                  evt.type === "error" && "text-red-400",
                  evt.type === "success" && "text-emerald-400",
                  evt.type === "warning" && "text-amber-400",
                  evt.type === "info" && "text-zinc-400",
                )}>
                  {evt.message}
                </span>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
