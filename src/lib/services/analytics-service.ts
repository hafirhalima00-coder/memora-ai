import { getDb } from "@/lib/db/connection";
import type { AnalyticsData } from "@/lib/types";

interface CountRow {
  count: number;
  name?: string;
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics data
   */
  getAnalytics(userId: string = "default_user"): AnalyticsData {
    const db = getDb();

    const totalMemories = this.getCount("SELECT COUNT(*) as count FROM memories WHERE user_id = ?", [userId]);
    const trustedMemories = this.getCount(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'verified' AND confidence >= 0.7",
      [userId]
    );
    const unverifiedMemories = this.getCount(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'unverified'",
      [userId]
    );
    const expiredMemories = this.getCount(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'expired'",
      [userId]
    );
    const conflictingMemories = this.getCount(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND verification_status = 'conflicting'",
      [userId]
    );

    const avgRow = db.prepare(
      "SELECT AVG(confidence) as avg FROM memories WHERE user_id = ?"
    ).get(userId) as { avg: number | null };
    const averageConfidence = avgRow.avg ?? 0;

    // Confidence distribution
    const confidenceDistribution = this.getConfidenceDistribution(userId);

    // Verification trends (last 30 days)
    const verificationTrends = this.getVerificationTrends(userId);

    // Expiring memories (next 30 days)
    const expiringMemories = this.getExpiringMemories(userId);

    // Category distribution
    const categoryRows = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM memories WHERE user_id = ?
      GROUP BY category ORDER BY count DESC
    `).all(userId) as { category: string; count: number }[];
    const categoryDistribution = categoryRows.map(r => ({ category: r.category, count: r.count }));

    // Source distribution
    const sourceRows = db.prepare(`
      SELECT s.name, COUNT(*) as count 
      FROM memories m 
      JOIN sources s ON m.source_id = s.id 
      WHERE m.user_id = ?
      GROUP BY s.name ORDER BY count DESC
    `).all(userId) as { name: string; count: number }[];
    const sourceDistribution = sourceRows.map(r => ({ source: r.name, count: r.count }));

    return {
      totalMemories,
      trustedMemories,
      unverifiedMemories,
      expiredMemories,
      conflictingMemories,
      averageConfidence,
      confidenceDistribution,
      verificationTrends,
      expiringMemories,
      categoryDistribution,
      sourceDistribution,
    };
  }

  private getCount(query: string, params: unknown[]): number {
    const db = getDb();
    const row = db.prepare(query).get(...params) as { count: number };
    return row.count;
  }

  private getConfidenceDistribution(userId: string): { level: string; count: number }[] {
    const db = getDb();
    const levels = [
      { level: "Very High (90-100%)", min: 0.9, max: 1.01 },
      { level: "High (70-89%)", min: 0.7, max: 0.9 },
      { level: "Medium (50-69%)", min: 0.5, max: 0.7 },
      { level: "Low (30-49%)", min: 0.3, max: 0.5 },
      { level: "Very Low (0-29%)", min: 0, max: 0.3 },
    ];

    return levels.map(({ level, min, max }) => {
      const row = db.prepare(
        "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND confidence >= ? AND confidence < ?"
      ).get(userId, min, max) as { count: number };
      return { level, count: row.count };
    });
  }

  private getVerificationTrends(userId: string): { date: string; verified: number; rejected: number; total: number }[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT date(created_at) as date,
             SUM(CASE WHEN action = 'confirm' THEN 1 ELSE 0 END) as verified,
             SUM(CASE WHEN action = 'reject' THEN 1 ELSE 0 END) as rejected,
             COUNT(*) as total
      FROM verification_events ve
      JOIN memories m ON ve.memory_id = m.id
      WHERE m.user_id = ? AND ve.created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(userId) as { date: string; verified: number; rejected: number; total: number }[];

    return rows;
  }

  private getExpiringMemories(userId: string): { date: string; count: number }[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT date(expires_at) as date, COUNT(*) as count
      FROM memories
      WHERE user_id = ? AND expires_at IS NOT NULL 
        AND expires_at >= datetime('now')
        AND expires_at <= datetime('now', '+30 days')
      GROUP BY date(expires_at)
      ORDER BY date ASC
    `).all(userId) as { date: string; count: number }[];

    return rows;
  }
}

export const analyticsService = new AnalyticsService();
