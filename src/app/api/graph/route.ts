import { NextResponse } from "next/server";
import { graphService } from "@/lib/services/graph-service";

export async function GET() {
  try {
    const graph = graphService.getGraphWithLayout();
    const stats = graphService.getStats();
    return NextResponse.json({ nodes: graph.nodes, edges: graph.edges, stats });
  } catch (err) {
    console.error("Error fetching graph:", err);
    return NextResponse.json({ error: "Failed to fetch graph" }, { status: 500 });
  }
}
