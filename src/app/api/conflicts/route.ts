import { NextRequest, NextResponse } from "next/server";
import { conflictDetector } from "@/lib/services/conflict-detector";

export async function GET() {
  try {
    const conflicts = conflictDetector.getAllUnresolved();
    const stats = conflictDetector.getStats();
    return NextResponse.json({ conflicts, stats });
  } catch (err) {
    console.error("Error fetching conflicts:", err);
    return NextResponse.json({ error: "Failed to fetch conflicts" }, { status: 500 });
  }
}
