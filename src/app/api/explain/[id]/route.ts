import { NextRequest, NextResponse } from "next/server";
import { confidenceEngine } from "@/lib/services/confidence-engine";
import { verificationService } from "@/lib/services/verification-service";
import { memoryService } from "@/lib/services/memory-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memory = memoryService.getById(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const factors = confidenceEngine.calculate(id);
    const history = verificationService.getVerificationHistory(id);

    return NextResponse.json({
      memory,
      factors,
      history: history.map(h => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Error fetching explanation:", err);
    return NextResponse.json({ error: "Failed to fetch explanation" }, { status: 500 });
  }
}
