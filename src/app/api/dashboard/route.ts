import { NextResponse } from "next/server";
import { memoryService } from "@/lib/services/memory-service";

export async function GET() {
  try {
    const stats = memoryService.getDashboardStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
