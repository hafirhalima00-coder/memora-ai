import { getDb } from "@/lib/db/connection";
import { confidenceEngine } from "@/lib/services/confidence-engine";
import { conflictDetector } from "@/lib/services/conflict-detector";
import {
  type Memory,
  type CreateMemoryInput,
  type UpdateMemoryInput,
  type DashboardStats,
  getConfidenceLevel,
} from "@/lib/types";
import { generateId } from "@/lib/utils";

interface MemoryRow {
  id: string;
  user_id: string;
  value: string;
  category: string;
  confidence: number;
  source_id: string;
  verification_status: string;
  confirmation_count: number;
  contradiction_count: number;
  tags: string;
  explanation: string;
  metadata: string;
  created_at: string;
  updated_at: string;
  last_verified_at: string | null;
  expires_at: string | null;
  source_name: string;
  source_reliability: string;
  source_type: string;
}

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    value: row.value,
    category: row.category as Memory["category"],
    confidence: row.confidence,
    confidenceLevel: getConfidenceLevel(row.confidence),
    source: {
      id: row.source_id,
      name: row.source_name,
      reliability: row.source_reliability as Memory["source"]["reliability"],
      type: row.source_type as Memory["source"]["type"],
    },
    verificationStatus: row.verification_status as Memory["verificationStatus"],
    confirmationCount: row.confirmation_count,
    contradictionCount: row.contradiction_count,
    tags: JSON.parse(row.tags),
    explanation: row.explanation,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastVerifiedAt: row.last_verified_at ? new Date(row.last_verified_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    metadata: JSON.parse(row.metadata),
  };
}

export class MemoryService {
  private baseQuery = `
    SELECT m.*, s.name as source_name, s.reliability as source_reliability, s.type as source_type
    FROM memories m
    JOIN sources s ON m.source_id = s.id
  `;

  getAll(options?: {
    category?: string;
    status?: string;
    userId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Memory[] {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options?.userId) {
      conditions.push("m.user_id = ?");
      params.push(options.userId);
    }
    if (options?.category) {
      conditions.push("m.category = ?");
      params.push(options.category);
    }
    if (options?.status) {
      conditions.push("m.verification_status = ?");
      params.push(options.status);
    }
    if (options?.search) {
      conditions.push("(m.value LIKE ? OR m.tags LIKE ?)");
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = options?.sortBy
      ? `ORDER BY m.${options.sortBy} ${options.sortOrder === "asc" ? "ASC" : "DESC"}`
      : "ORDER BY m.created_at DESC";
    const limit = options?.limit ? `LIMIT ${options.limit}` : "";
    const offset = options?.offset ? `OFFSET ${options.offset}` : "";

    const rows = db.prepare(`${this.baseQuery} ${where} ${orderBy} ${limit} ${offset}`)
      .all(...params) as MemoryRow[];

    return rows.map(rowToMemory);
  }

  getById(id: string): Memory | null {
    const db = getDb();
    const row = db.prepare(`${this.baseQuery} WHERE m.id = ?`).get(id) as MemoryRow | undefined;
    return row ? rowToMemory(row) : null;
  }

  create(input: CreateMemoryInput): Memory {
    const db = getDb();
    const id = generateId();
    const explanation = `Created from ${input.source.name} (${input.source.reliability} reliability). ${input.source.type === "user_input" ? "Direct from user." : "Inferred from available data."}`;

    db.prepare(`
      INSERT INTO memories (id, user_id, value, category, confidence, source_id, 
        verification_status, confirmation_count, contradiction_count, 
        tags, explanation, metadata, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id,
      input.userId,
      input.value,
      input.category,
      0.3,
      input.source.id,
      "unverified",
      0,
      0,
      JSON.stringify(input.tags ?? []),
      explanation,
      JSON.stringify(input.metadata ?? {}),
      input.expiresAt?.toISOString() ?? null,
    );

    // Calculate initial confidence
    const factors = confidenceEngine.calculate(id);
    db.prepare("UPDATE memories SET confidence = ?, explanation = ? WHERE id = ?")
      .run(factors.finalScore, explanation, id);

    // Check for conflicts
    conflictDetector.checkForConflicts(id);

    return this.getById(id)!;
  }

  update(id: string, input: UpdateMemoryInput): Memory | null {
    const db = getDb();
    const existing = this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.value !== undefined) {
      updates.push("value = ?");
      params.push(input.value);
    }
    if (input.category !== undefined) {
      updates.push("category = ?");
      params.push(input.category);
    }
    if (input.tags !== undefined) {
      updates.push("tags = ?");
      params.push(JSON.stringify(input.tags));
    }
    if (input.metadata !== undefined) {
      updates.push("metadata = ?");
      params.push(JSON.stringify(input.metadata));
    }
    if (input.expiresAt !== undefined) {
      updates.push("expires_at = ?");
      params.push(input.expiresAt?.toISOString() ?? null);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = datetime('now')");
    params.push(id);

    db.prepare(`UPDATE memories SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    // Recalculate confidence after update
    confidenceEngine.updateConfidence(id, "edit");

    return this.getById(id);
  }

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM memories WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getDashboardStats(userId: string = "default_user"): DashboardStats {
    const db = getDb();

    const totalRow = db.prepare(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ?"
    ).get(userId) as { count: number };

    const trustedRow = db.prepare(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'verified' AND confidence >= 0.7"
    ).get(userId) as { count: number };

    const unverifiedRow = db.prepare(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'unverified'"
    ).get(userId) as { count: number };

    const expiredRow = db.prepare(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'expired'"
    ).get(userId) as { count: number };

    const conflictingRow = db.prepare(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'conflicting'"
    ).get(userId) as { count: number };

    const avgRow = db.prepare(
      "SELECT AVG(confidence) as avg FROM memories WHERE user_id = ?"
    ).get(userId) as { avg: number | null };

    const recentRows = db.prepare(`
      ${this.baseQuery} WHERE m.user_id = ? ORDER BY m.created_at DESC LIMIT 5
    `).all(userId) as MemoryRow[];

    const expiringRows = db.prepare(`
      ${this.baseQuery} WHERE m.user_id = ? AND m.expires_at IS NOT NULL 
      AND m.expires_at > datetime('now') 
      AND m.expires_at < datetime('now', '+30 days')
      ORDER BY m.expires_at ASC LIMIT 5
    `).all(userId) as MemoryRow[];

    return {
      totalMemories: totalRow.count,
      trustedMemories: trustedRow.count,
      unverifiedMemories: unverifiedRow.count,
      expiredMemories: expiredRow.count,
      conflictingMemories: conflictingRow.count,
      averageConfidence: avgRow.avg ?? 0,
      recentMemories: recentRows.map(rowToMemory),
      upcomingExpirations: expiringRows.map(rowToMemory),
    };
  }
}

export const memoryService = new MemoryService();
