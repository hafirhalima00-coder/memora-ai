"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MemoryGraph } from "@/components/graph/memory-graph";
import { cn } from "@/lib/utils";
import { Share2, RefreshCw } from "lucide-react";
import { getGraph } from "@/lib/api-client";

export default function GraphPage() {
  const [graphData, setGraphData] = React.useState<{
    nodes: (any & { x: number; y: number; radius: number })[];
    edges: any[];
  }>({ nodes: [], edges: [] });
  const [stats, setStats] = React.useState<{
    nodeCount: number;
    edgeCount: number;
    categoryCount: number;
    conflictEdges: number;
    supportEdges: number;
    relatedEdges: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadGraph = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGraph();
      setGraphData({ nodes: data.nodes, edges: data.edges });
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to load graph:", err);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Share2 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Memory Graph</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
            Visualize relationships between memories
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadGraph} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Graph stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.nodeCount}</p>
              <p className="text-[10px] text-zinc-500">Nodes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.edgeCount}</p>
              <p className="text-[10px] text-zinc-500">Edges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.categoryCount}</p>
              <p className="text-[10px] text-zinc-500">Categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.conflictEdges}</p>
              <p className="text-[10px] text-zinc-500">Conflicts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.supportEdges}</p>
              <p className="text-[10px] text-zinc-500">Supports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{stats.relatedEdges}</p>
              <p className="text-[10px] text-zinc-500">Related</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main graph */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      ) : (
        <MemoryGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          title=""
          description=""
        />
      )}
    </div>
  );
}
