import { getDb } from "@/lib/db/connection";
import type { TimelineEvent } from "@/lib/types";

interface MemoryRow {
  id: string;
  user_id: string;
  value: string;
  category: string;
  confidence: number;
  source_id: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
  last_verified_at: string | null;
  expires_at: string | null;
}

interface VerificationRow {
  id: string;
  memory_id: string;
  action: string;
  created_at: string;
}

interface ConflictRow {
  id: string;
  memory_id_a: string;
  memory_id_b: string;
  detected_at: string;
}

export class TimelineService {
  /**
   * Get all timeline events for a user
   */
  getTimeline(userId: string = "default_user", limit: number = 50): TimelineEvent[] {
    const db = getDb();
    const events: TimelineEvent[] = [];

    // Creation events
    const creations = db.prepare(`
      SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(userId, limit) as MemoryRow[];

    for (const mem of creations) {
      events.push({
        id: `create_${mem.id}`,
        memoryId: mem.id,
        memoryValue: mem.value,
        type: "created",
        confidence: mem.confidence,
        timestamp: new Date(mem.created_at),
        detail: `Memory created: "${mem.value}"`,
      });
    }

    // Update events (from verification_events)
    const verificationEvents = db.prepare(`
      SELECT ve.*, m.value 
      FROM verification_events ve 
      JOIN memories m ON ve.memory_id = m.id 
      WHERE m.user_id = ?
      ORDER BY ve.created_at DESC LIMIT ?
    `).all(userId, limit) as (VerificationRow & { value: string })[];

    for (const ve of verificationEvents) {
      const eventType = this.mapActionToEventType(ve.action);
      events.push({
        id: `ver_${ve.id}`,
        memoryId: ve.memory_id,
        memoryValue: ve.value,
        type: eventType,
        confidence: 0, // Will be looked up
        timestamp: new Date(ve.created_at),
        detail: this.getVerificationDetail(ve.action, ve.value),
      });
    }

    // Conflict events
    const conflicts = db.prepare(`
      SELECT mc.*, m1.value as value_a, m2.value as value_b
      FROM memory_conflicts mc
      JOIN memories m1 ON mc.memory_id_a = m1.id
      JOIN memories m2 ON mc.memory_id_b = m2.id
      WHERE m1.user_id = ? OR m2.user_id = ?
      ORDER BY mc.detected_at DESC LIMIT ?
    `).all(userId, userId, limit) as (ConflictRow & { value_a: string; value_b: string })[];

    for (const conf of conflicts) {
      events.push({
        id: `conflict_${conf.id}`,
        memoryId: conf.memory_id_a,
        memoryValue: conf.value_a,
        type: "conflicted",
        confidence: 0,
        timestamp: new Date(conf.detected_at),
        detail: `Conflict detected: "${conf.value_a}" vs "${conf.value_b}"`,
      });
    }

    // Expiration events (from memories that have expired)
    const expiredMemories = db.prepare(`
      SELECT * FROM memories 
      WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at <= datetime('now')
      ORDER BY expires_at DESC LIMIT ?
    `).all(userId, limit) as MemoryRow[];

    for (const mem of expiredMemories) {
      events.push({
        id: `expire_${mem.id}`,
        memoryId: mem.id,
        memoryValue: mem.value,
        type: "expired",
        confidence: mem.confidence,
        timestamp: new Date(mem.expires_at!),
        detail: `Memory expired: "${mem.value}"`,
      });
    }

    // Sort by timestamp descending and remove duplicates
    const uniqueEvents = this.removeDuplicates(
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );

    return uniqueEvents.slice(0, limit);
  }

  /**
   * Get timeline grouped by date
   */
  getTimelineByDate(userId: string = "default_user"): Map<string, TimelineEvent[]> {
    const timeline = this.getTimeline(userId, 100);
    const grouped = new Map<string, TimelineEvent[]>();

    for (const event of timeline) {
      const dateKey = event.timestamp.toISOString().split("T")[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    }

    return grouped;
  }

  private mapActionToEventType(action: string): TimelineEvent["type"] {
    switch (action) {
      case "confirm": return "confirmed";
      case "reject": return "rejected";
      case "edit": return "updated";
      case "increase_confidence": return "verified";
      case "decrease_confidence": return "conflicted";
      default: return "updated";
    }
  }

  private getVerificationDetail(action: string, value: string): string {
    switch (action) {
      case "confirm": return `Confirmed: "${value}"`;
      case "reject": return `Rejected: "${value}"`;
      case "edit": return `Edited: "${value}"`;
      case "increase_confidence": return `Confidence increased for: "${value}"`;
      case "decrease_confidence": return `Confidence decreased for: "${value}"`;
      default: return `Updated: "${value}"`;
    }
  }

  private removeDuplicates(events: TimelineEvent[]): TimelineEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.memoryId}_${event.type}_${event.timestamp.getTime()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const timelineService = new TimelineService();
