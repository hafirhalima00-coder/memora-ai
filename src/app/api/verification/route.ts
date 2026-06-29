import { NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/lib/services/verification-service";

export async function GET() {
  try {
    const pending = verificationService.getPendingVerifications();
    return NextResponse.json(
      pending.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        lastVerifiedAt: m.lastVerifiedAt?.toISOString() ?? null,
        expiresAt: m.expiresAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    console.error("Error fetching pending verifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { memoryId, action, note } = await request.json();

    let result;
    switch (action) {
      case "confirm":
        result = verificationService.confirmMemory(memoryId, "default_user", note || "");
        break;
      case "reject":
        result = verificationService.rejectMemory(memoryId, "default_user", note || "");
        break;
      case "increase_confidence":
        result = verificationService.increaseConfidence(memoryId, "default_user", note || "");
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      memory: {
        ...result.memory,
        createdAt: result.memory.createdAt.toISOString(),
        updatedAt: result.memory.updatedAt.toISOString(),
        lastVerifiedAt: result.memory.lastVerifiedAt?.toISOString() ?? null,
        expiresAt: result.memory.expiresAt?.toISOString() ?? null,
      },
      event: {
        ...result.event,
        createdAt: result.event.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in verification action:", err);
    return NextResponse.json({ error: "Failed to process verification" }, { status: 500 });
  }
}
