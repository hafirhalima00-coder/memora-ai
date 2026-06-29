import { NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/lib/services/verification-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = verificationService.getVerificationHistory(id);
    return NextResponse.json(
      history.map(h => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Error fetching verification history:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
