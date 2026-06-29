import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/lib/services/audit-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const action = searchParams.get("action") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const result = auditService.getEntries({ entityType, entityId, action, limit, offset });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Audit fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }
}
