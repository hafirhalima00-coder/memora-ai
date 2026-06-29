import { NextResponse } from "next/server";
import { timelineService } from "@/lib/services/timeline-service";

export async function GET() {
  try {
    const events = timelineService.getTimeline("default_user", 100);
    return NextResponse.json(
      events.map(e => ({
        ...e,
        timestamp: e.timestamp.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Error fetching timeline:", err);
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }
}
