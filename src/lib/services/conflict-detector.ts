import { getDb } from "@/lib/db/connection";
import { confidenceEngine } from "@/lib/services/confidence-engine";
import { type MemoryConflict, type Memory } from "@/lib/types";

interface ConflictRow {
  id: string;
  memory_id_a: string;
  memory_id_b: string;
  value_a: string;
  value_b: string;
  category: string;
  detected_at: string;
  resolved_at: string | null;
  resolution: string | null;
  resolved_by: string | null;
  explanation: string;
}

export class ConflictDetector {
  /**
   * Check if a newly created or updated memory conflicts with existing memories
   */
  checkForConflicts(memoryId: string): MemoryConflict[] {
    const db = getDb();
    const memory = db.prepare(`
      SELECT m.*, s.name as source_name 
      FROM memories m 
      JOIN sources s ON m.source_id = s.id 
      WHERE m.id = ?
    `).get(memoryId) as {
      id: string;
      user_id: string;
      value: string;
      category: string;
      confidence: number;
      source_name: string;
    } | undefined;

    if (!memory) return [];

    // Look for potential conflicts in the same category
    const existingMemories = db.prepare(`
      SELECT id, value, category, user_id 
      FROM memories 
      WHERE user_id = ? AND category = ? AND id != ? AND verification_status != 'expired'
    `).all(memory.user_id, memory.category, memory.id) as {
      id: string;
      value: string;
      category: string;
      user_id: string;
    }[];

    const newConflicts: MemoryConflict[] = [];

    for (const existing of existingMemories) {
      if (this.areConflicting(memory.value, existing.value, memory.category)) {
        const conflictId = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Check if conflict already exists
        const existingConflict = db.prepare(`
          SELECT id FROM memory_conflicts 
          WHERE (memory_id_a = ? AND memory_id_b = ?) 
             OR (memory_id_a = ? AND memory_id_b = ?)
        `).get(memory.id, existing.id, existing.id, memory.id);

        if (existingConflict) continue;

        const explanation = `"${memory.value}" contradicts "${existing.value}" in category "${memory.category}". Source: ${memory.source_name}`;

        db.prepare(`
          INSERT INTO memory_conflicts (id, memory_id_a, memory_id_b, value_a, value_b, category, explanation)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(conflictId, memory.id, existing.id, memory.value, existing.value, memory.category, explanation);

        // Mark both memories as conflicting
        db.prepare("UPDATE memories SET verification_status = 'conflicting' WHERE id = ? OR id = ?")
          .run(memory.id, existing.id);

        // Recalculate confidence for both memories (they now have contradictions)
        confidenceEngine.updateConfidence(memory.id, "decrease_confidence", "system", "Conflict detected");
        db.prepare("UPDATE memories SET contradiction_count = contradiction_count + 1 WHERE id = ?")
          .run(existing.id);
        confidenceEngine.updateConfidence(existing.id, "decrease_confidence", "system", "Conflict detected");

        newConflicts.push(this.getConflictById(conflictId)!);
      }
    }

    return newConflicts;
  }

  /**
   * Determine if two memory values are in conflict within the same category
   */
  private areConflicting(valueA: string, valueB: string, category: string): boolean {
    const normA = valueA.toLowerCase().trim();
    const normB = valueB.toLowerCase().trim();

    // If they're the same, they're not conflicting
    if (normA === normB) return false;

    // Category-specific conflict detection
    switch (category) {
      case "location": {
        // Check for different city/country locations
        const locationKeywords = ["lives in", "located in", "based in", "from"];
        const isLocationA = locationKeywords.some(k => normA.includes(k));
        const isLocationB = locationKeywords.some(k => normB.includes(k));

        if (isLocationA && isLocationB) {
          // Extract location entities
          const cities = [
            "paris", "london", "new york", "tokyo", "berlin", "madrid",
            "rome", "sydney", "toronto", "dubai", "mumbai", "beijing",
            "san francisco", "los angeles", "chicago", "seattle", "boston"
          ];

          const locationA = cities.find(c => normA.includes(c));
          const locationB = cities.find(c => normB.includes(c));

          return locationA !== null && locationB !== null && locationA !== locationB;
        }
        return false;
      }

      case "identity": {
        // Check for contradictory identity claims
        const identityPairs = [
          ["software engineer", "designer"],
          ["student", "teacher"],
          ["employed", "unemployed"],
          ["single", "married"],
          ["vegetarian", "vegan"],
          ["male", "female"],
        ];

        for (const [a, b] of identityPairs) {
          const hasA = normA.includes(a);
          const hasB = normB.includes(b);
          const hasReverse = normA.includes(b) || normB.includes(a);
          if ((hasA && hasB) || hasReverse) {
            // Only conflict if they're mutually exclusive
            if (a === "male" || a === "female") return true;
            if (a === "single" || a === "married") return true;
            if (a === "employed" || a === "unemployed") return true;
            if (a === "student" || a === "teacher") return false; // Can be both
            if (a === "vegetarian" || a === "vegan") return true;
          }
        }
        return false;
      }

      case "fact":
      case "knowledge": {
        // Direct factual contradictions
        // Check for negation patterns
        const negationPatterns = [/doesn't/, /does not/, /isn't/, /is not/, /is\s+not\s+/];
        const negatedA = negationPatterns.some(p => p.test(normA));
        const negatedB = negationPatterns.some(p => p.test(normB));

        if (negatedA !== negatedB) {
          // One is negation of the other - extract the core statement
          const coreA = normA.replace(/^.*?(is|has|does)\s*(not|n't)?\s*/i, "").trim();
          const coreB = normB.replace(/^.*?(is|has|does)\s*(not|n't)?\s*/i, "").trim();
          if (coreA === coreB) return true;
        }
        return false;
      }

      case "habit":
      case "preference":
      case "opinion": {
        // These can coexist (someone can have multiple preferences)
        return false;
      }

      default:
        return false;
    }
  }

  /**
   * Get all unresolved conflicts
   */
  getAllUnresolved(): (MemoryConflict & { memoryA?: Memory; memoryB?: Memory })[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM memory_conflicts WHERE resolved_at IS NULL ORDER BY detected_at DESC
    `).all() as ConflictRow[];

    return rows.map(row => ({
      ...this.rowToConflict(row),
      memoryA: undefined,
      memoryB: undefined,
    }));
  }

  /**
   * Get a conflict by ID with memory details
   */
  getConflictById(id: string): MemoryConflict | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM memory_conflicts WHERE id = ?").get(id) as ConflictRow | undefined;
    return row ? this.rowToConflict(row) : null;
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(
    id: string,
    resolution: "keep_a" | "keep_b" | "merge" | "reject_both",
    resolvedBy: string = "default_user"
  ): MemoryConflict | null {
    const db = getDb();
    const conflict = this.getConflictById(id);
    if (!conflict) return null;

    db.prepare(`
      UPDATE memory_conflicts 
      SET resolved_at = datetime('now'), resolution = ?, resolved_by = ?
      WHERE id = ?
    `).run(resolution, resolvedBy, id);

    // Handle each resolution type
    switch (resolution) {
      case "keep_a": {
        // Keep memory A, reject memory B
        db.prepare("UPDATE memories SET verification_status = 'verified', contradiction_count = MAX(0, contradiction_count - 1) WHERE id = ?")
          .run(conflict.memoryIdA);
        db.prepare("UPDATE memories SET verification_status = 'rejected', contradiction_count = contradiction_count + 1 WHERE id = ?")
          .run(conflict.memoryIdB);
        break;
      }
      case "keep_b": {
        // Keep memory B, reject memory A
        db.prepare("UPDATE memories SET verification_status = 'rejected', contradiction_count = contradiction_count + 1 WHERE id = ?")
          .run(conflict.memoryIdA);
        db.prepare("UPDATE memories SET verification_status = 'verified', contradiction_count = MAX(0, contradiction_count - 1) WHERE id = ?")
          .run(conflict.memoryIdB);
        break;
      }
      case "merge": {
        // Mark both as verified (they can coexist)
        db.prepare("UPDATE memories SET verification_status = 'verified', contradiction_count = MAX(0, contradiction_count - 1) WHERE id = ? OR id = ?")
          .run(conflict.memoryIdA, conflict.memoryIdB);
        break;
      }
      case "reject_both": {
        // Reject both
        db.prepare("UPDATE memories SET verification_status = 'rejected' WHERE id = ? OR id = ?")
          .run(conflict.memoryIdA, conflict.memoryIdB);
        break;
      }
    }

    // Recalculate confidence for both memories
    confidenceEngine.updateConfidence(conflict.memoryIdA, "edit", resolvedBy, `Conflict resolved: ${resolution}`);
    confidenceEngine.updateConfidence(conflict.memoryIdB, "edit", resolvedBy, `Conflict resolved: ${resolution}`);

    return this.getConflictById(id);
  }

  /**
   * Get conflict statistics
   */
  getStats(): { total: number; unresolved: number; resolved: number } {
    const db = getDb();
    const total = (db.prepare("SELECT COUNT(*) as count FROM memory_conflicts").get() as { count: number }).count;
    const unresolved = (db.prepare("SELECT COUNT(*) as count FROM memory_conflicts WHERE resolved_at IS NULL").get() as { count: number }).count;
    return { total, unresolved, resolved: total - unresolved };
  }

  private rowToConflict(row: ConflictRow): MemoryConflict {
    return {
      id: row.id,
      memoryIdA: row.memory_id_a,
      memoryIdB: row.memory_id_b,
      valueA: row.value_a,
      valueB: row.value_b,
      category: row.category as MemoryConflict["category"],
      detectedAt: new Date(row.detected_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
      resolution: row.resolution as MemoryConflict["resolution"],
      resolvedBy: row.resolved_by,
      explanation: row.explanation,
    };
  }
}

export const conflictDetector = new ConflictDetector();
