import { NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/analytics-service";

export async function GET() {
  try {
    const data = analyticsService.getAnalytics();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
