import { NextRequest, NextResponse } from "next/server";
import { memoryService } from "@/lib/services/memory-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const memories = memoryService.getAll({ category, status, search });
    return NextResponse.json(memories.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      lastVerifiedAt: m.lastVerifiedAt?.toISOString() ?? null,
      expiresAt: m.expiresAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("Error fetching memories:", err);
    return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const memory = memoryService.create(body);
    return NextResponse.json({
      ...memory,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
      lastVerifiedAt: memory.lastVerifiedAt?.toISOString() ?? null,
      expiresAt: memory.expiresAt?.toISOString() ?? null,
    }, { status: 201 });
  } catch (err) {
    console.error("Error creating memory:", err);
    return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
  }
}
