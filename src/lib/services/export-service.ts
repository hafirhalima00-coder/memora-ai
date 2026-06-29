import { getDb } from "@/lib/db/connection";
import { confidenceEngine } from "@/lib/services/confidence-engine";
import { conflictDetector } from "@/lib/services/conflict-detector";
import { generateId } from "@/lib/utils";
import type { Memory, CreateMemoryInput } from "@/lib/types";

interface ExportData {
  version: string;
  exportedAt: string;
  userCount: number;
  memories: Array<{
    value: string;
    category: string;
    source: string;
    tags: string[];
    confidence: number;
    verificationStatus: string;
    confirmationCount: number;
    contradictionCount: number;
    explanation: string;
    createdAt: string;
    expiresAt: string | null;
  }>;
  conflicts: Array<{
    valueA: string;
    valueB: string;
    category: string;
    resolution: string | null;
    explanation: string;
  }>;
  verificationEvents: number;
}

export class ExportService {
  exportAll(userId: string = "default_user"): ExportData {
    const db = getDb();

    const memories = db.prepare(`
      SELECT m.*, s.name as source_name
      FROM memories m
      JOIN sources s ON m.source_id = s.id
      WHERE m.user_id = ?
    `).all(userId) as Array<{
      value: string; category: string; source_name: string;
      tags: string; confidence: number; verification_status: string;
      confirmation_count: number; contradiction_count: number;
      explanation: string; created_at: string; expires_at: string | null;
    }>;

    const conflicts = db.prepare(`
      SELECT mc.*, m1.value as v_a, m2.value as v_b
      FROM memory_conflicts mc
      JOIN memories m1 ON mc.memory_id_a = m1.id
      JOIN memories m2 ON mc.memory_id_b = m2.id
      WHERE m1.user_id = ? OR m2.user_id = ?
    `).all(userId, userId) as Array<{
      value_a: string; value_b: string; category: string;
      resolution: string | null; explanation: string;
    }>;

    const verifCount = (db.prepare(`
      SELECT COUNT(*) as count FROM verification_events ve
      JOIN memories m ON ve.memory_id = m.id WHERE m.user_id = ?
    `).get(userId) as { count: number }).count;

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      userCount: 1,
      memories: memories.map(m => ({
        value: m.value,
        category: m.category,
        source: m.source_name,
        tags: JSON.parse(m.tags),
        confidence: m.confidence,
        verificationStatus: m.verification_status,
        confirmationCount: m.confirmation_count,
        contradictionCount: m.contradiction_count,
        explanation: m.explanation,
        createdAt: m.created_at,
        expiresAt: m.expires_at,
      })),
      conflicts: conflicts.map(c => ({
        valueA: c.value_a,
        valueB: c.value_b,
        category: c.category,
        resolution: c.resolution,
        explanation: c.explanation,
      })),
      verificationEvents: verifCount,
    };
  }

  importData(data: ExportData, userId: string = "default_user"): { imported: number; skipped: number; errors: string[] } {
    const db = getDb();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    db.transaction(() => {
      for (const mem of data.memories) {
        try {
          const existing = db.prepare(
            "SELECT id FROM memories WHERE user_id = ? AND value = ? AND category = ?"
          ).get(userId, mem.value, mem.category);

          if (existing) {
            skipped++;
            continue;
          }

          const id = generateId();
          const source = (db.prepare("SELECT id FROM sources WHERE name = 'Data Import' LIMIT 1").get() ||
            db.prepare("SELECT id FROM sources LIMIT 1").get()) as { id: string };

          db.prepare(`
            INSERT INTO memories (id, user_id, value, category, confidence, source_id,
              verification_status, confirmation_count, contradiction_count,
              tags, explanation, created_at, updated_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
          `).run(
            id, userId, mem.value, mem.category, mem.confidence, source.id,
            mem.verificationStatus, mem.confirmationCount, mem.contradictionCount,
            JSON.stringify(mem.tags), mem.explanation, mem.createdAt, mem.expiresAt
          );

          imported++;
        } catch (err: any) {
          errors.push(`Failed to import "${mem.value}": ${err.message}`);
        }
      }
    });

    return { imported, skipped, errors };
  }

  exportAsJson(userId: string = "default_user"): string {
    return JSON.stringify(this.exportAll(userId), null, 2);
  }

  getExportStats(userId: string = "default_user"): {
    totalMemories: number;
    totalConflicts: number;
    totalVerifications: number;
    categories: string[];
    dateRange: { earliest: string; latest: string };
  } {
    const db = getDb();
    const totalMemories = (db.prepare("SELECT COUNT(*) as c FROM memories WHERE user_id = ?").get(userId) as { c: number }).c;
    const totalConflicts = (db.prepare("SELECT COUNT(*) as c FROM memory_conflicts").get() as { c: number }).c;
    const totalVerifications = (db.prepare("SELECT COUNT(*) as c FROM verification_events ve JOIN memories m ON ve.memory_id = m.id WHERE m.user_id = ?").get(userId) as { c: number }).c;
    const categories = (db.prepare("SELECT DISTINCT category FROM memories WHERE user_id = ?").all(userId) as { category: string }[]).map(r => r.category);
    const earliest = (db.prepare("SELECT MIN(created_at) as d FROM memories WHERE user_id = ?").get(userId) as { d: string | null }).d || "";
    const latest = (db.prepare("SELECT MAX(created_at) as d FROM memories WHERE user_id = ?").get(userId) as { d: string | null }).d || "";

    return { totalMemories, totalConflicts, totalVerifications, categories, dateRange: { earliest, latest } };
  }
}

export const exportService = new ExportService();
