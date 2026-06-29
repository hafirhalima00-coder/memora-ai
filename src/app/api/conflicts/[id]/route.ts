import { NextRequest, NextResponse } from "next/server";
import { conflictDetector } from "@/lib/services/conflict-detector";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const conflict = conflictDetector.resolveConflict(id, body.resolution, body.resolvedBy);
    if (!conflict) {
      return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, conflict });
  } catch (err) {
    console.error("Error resolving conflict:", err);
    return NextResponse.json({ error: "Failed to resolve conflict" }, { status: 500 });
  }
}
