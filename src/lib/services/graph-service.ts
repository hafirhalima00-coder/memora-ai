import { getDb } from "@/lib/db/connection";
import type { MemoryGraph, MemoryNode, MemoryEdge, Memory } from "@/lib/types";

export class GraphService {
  /**
   * Build a graph from memories and their relationships
   */
  getGraph(userId: string = "default_user"): MemoryGraph {
    const db = getDb();

    // Get all memories for this user
    const memories = db.prepare(`
      SELECT m.*, s.name as source_name, s.reliability as source_reliability, s.type as source_type
      FROM memories m
      JOIN sources s ON m.source_id = s.id
      WHERE m.user_id = ?
    `).all(userId) as Array<{
      id: string; value: string; category: string;
      confidence: number; verification_status: string;
    }>;

    // Build nodes
    const nodes: MemoryNode[] = memories.map(m => ({
      id: m.id,
      value: m.value,
      category: m.category as Memory["category"],
      confidence: m.confidence,
      verificationStatus: m.verification_status as Memory["verificationStatus"],
    }));

    // Build edges from relationships
    const edges: MemoryEdge[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));
    const addedEdges = new Set<string>();

    // 1. Conflict edges from memory_conflicts
    const conflicts = db.prepare(`
      SELECT memory_id_a, memory_id_b FROM memory_conflicts WHERE resolved_at IS NULL
    `).all() as { memory_id_a: string; memory_id_b: string }[];

    for (const c of conflicts) {
      if (nodeIds.has(c.memory_id_a) && nodeIds.has(c.memory_id_b)) {
        const edgeKey = [c.memory_id_a, c.memory_id_b].sort().join("-");
        if (!addedEdges.has(edgeKey)) {
          edges.push({
            source: c.memory_id_a,
            target: c.memory_id_b,
            relationship: "contradicts",
            strength: 0.9,
          });
          addedEdges.add(edgeKey);
        }
      }
    }

    // 2. Same-category edges (related_to)
    const categoryMap = new Map<string, string[]>();
    for (const node of nodes) {
      if (!categoryMap.has(node.category)) {
        categoryMap.set(node.category, []);
      }
      categoryMap.get(node.category)!.push(node.id);
    }

    for (const [, ids] of categoryMap) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const edgeKey = [ids[i], ids[j]].sort().join("-");
          if (!addedEdges.has(edgeKey)) {
            edges.push({
              source: ids[i],
              target: ids[j],
              relationship: "related_to",
              strength: 0.3,
            });
            addedEdges.add(edgeKey);
          }
        }
      }
    }

    // 3. Support edges (verified memories from same source support each other)
    const verifiedHighConfidence = nodes.filter(
      n => n.verificationStatus === "verified" && n.confidence >= 0.7
    );

    for (let i = 0; i < verifiedHighConfidence.length; i++) {
      for (let j = i + 1; j < verifiedHighConfidence.length; j++) {
        const edgeKey = [verifiedHighConfidence[i].id, verifiedHighConfidence[j].id].sort().join("-sup");
        if (!addedEdges.has(edgeKey)) {
          edges.push({
            source: verifiedHighConfidence[i].id,
            target: verifiedHighConfidence[j].id,
            relationship: "supports",
            strength: 0.6,
          });
          addedEdges.add(edgeKey);
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Get simplified graph for visualization (with layout positions)
   */
  getGraphWithLayout(userId: string = "default_user"): {
    nodes: (MemoryNode & { x: number; y: number; radius: number })[];
    edges: MemoryEdge[];
  } {
    const graph = this.getGraph(userId);
    const { nodes, edges } = graph;

    // Calculate positions using a simple force-directed layout approximation
    const positionedNodes = this.calculateLayout(nodes, edges);

    return {
      nodes: positionedNodes,
      edges,
    };
  }

  private calculateLayout(
    nodes: MemoryNode[],
    edges: MemoryEdge[]
  ): (MemoryNode & { x: number; y: number; radius: number })[] {
    // Simple circular layout with category-based grouping
    const categoryGroups = new Map<string, MemoryNode[]>();
    for (const node of nodes) {
      if (!categoryGroups.has(node.category)) {
        categoryGroups.set(node.category, []);
      }
      categoryGroups.get(node.category)!.push(node);
    }

    const categories = Array.from(categoryGroups.keys());
    const angleStep = (2 * Math.PI) / Math.max(categories.length, 1);
    const baseRadius = 200;

    const result: (MemoryNode & { x: number; y: number; radius: number })[] = [];

    for (let ci = 0; ci < categories.length; ci++) {
      const cats = categories[ci];
      const mems = categoryGroups.get(cats)!;
      const centerAngle = ci * angleStep;
      const centerX = 400 + baseRadius * Math.cos(centerAngle);
      const centerY = 350 + baseRadius * Math.sin(centerAngle);

      const subRadius = 60;
      const subAngleStep = (2 * Math.PI) / Math.max(mems.length, 1);

      for (let mi = 0; mi < mems.length; mi++) {
        const m = mems[mi];
        const subAngle = mi * subAngleStep;
        const x = centerX + subRadius * Math.cos(subAngle);
        const y = centerY + subRadius * Math.sin(subAngle);
        const radius = 20 + m.confidence * 25;

        result.push({ ...m, x, y, radius });
      }
    }

    return result;
  }

  /**
   * Get graph statistics
   */
  getStats(userId: string = "default_user"): {
    nodeCount: number;
    edgeCount: number;
    categoryCount: number;
    conflictEdges: number;
    supportEdges: number;
    relatedEdges: number;
  } {
    const graph = this.getGraph(userId);
    return {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      categoryCount: new Set(graph.nodes.map(n => n.category)).size,
      conflictEdges: graph.edges.filter(e => e.relationship === "contradicts").length,
      supportEdges: graph.edges.filter(e => e.relationship === "supports").length,
      relatedEdges: graph.edges.filter(e => e.relationship === "related_to").length,
    };
  }
}

export const graphService = new GraphService();
