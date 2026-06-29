import { NextRequest, NextResponse } from "next/server";
import { exportService } from "@/lib/services/export-service";

export async function GET() {
  try {
    const data = exportService.exportAll("default_user");
    return NextResponse.json(data);
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = exportService.importData(body, "default_user");
    return NextResponse.json(result);
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
