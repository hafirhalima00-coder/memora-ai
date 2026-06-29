"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { TimelineChart } from "@/components/timeline/timeline-chart";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";
import { Timeline, RefreshCw } from "lucide-react";
import { getTimeline } from "@/lib/api-client";

export default function TimelinePage() {
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");

  const loadTimeline = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTimeline();
      setEvents(data);
    } catch (err) { console.error("Failed to load timeline:", err); }
    setLoading(false);
  }, []);

  React.useEffect(() => { loadTimeline(); }, [loadTimeline]);

  const filteredEvents = filter === "all" ? events : events.filter(e => e.type === filter);
  const types = ["all", "created", "confirmed", "rejected", "updated", "expired", "conflicted", "verified"];
  const counts = events.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Timeline className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Memory Timeline</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">Visual history of memory events</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTimeline} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button key={type} onClick={() => setFilter(type)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === type ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            )}>
            {type === "all" ? "All" : type}
            {counts[type] && <span className="ml-1 opacity-60">({counts[type]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : <TimelineChart events={filteredEvents} title="" description="" />}
    </div>
  );
}
