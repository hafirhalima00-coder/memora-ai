"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Share2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface GraphNode {
  id: string;
  value: string;
  category: string;
  confidence: number;
  verificationStatus: string;
  x: number;
  y: number;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

interface MemoryGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  className?: string;
  title?: string;
  description?: string;
}

const categoryNodeColors: Record<string, { fill: string; stroke: string; text: string }> = {
  preference: { fill: "fill-purple-500/20", stroke: "stroke-purple-500", text: "text-purple-600" },
  fact: { fill: "fill-blue-500/20", stroke: "stroke-blue-500", text: "text-blue-600" },
  habit: { fill: "fill-green-500/20", stroke: "stroke-green-500", text: "text-green-600" },
  goal: { fill: "fill-orange-500/20", stroke: "stroke-orange-500", text: "text-orange-600" },
  opinion: { fill: "fill-pink-500/20", stroke: "stroke-pink-500", text: "text-pink-600" },
  relationship: { fill: "fill-rose-500/20", stroke: "stroke-rose-500", text: "text-rose-600" },
  location: { fill: "fill-cyan-500/20", stroke: "stroke-cyan-500", text: "text-cyan-600" },
  event: { fill: "fill-amber-500/20", stroke: "stroke-amber-500", text: "text-amber-600" },
  identity: { fill: "fill-indigo-500/20", stroke: "stroke-indigo-500", text: "text-indigo-600" },
  knowledge: { fill: "fill-teal-500/20", stroke: "stroke-teal-500", text: "text-teal-600" },
};

const edgeStyles: Record<string, { stroke: string; dash: string; opacity: number }> = {
  contradicts: { stroke: "#ef4444", dash: "6,3", opacity: 0.7 },
  supports: { stroke: "#22c55e", dash: "", opacity: 0.5 },
  related_to: { stroke: "#a78bfa", dash: "3,3", opacity: 0.3 },
  derived_from: { stroke: "#f59e0b", dash: "4,4", opacity: 0.5 },
};

export function MemoryGraph({
  nodes,
  edges,
  className,
  title = "Memory Graph",
  description = "Relationships between memories",
}: MemoryGraphProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number } | null>(null);

  const VIEW_BOX = { width: 800, height: 700 };

  const handleZoomIn = () => setScale(s => Math.min(s * 1.3, 4));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.3, 0.3));
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setDragging(false);

  const getNodeColor = (node: GraphNode) => {
    return categoryNodeColors[node.category] || categoryNodeColors.fact;
  };

  const getEdgeStyle = (edge: GraphEdge) => {
    return edgeStyles[edge.relationship] || edgeStyles.related_to;
  };

  const getNodeStatus = (status: string) => {
    switch (status) {
      case "verified": return "ring-emerald-400";
      case "conflicting": return "ring-red-400";
      case "expired": return "ring-gray-400";
      case "rejected": return "ring-rose-400";
      default: return "ring-yellow-400";
    }
  };

  const hoveredNodeData = hoveredNode ? nodes.find(n => n.id === hoveredNode) : null;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-violet-500" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4 text-zinc-500" />
          </button>
          <button
            onClick={handleZoomOut}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4 text-zinc-500" />
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Share2 className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No memories to graph</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Create memories to see relationships
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
              className="w-full h-[500px] cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
                {/* Edges */}
                {edges.map((edge, i) => {
                  const source = nodes.find(n => n.id === edge.source);
                  const target = nodes.find(n => n.id === edge.target);
                  if (!source || !target) return null;
                  const style = getEdgeStyle(edge);

                  return (
                    <line
                      key={`edge-${i}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={style.stroke}
                      strokeWidth={edge.strength * 3}
                      strokeDasharray={style.dash}
                      opacity={style.opacity}
                      className="transition-opacity duration-200"
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const colors = getNodeColor(node);
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseEnter={() => { setHoveredNode(node.id); }}
                      onMouseLeave={() => { setHoveredNode(null); }}
                      className="transition-transform duration-200"
                      style={{ cursor: "pointer" }}
                    >
                      {/* Glow effect for hovered node */}
                      {hoveredNode === node.id && (
                        <circle
                          r={node.radius + 8}
                          fill="none"
                          stroke="rgba(139, 92, 246, 0.3)"
                          strokeWidth={2}
                          className="animate-pulse"
                        />
                      )}
                      {/* Main circle */}
                      <circle
                        r={node.radius}
                        className={cn(
                          colors.fill,
                          colors.stroke,
                          "transition-all duration-200",
                          hoveredNode === node.id ? "stroke-[3]" : "stroke-[1.5]"
                        )}
                        fill={hoveredNode === node.id ? "rgba(139, 92, 246, 0.15)" : undefined}
                      />
                      {/* Status indicator ring */}
                      <circle
                        r={node.radius + 3}
                        fill="none"
                        className={cn(
                          "stroke-[2]",
                          getNodeStatus(node.verificationStatus)
                        )}
                        opacity={0.5}
                      />
                      {/* Node label */}
                      <text
                        textAnchor="middle"
                        dy={node.radius + 16}
                        className={cn(
                          "text-[10px] font-medium fill-zinc-600 dark:fill-zinc-400",
                          hoveredNode === node.id && "fill-violet-600 dark:fill-violet-400"
                        )}
                      >
                        {node.value.length > 20 ? node.value.substring(0, 20) + "..." : node.value}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              {Object.entries(edgeStyles).map(([key, style]) => (
                <div key={key} className="flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 px-2.5 py-1 text-[10px] text-zinc-500 backdrop-blur-sm">
                  <svg width="12" height="12" className="flex-shrink-0">
                    <line
                      x1="0" y1="6" x2="12" y2="6"
                      stroke={style.stroke}
                      strokeWidth="2"
                      strokeDasharray={style.dash}
                    />
                  </svg>
                  {key.replace("_", " ")}
                </div>
              ))}
            </div>

            {/* Node count */}
            <div className="absolute top-3 right-3 rounded-full bg-white/80 dark:bg-zinc-900/80 px-3 py-1 text-xs text-zinc-500 backdrop-blur-sm">
              {nodes.length} nodes · {edges.length} edges
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
