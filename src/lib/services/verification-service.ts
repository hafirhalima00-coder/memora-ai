import { getDb } from "@/lib/db/connection";
import { confidenceEngine } from "@/lib/services/confidence-engine";
import type { VerificationEvent, Memory } from "@/lib/types";

interface VerificationRow {
  id: string;
  memory_id: string;
  action: string;
  user_id: string;
  previous_confidence: number;
  new_confidence: number;
  note: string;
  created_at: string;
}

export class VerificationService {
  /**
   * Confirm a memory - increases confidence
   */
  confirmMemory(memoryId: string, userId: string = "default_user", note: string = ""): { memory: Memory; event: VerificationEvent } {
    const db = getDb();
    const memory = db.prepare("SELECT * FROM memories WHERE id = ?").get(memoryId) as {
      id: string; confidence: number; verification_status: string; confirmation_count: number;
    } | undefined;

    if (!memory) throw new Error(`Memory ${memoryId} not found`);

    const newConfidence = confidenceEngine.updateConfidence(memoryId, "confirm", userId, note);

    // Update verification status and increment confirmation count
    const newStatus = memory.verification_status === "unverified" || memory.verification_status === "conflicting"
      ? "verified" : memory.verification_status;
    
    db.prepare(`
      UPDATE memories 
      SET verification_status = ?, 
          confirmation_count = confirmation_count + 1,
          last_verified_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, memoryId);

    // Get the created event
    const eventRow = db.prepare(`
      SELECT * FROM verification_events 
      WHERE memory_id = ? AND action = 'confirm' 
      ORDER BY created_at DESC LIMIT 1
    `).get(memoryId) as VerificationRow | undefined;

    const event: VerificationEvent = eventRow ? this.rowToEvent(eventRow) : this.createEvent(memoryId, "confirm", userId, memory.confidence, newConfidence, note);

    return {
      memory: this.getMemoryWithDetails(memoryId),
      event,
    };
  }

  /**
   * Reject a memory - decreases confidence
   */
  rejectMemory(memoryId: string, userId: string = "default_user", note: string = ""): { memory: Memory; event: VerificationEvent } {
    const db = getDb();
    const memory = db.prepare("SELECT * FROM memories WHERE id = ?").get(memoryId) as {
      id: string; confidence: number;
    } | undefined;

    if (!memory) throw new Error(`Memory ${memoryId} not found`);

    const newConfidence = confidenceEngine.updateConfidence(memoryId, "reject", userId, note);

    db.prepare(`
      UPDATE memories 
      SET verification_status = 'rejected',
          contradiction_count = contradiction_count + 1,
          last_verified_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(memoryId);

    const event: VerificationEvent = this.createEvent(memoryId, "reject", userId, memory.confidence, newConfidence, note);

    return {
      memory: this.getMemoryWithDetails(memoryId),
      event,
    };
  }

  /**
   * Edit a memory - triggers confidence recalculation
   */
  editMemory(memoryId: string, newValue: string, userId: string = "default_user", note: string = ""): { memory: Memory; event: VerificationEvent } {
    const db = getDb();
    const memory = db.prepare("SELECT * FROM memories WHERE id = ?").get(memoryId) as {
      id: string; value: string; confidence: number;
    } | undefined;

    if (!memory) throw new Error(`Memory ${memoryId} not found`);

    db.prepare(`
      UPDATE memories 
      SET value = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newValue, memoryId);

    const newConfidence = confidenceEngine.updateConfidence(memoryId, "edit", userId, note);

    const event: VerificationEvent = this.createEvent(memoryId, "edit", userId, memory.confidence, newConfidence, note);

    return {
      memory: this.getMemoryWithDetails(memoryId),
      event,
    };
  }

  /**
   * Increase confidence manually
   */
  increaseConfidence(memoryId: string, userId: string = "default_user", note: string = ""): { memory: Memory; event: VerificationEvent } {
    const db = getDb();
    const memory = db.prepare("SELECT * FROM memories WHERE id = ?").get(memoryId) as {
      id: string; confidence: number; confirmation_count: number;
    } | undefined;

    if (!memory) throw new Error(`Memory ${memoryId} not found`);

    // Simulate an additional confirmation
    db.prepare("UPDATE memories SET confirmation_count = confirmation_count + 1 WHERE id = ?").run(memoryId);
    const newConfidence = confidenceEngine.updateConfidence(memoryId, "increase_confidence", userId, note);

    const event: VerificationEvent = this.createEvent(memoryId, "increase_confidence", userId, memory.confidence, newConfidence, note);

    return {
      memory: this.getMemoryWithDetails(memoryId),
      event,
    };
  }

  /**
   * Get verification history for a memory
   */
  getVerificationHistory(memoryId: string): VerificationEvent[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM verification_events 
      WHERE memory_id = ? 
      ORDER BY created_at DESC
    `).all(memoryId) as VerificationRow[];

    return rows.map(this.rowToEvent);
  }

  /**
   * Get all pending verifications (unverified memories)
   */
  getPendingVerifications(userId: string = "default_user"): Memory[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT m.*, s.name as source_name, s.reliability as source_reliability, s.type as source_type
      FROM memories m
      JOIN sources s ON m.source_id = s.id
      WHERE m.user_id = ? AND m.verification_status IN ('unverified', 'conflicting')
      ORDER BY m.created_at DESC
    `).all(userId) as Array<{
      id: string; user_id: string; value: string; category: string;
      confidence: number; source_id: string; verification_status: string;
      confirmation_count: number; contradiction_count: number;
      tags: string; explanation: string; metadata: string;
      created_at: string; updated_at: string; last_verified_at: string | null;
      expires_at: string | null;
      source_name: string; source_reliability: string; source_type: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      value: row.value,
      category: row.category as Memory["category"],
      confidence: row.confidence,
      confidenceLevel: row.confidence >= 0.9 ? "very_high" as const : row.confidence >= 0.7 ? "high" as const : row.confidence >= 0.5 ? "medium" as const : row.confidence >= 0.3 ? "low" as const : "very_low" as const,
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
    }));
  }

  private getMemoryWithDetails(memoryId: string): Memory {
    const db = getDb();
    const row = db.prepare(`
      SELECT m.*, s.name as source_name, s.reliability as source_reliability, s.type as source_type
      FROM memories m
      JOIN sources s ON m.source_id = s.id
      WHERE m.id = ?
    `).get(memoryId) as {
      id: string; user_id: string; value: string; category: string;
      confidence: number; source_id: string; verification_status: string;
      confirmation_count: number; contradiction_count: number;
      tags: string; explanation: string; metadata: string;
      created_at: string; updated_at: string; last_verified_at: string | null;
      expires_at: string | null;
      source_name: string; source_reliability: string; source_type: string;
    };

    return {
      id: row.id,
      userId: row.user_id,
      value: row.value,
      category: row.category as Memory["category"],
      confidence: row.confidence,
      confidenceLevel: (row.confidence >= 0.9 ? "very_high" : row.confidence >= 0.7 ? "high" : row.confidence >= 0.5 ? "medium" : row.confidence >= 0.3 ? "low" : "very_low") as Memory["confidenceLevel"],
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

  private rowToEvent(row: VerificationRow): VerificationEvent {
    return {
      id: row.id,
      memoryId: row.memory_id,
      action: row.action as VerificationEvent["action"],
      userId: row.user_id,
      previousConfidence: row.previous_confidence,
      newConfidence: row.new_confidence,
      note: row.note,
      createdAt: new Date(row.created_at),
    };
  }

  private createEvent(
    memoryId: string,
    action: VerificationEvent["action"],
    userId: string,
    previousConfidence: number,
    newConfidence: number,
    note: string
  ): VerificationEvent {
    return {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      memoryId,
      action,
      userId,
      previousConfidence,
      newConfidence,
      note,
      createdAt: new Date(),
    };
  }
}

export const verificationService = new VerificationService();
