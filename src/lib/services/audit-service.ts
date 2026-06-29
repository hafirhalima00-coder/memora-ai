import { getDb } from "@/lib/db/connection";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details: string;
  previousValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown>;
}

export class AuditService {
  /**
   * Log an audit event
   */
  log(params: {
    action: string;
    entityType: string;
    entityId: string;
    userId?: string;
    details?: string;
    previousValue?: string | null;
    newValue?: string | null;
    metadata?: Record<string, unknown>;
  }): void {
    const db = getDb();

    // Create audit_log table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'system',
        details TEXT DEFAULT '',
        previous_value TEXT,
        new_value TEXT,
        metadata TEXT DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    `);

    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, user_id, details, previous_value, new_value, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.action,
      params.entityType,
      params.entityId,
      params.userId || "system",
      params.details || "",
      params.previousValue ?? null,
      params.newValue ?? null,
      JSON.stringify(params.metadata || {})
    );
  }

  /**
   * Get audit log entries with pagination
   */
  getEntries(options?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): { entries: AuditEntry[]; total: number } {
    const db = getDb();

    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'system',
        details TEXT DEFAULT '',
        previous_value TEXT,
        new_value TEXT,
        metadata TEXT DEFAULT '{}'
      );
    `);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options?.entityType) {
      conditions.push("entity_type = ?");
      params.push(options.entityType);
    }
    if (options?.entityId) {
      conditions.push("entity_id = ?");
      params.push(options.entityId);
    }
    if (options?.action) {
      conditions.push("action = ?");
      params.push(options.action);
    }
    if (options?.userId) {
      conditions.push("user_id = ?");
      params.push(options.userId);
    }
    if (options?.startDate) {
      conditions.push("timestamp >= ?");
      params.push(options.startDate);
    }
    if (options?.endDate) {
      conditions.push("timestamp <= ?");
      params.push(options.endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM audit_log ${where}`).get(...params) as { count: number };
    const rows = db.prepare(
      `SELECT * FROM audit_log ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as Array<{
      id: string; timestamp: string; action: string;
      entity_type: string; entity_id: string; user_id: string;
      details: string; previous_value: string | null; new_value: string | null;
      metadata: string;
    }>;

    return {
      total: totalRow.count,
      entries: rows.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        userId: r.user_id,
        details: r.details,
        previousValue: r.previous_value,
        newValue: r.new_value,
        metadata: JSON.parse(r.metadata),
      })),
    };
  }

  /**
   * Get audit log summary stats
   */
  getStats(): {
    totalEntries: number;
    actionsByType: { action: string; count: number }[];
    recentActivity: { date: string; count: number }[];
  } {
    const db = getDb();
    db.exec(`CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, timestamp TEXT, action TEXT, entity_type TEXT, entity_id TEXT, user_id TEXT, details TEXT, previous_value TEXT, new_value TEXT, metadata TEXT)`);

    const total = (db.prepare("SELECT COUNT(*) as c FROM audit_log").get() as { c: number }).c;

    const actions = db.prepare(`
      SELECT action, COUNT(*) as count FROM audit_log 
      GROUP BY action ORDER BY count DESC LIMIT 20
    `).all() as { action: string; count: number }[];

    const recent = db.prepare(`
      SELECT date(timestamp) as date, COUNT(*) as count FROM audit_log
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY date(timestamp) ORDER BY date DESC
    `).all() as { date: string; count: number }[];

    return { totalEntries: total, actionsByType: actions, recentActivity: recent };
  }
}

export const auditService = new AuditService();
