import { NextRequest, NextResponse } from "next/server";
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
    return NextResponse.json({
      ...memory,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
      lastVerifiedAt: memory.lastVerifiedAt?.toISOString() ?? null,
      expiresAt: memory.expiresAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Error fetching memory:", err);
    return NextResponse.json({ error: "Failed to fetch memory" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const memory = memoryService.update(id, body);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...memory,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
      lastVerifiedAt: memory.lastVerifiedAt?.toISOString() ?? null,
      expiresAt: memory.expiresAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Error updating memory:", err);
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = memoryService.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting memory:", err);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}
