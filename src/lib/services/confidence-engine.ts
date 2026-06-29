import { getDb } from "@/lib/db/connection";
import { getConfidenceLevel } from "@/lib/types";

interface ConfidenceFactors {
  baseScore: number;
  confirmationBonus: number;
  contradictionPenalty: number;
  sourceReliabilityMultiplier: number;
  ageDecay: number;
  finalScore: number;
}

export class ConfidenceEngine {
  /**
   * Calculate confidence score for a memory based on multiple factors:
   * - Number of confirmations
   * - Source reliability
   * - Contradictions (penalty)
   * - Memory age (decay over time)
   */
  calculate(memoryId: string): ConfidenceFactors {
    const db = getDb();

    const memory = db.prepare(
      "SELECT * FROM memories WHERE id = ?"
    ).get(memoryId) as {
      id: string;
      user_id: string;
      value: string;
      category: string;
      confidence: number;
      source_id: string;
      verification_status: string;
      confirmation_count: number;
      contradiction_count: number;
      created_at: string;
      updated_at: string;
      last_verified_at: string | null;
      expires_at: string | null;
    } | undefined;

    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    const source = db.prepare("SELECT * FROM sources WHERE id = ?").get(memory.source_id) as {
      id: string;
      name: string;
      reliability: string;
      type: string;
    };

    // Base score starts at 0.3 and goes up to 0.5 based on source reliability
    const sourceReliabilityMap: Record<string, number> = {
      high: 1.0,
      medium: 0.7,
      low: 0.4,
      unknown: 0.3,
    };
    const sourceMultiplier = sourceReliabilityMap[source.reliability] ?? 0.3;
    const baseScore = 0.3 * sourceMultiplier;

    // Confirmation bonus: each confirmation adds 0.15, up to a max of 0.6 bonus
    const confirmationBonus = Math.min(memory.confirmation_count * 0.15, 0.6);

    // Contradiction penalty: each contradiction reduces by 0.2
    const contradictionPenalty = memory.contradiction_count * 0.2;

    // Age decay: memories older than 90 days lose confidence
    const createdAt = new Date(memory.created_at);
    const daysSinceCreation = Math.floor(
      (Date.now() - createdAt.getTime()) / 86400000
    );
    const ageDecay = Math.max(0, daysSinceCreation - 90) * 0.002;

    // Calculate final score
    let finalScore = baseScore + confirmationBonus - contradictionPenalty - ageDecay;
    finalScore = Math.max(0, Math.min(1, finalScore));

    return {
      baseScore,
      confirmationBonus,
      contradictionPenalty,
      sourceReliabilityMultiplier: sourceMultiplier,
      ageDecay,
      finalScore: Math.round(finalScore * 100) / 100,
    };
  }

  /**
   * Update the confidence score for a memory and create a verification event
   */
  updateConfidence(
    memoryId: string,
    action: "confirm" | "reject" | "edit" | "increase_confidence" | "decrease_confidence",
    userId: string = "default_user",
    note: string = ""
  ): number {
    const db = getDb();
    const oldMemory = db.prepare("SELECT confidence FROM memories WHERE id = ?").get(memoryId) as {
      confidence: number;
    } | undefined;

    if (!oldMemory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    const oldConfidence = oldMemory.confidence;
    const factors = this.calculate(memoryId);
    const newConfidence = factors.finalScore;

    // Update the memory
    db.prepare(`
      UPDATE memories 
      SET confidence = ?, 
          verification_status = CASE 
            WHEN ? = 'reject' THEN 'rejected' 
            WHEN ? = 'confirm' AND verification_status = 'unverified' THEN 'verified'
            ELSE verification_status 
          END,
          confirmation_count = CASE WHEN ? = 'confirm' THEN confirmation_count + 1 ELSE confirmation_count END,
          contradiction_count = CASE WHEN ? = 'reject' THEN contradiction_count + 1 ELSE contradiction_count END,
          last_verified_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(newConfidence, action, action, action, action, memoryId);

    // Record verification event
    db.prepare(`
      INSERT INTO verification_events (id, memory_id, action, user_id, previous_confidence, new_confidence, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `ver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      memoryId,
      action,
      userId,
      oldConfidence,
      newConfidence,
      note
    );

    return newConfidence;
  }

  /**
   * Batch update confidence for all memories (e.g., for age decay on a schedule)
   */
  batchUpdateAll(): { updated: number; details: ConfidenceFactors[] } {
    const db = getDb();
    const memories = db.prepare("SELECT id FROM memories").all() as { id: string }[];

    let updated = 0;
    const details: ConfidenceFactors[] = [];

    db.transaction(() => {
      for (const memory of memories) {
        const factors = this.calculate(memory.id);

        db.prepare("UPDATE memories SET confidence = ?, updated_at = datetime('now') WHERE id = ?")
          .run(factors.finalScore, memory.id);

        details.push(factors);
        updated++;
      }
    });

    return { updated, details };
  }

  /**
   * Get a detailed explanation of how confidence was calculated
   */
  getExplanation(memoryId: string): string {
    const factors = this.calculate(memoryId);
    const level = getConfidenceLevel(factors.finalScore);

    const parts: string[] = [];
    parts.push(`Confidence: ${Math.round(factors.finalScore * 100)}% (${level})`);

    if (factors.baseScore > 0) {
      parts.push(`Base score from source reliability: ${Math.round(factors.baseScore * 100)}%`);
    }
    if (factors.confirmationBonus > 0) {
      parts.push(`Confirmation bonus: +${Math.round(factors.confirmationBonus * 100)}%`);
    }
    if (factors.contradictionPenalty > 0) {
      parts.push(`Contradiction penalty: -${Math.round(factors.contradictionPenalty * 100)}%`);
    }
    if (factors.ageDecay > 0) {
      parts.push(`Age decay: -${Math.round(factors.ageDecay * 100)}%`);
    }

    return parts.join(". ");
  }
}

export const confidenceEngine = new ConfidenceEngine();
