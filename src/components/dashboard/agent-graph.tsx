"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Brain, Users, BarChart3, Mail, HeadphonesIcon, DollarSign, Activity } from "lucide-react";

interface AgentNode {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  x: number;
  y: number;
  status: "active" | "idle" | "busy";
  color: string;
}

interface FlowParticle {
  id: string;
  from: string;
  to: string;
  progress: number;
}

const agents: AgentNode[] = [
  { id: "ceo", name: "CEO", role: "Orchestrator", icon: <Brain className="h-4 w-4" />, x: 50, y: 5, status: "active", color: "from-violet-500 to-indigo-600" },
  { id: "sales", name: "Sales", role: "Sales", icon: <BarChart3 className="h-4 w-4" />, x: 10, y: 40, status: "active", color: "from-blue-500 to-cyan-500" },
  { id: "crm", name: "CRM", role: "CRM", icon: <Users className="h-4 w-4" />, x: 30, y: 40, status: "idle", color: "from-emerald-500 to-teal-500" },
  { id: "email", name: "Email", role: "Email", icon: <Mail className="h-4 w-4" />, x: 50, y: 40, status: "busy", color: "from-amber-500 to-yellow-500" },
  { id: "support", name: "Support", role: "Support", icon: <HeadphonesIcon className="h-4 w-4" />, x: 70, y: 40, status: "active", color: "from-pink-500 to-rose-500" },
  { id: "finance", name: "Finance", role: "Finance", icon: <DollarSign className="h-4 w-4" />, x: 90, y: 40, status: "active", color: "from-green-500 to-lime-500" },
];

const edges = [
  { from: "ceo", to: "sales" },
  { from: "ceo", to: "crm" },
  { from: "ceo", to: "email" },
  { from: "ceo", to: "support" },
  { from: "ceo", to: "finance" },
];

export function AgentGraph() {
  const [particles, setParticles] = React.useState<FlowParticle[]>([]);
  const [activeEdge, setActiveEdge] = React.useState<string | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      setActiveEdge(`${edge.from}-${edge.to}`);
      const particle: FlowParticle = {
        id: Math.random().toString(36).slice(2, 9),
        from: edge.from,
        to: edge.to,
        progress: 0,
      };
      setParticles((prev) => [...prev, particle]);
      const anim = setInterval(() => {
        setParticles((prev) =>
          prev.map((p) =>
            p.id === particle.id ? { ...p, progress: Math.min(p.progress + 5, 100) } : p
          )
        );
      }, 50);
      setTimeout(() => {
        clearInterval(anim);
        setParticles((prev) => prev.filter((p) => p.id !== particle.id));
        setActiveEdge(null);
      }, 1000);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getNodePos = (id: string) => {
    const node = agents.find((a) => a.id === id);
    return node ? { x: node.x, y: node.y } : { x: 50, y: 50 };
  };

  return (
    <Card className="border-violet-200/50 dark:border-violet-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-500" />
          <CardTitle className="text-base">Agent Orchestration Graph</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[2/1] bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg overflow-hidden">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {edges.map((edge) => {
              const from = getNodePos(edge.from);
              const to = getNodePos(edge.to);
              const isActive = activeEdge === `${edge.from}-${edge.to}`;
              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isActive ? "#8b5cf6" : "#27272a"}
                    strokeWidth={isActive ? 0.8 : 0.4}
                    className={cn("transition-all duration-300", isActive && "animate-pulse-soft")}
                  />
                  {particles
                    .filter((p) => p.from === edge.from && p.to === edge.to)
                    .map((p) => {
                      const px = from.x + (to.x - from.x) * (p.progress / 100);
                      const py = from.y + (to.y - from.y) * (p.progress / 100);
                      return (
                        <circle key={p.id} cx={px} cy={py} r={1} fill="#8b5cf6" className="animate-pulse-soft" />
                      );
                    })}
                </g>
              );
            })}
          </svg>

          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                "absolute flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-300",
                "bg-white dark:bg-zinc-800 border shadow-sm",
                agent.status === "active" && "border-violet-200 dark:border-violet-800",
                agent.status === "idle" && "border-zinc-200 dark:border-zinc-700",
                agent.status === "busy" && "border-amber-200 dark:border-amber-800",
              )}
              style={{
                left: `${agent.x}%`,
                top: `${agent.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className={cn(
                "rounded p-0.5 text-white bg-gradient-to-br",
                agent.color
              )}>
                {agent.icon}
              </div>
              <span className="text-zinc-700 dark:text-zinc-300">{agent.name}</span>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                agent.status === "active" && "bg-emerald-500 animate-pulse-soft",
                agent.status === "idle" && "bg-zinc-400",
                agent.status === "busy" && "bg-amber-500 animate-pulse-soft",
              )} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
