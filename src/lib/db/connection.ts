/**
 * Memora AI - Database Connection
 * 
 * Synchronous adapter supporting two modes:
 * 1. Local: Uses better-sqlite3 (file-based SQLite) for development
 * 2. Serverless: Uses curl via execSync to Turso HTTP API for Vercel
 * 
 * Set TURSO_DB_URL env var to use Turso serverless mode.
 */

import path from "path";
import { execSync } from "child_process";

// ============================================
// Database Adapter Interface (synchronous)
// ============================================

export interface DbAdapter {
  prepare(sql: string): {
    get: (...params: unknown[]) => unknown;
    all: (...params: unknown[]) => unknown[];
    run: (...params: unknown[]) => { changes: number; lastInsertRowid?: number | bigint };
  };
  exec(sql: string): void;
  transaction<T>(fn: () => T): T;
  close(): void;
}

let db: DbAdapter | null = null;

// ============================================
// Local better-sqlite3 Adapter
// ============================================

function createLocalAdapter(): DbAdapter {
  let Database: any;
  try {
    Database = require("better-sqlite3");
  } catch {
    throw new Error(
      "better-sqlite3 not available. Set TURSO_DB_URL + TURSO_AUTH_TOKEN to use Turso."
    );
  }

  const dbPath = process.env.DATABASE_URL
    ? path.resolve(process.env.DATABASE_URL)
    : path.resolve(process.cwd(), "memora.db");

  const raw = new Database(dbPath);
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");

  return {
    prepare(sql: string) {
      const stmt = raw.prepare(sql);
      return {
        get: (...params: unknown[]) => stmt.get(...params) as unknown,
        all: (...params: unknown[]) => stmt.all(...params) as unknown[],
        run: (...params: unknown[]) => stmt.run(...params) as { changes: number; lastInsertRowid?: number | bigint },
      };
    },
    exec(sql: string) { raw.exec(sql); },
    transaction<T>(fn: () => T): T {
      const wrapped = raw.transaction(fn);
      return wrapped();
    },
    close() { raw.close(); },
  };
}

// ============================================
// Turso Serverless Adapter (sync via curl)
// ============================================

interface TursoResponse {
  rows?: Record<string, unknown>[];
  rowsAffected?: number;
  lastInsertRowid?: number | bigint | null;
}

function tursoRequest(sql: string, params: unknown[]): TursoResponse {
  const dbUrl = (process.env.TURSO_DB_URL || "").replace("libsql://", "https://");
  const authToken = process.env.TURSO_AUTH_TOKEN || "";

  // Build the Hrana-protocol request body
  const body = JSON.stringify({
    requests: [
      {
        type: "execute",
        stmt: {
          sql,
          args: params.map((p: unknown) => {
            if (p === null || p === undefined) return { type: "null" };
            if (typeof p === "number") {
              if (Number.isInteger(p)) return { type: "integer", value: String(p) };
              return { type: "float", value: String(p) };
            }
            return { type: "text", value: String(p) };
          }),
        },
      },
    ],
  });

  // Escape for shell single quotes
  const safeBody = body.replace(/'/g, "'\\''");

  try {
    const output = execSync(
      `curl -s -w "\\n%{http_code}" "${dbUrl}/v2/pipeline" \
        -H "Authorization: Bearer ${authToken}" \
        -H "Content-Type: application/json" \
        -d '${safeBody}'`,
      { timeout: 15000, encoding: "utf-8" }
    );

    // Extract HTTP status code (last line) and body (everything before it)
    const lines = output.trim().split("\n");
    const httpCode = parseInt(lines[lines.length - 1], 10);
    const responseBody = lines.slice(0, -1).join("\n");

    if (httpCode !== 200) {
      throw new Error(`Turso HTTP ${httpCode}: ${responseBody}`);
    }

    const parsed = JSON.parse(responseBody);
    const result = parsed.results?.[0]?.response?.result || parsed.results?.[0]?.result || {};

    const cols: { name: string }[] = result.cols || [];
    const rawRows: { type: string; value: string }[][] = result.rows || [];

    // Convert array-of-objects rows to object-based rows
    const objectRows = rawRows.map((row) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((col, i) => {
        const cell = row[i];
        // Cell has { type: "text"|"integer"|"null", value: "..." } or is null
        obj[col.name] = cell === null || cell?.type === "null" ? null : cell?.value ?? null;
      });
      return obj;
    });

    return {
      rows: objectRows,
      rowsAffected: result.affected_row_count ?? 0,
      lastInsertRowid: result.last_insert_rowid ?? null,
    };
  } catch (err: any) {
    throw new Error(`Turso query failed: ${err.message}`);
  }
}

function createTursoAdapter(): DbAdapter {
  // Verify connection
  try {
    tursoRequest("SELECT 1 AS test", []);
  } catch (err: any) {
    throw new Error(`Turso connection failed: ${err.message}`);
  }

  return {
    prepare(sql: string) {
      return {
        get: (...params: unknown[]) => {
          const result = tursoRequest(sql, params);
          return result.rows && result.rows.length > 0 ? result.rows[0] : undefined;
        },
        all: (...params: unknown[]) => {
          const result = tursoRequest(sql, params);
          return result.rows || [];
        },
        run: (...params: unknown[]) => {
          const result = tursoRequest(sql, params);
          return {
            changes: result.rowsAffected || 0,
            lastInsertRowid: result.lastInsertRowid ?? undefined,
          };
        },
      };
    },
    exec(sql: string) {
      const statements = sql.split(";").filter((s) => s.trim().length > 0);
      for (const stmt of statements) {
        tursoRequest(stmt, []);
      }
    },
    transaction<T>(fn: () => T): T {
      return fn();
    },
    close() {
      // Nothing to close for HTTP adapter
    },
  };
}

// ============================================
// Database Initialization
// ============================================

function getAdapter(): DbAdapter {
  if (process.env.TURSO_DB_URL) {
    return createTursoAdapter();
  }
  return createLocalAdapter();
}

export function getDb(): DbAdapter {
  if (!db) {
    db = getAdapter();
    initializeSchema();
    if (!process.env.TURSO_DB_URL) {
      seedData();
    }
  }
  return db;
}

function initializeSchema(): void {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      reliability TEXT NOT NULL DEFAULT 'unknown' CHECK(reliability IN ('high','medium','low','unknown')),
      type TEXT NOT NULL CHECK(type IN ('user_input','ai_inference','observation','import','api'))
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      value TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('preference','fact','habit','goal','opinion','relationship','location','event','identity','knowledge')),
      confidence REAL NOT NULL DEFAULT 0.5,
      source_id TEXT NOT NULL REFERENCES sources(id),
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('verified','unverified','conflicting','expired','rejected')),
      confirmation_count INTEGER NOT NULL DEFAULT 0,
      contradiction_count INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      explanation TEXT NOT NULL DEFAULT '',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_verified_at TEXT,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS memory_conflicts (
      id TEXT PRIMARY KEY,
      memory_id_a TEXT NOT NULL REFERENCES memories(id),
      memory_id_b TEXT NOT NULL REFERENCES memories(id),
      value_a TEXT NOT NULL,
      value_b TEXT NOT NULL,
      category TEXT NOT NULL,
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      resolution TEXT CHECK(resolution IN ('keep_a','keep_b','merge','reject_both')),
      resolved_by TEXT,
      explanation TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS verification_events (
      id TEXT PRIMARY KEY,
      memory_id TEXT NOT NULL REFERENCES memories(id),
      action TEXT NOT NULL CHECK(action IN ('confirm','reject','edit','increase_confidence','decrease_confidence')),
      user_id TEXT NOT NULL DEFAULT 'default_user',
      previous_confidence REAL NOT NULL DEFAULT 0,
      new_confidence REAL NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

  // Create indexes separately
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_memories_status ON memories(verification_status)",
    "CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category)",
    "CREATE INDEX IF NOT EXISTS idx_memories_expires ON memories(expires_at)",
    "CREATE INDEX IF NOT EXISTS idx_conflicts_memory_a ON memory_conflicts(memory_id_a)",
    "CREATE INDEX IF NOT EXISTS idx_conflicts_memory_b ON memory_conflicts(memory_id_b)",
    "CREATE INDEX IF NOT EXISTS idx_verifications_memory ON verification_events(memory_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC)",
    "CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)",
  ];

  for (const idx of indexes) {
    try { db.exec(idx); } catch { /* index may already exist, safe to ignore */ }
  }
}

function seedData(): void {
  if (!db) return;

  const sourceCount = db.prepare("SELECT COUNT(*) as count FROM sources").get() as { count: number } | undefined;
  if (sourceCount && (sourceCount as any).count > 0) return;

  const insertSource = db.prepare("INSERT INTO sources (id, name, reliability, type) VALUES (?, ?, ?, ?)");
  const insertMemory = db.prepare(
    `INSERT INTO memories (id, user_id, value, category, confidence, source_id, verification_status, 
     confirmation_count, contradiction_count, tags, explanation, created_at, updated_at, last_verified_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertConflict = db.prepare(
    `INSERT INTO memory_conflicts (id, memory_id_a, memory_id_b, value_a, value_b, category, detected_at, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertVerification = db.prepare(
    `INSERT INTO verification_events (id, memory_id, action, user_id, previous_confidence, new_confidence, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    insertSource.run("src_user", "User Input", "high", "user_input");
    insertSource.run("src_ai", "AI Inference", "medium", "ai_inference");
    insertSource.run("src_system", "System Observation", "high", "observation");
    insertSource.run("src_api", "External API", "medium", "api");
    insertSource.run("src_import", "Data Import", "low", "import");

    const memories = [
      { id: "mem_001", value: "User lives in Paris, France", category: "location", confidence: 0.85, source_id: "src_user", status: "verified", confirmations: 3, contradictions: 0, tags: '["location","home","paris"]', explanation: "Confirmed by user on multiple occasions.", created: "2025-01-15T10:00:00Z", updated: "2025-06-01T10:00:00Z", verified: "2025-06-01T10:00:00Z", expires: "2026-01-15T10:00:00Z" },
      { id: "mem_002", value: "User works as a software engineer", category: "identity", confidence: 0.9, source_id: "src_user", status: "verified", confirmations: 4, contradictions: 0, tags: '["work","profession","engineering"]', explanation: "Direct user input confirmed multiple times.", created: "2025-01-20T10:00:00Z", updated: "2025-05-15T10:00:00Z", verified: "2025-05-15T10:00:00Z", expires: null },
      { id: "mem_003", value: "User enjoys hiking on weekends", category: "preference", confidence: 0.6, source_id: "src_ai", status: "unverified", confirmations: 1, contradictions: 0, tags: '["hobby","outdoor","weekend"]', explanation: "Inferred from conversation.", created: "2025-02-10T10:00:00Z", updated: "2025-02-10T10:00:00Z", verified: null, expires: "2025-08-10T10:00:00Z" },
      { id: "mem_004", value: "User prefers dark mode interfaces", category: "preference", confidence: 0.75, source_id: "src_system", status: "verified", confirmations: 2, contradictions: 0, tags: '["preference","ui","dark-mode"]', explanation: "Observed from system settings.", created: "2025-02-20T10:00:00Z", updated: "2025-03-10T10:00:00Z", verified: "2025-03-10T10:00:00Z", expires: "2025-08-20T10:00:00Z" },
      { id: "mem_005", value: "User lives in London, UK", category: "location", confidence: 0.4, source_id: "src_api", status: "conflicting", confirmations: 1, contradictions: 1, tags: '["location","london","uk"]', explanation: "IP geolocation suggests London.", created: "2025-03-01T10:00:00Z", updated: "2025-03-01T10:00:00Z", verified: null, expires: "2025-09-01T10:00:00Z" },
      { id: "mem_006", value: "User has a cat named Luna", category: "fact", confidence: 0.8, source_id: "src_user", status: "verified", confirmations: 2, contradictions: 0, tags: '["pet","cat","luna"]', explanation: "User explicitly mentioned their cat.", created: "2025-03-15T10:00:00Z", updated: "2025-04-20T10:00:00Z", verified: "2025-04-20T10:00:00Z", expires: null },
      { id: "mem_007", value: "User is learning Spanish", category: "goal", confidence: 0.5, source_id: "src_ai", status: "unverified", confirmations: 0, contradictions: 0, tags: '["learning","language","spanish"]', explanation: "Inferred from conversation.", created: "2025-04-01T10:00:00Z", updated: "2025-04-01T10:00:00Z", verified: null, expires: "2025-10-01T10:00:00Z" },
      { id: "mem_008", value: "User avoids processed foods", category: "habit", confidence: 0.35, source_id: "src_ai", status: "unverified", confirmations: 0, contradictions: 1, tags: '["health","diet","food"]', explanation: "Inferred from 2 mentions.", created: "2025-04-10T10:00:00Z", updated: "2025-04-10T10:00:00Z", verified: null, expires: "2025-10-10T10:00:00Z" },
      { id: "mem_009", value: "User visited Japan in 2024", category: "event", confidence: 0.7, source_id: "src_user", status: "verified", confirmations: 1, contradictions: 0, tags: '["travel","japan","2024"]', explanation: "User mentioned their Japan trip.", created: "2025-04-15T10:00:00Z", updated: "2025-04-15T10:00:00Z", verified: "2025-04-15T10:00:00Z", expires: null },
      { id: "mem_010", value: "User is 28 years old", category: "fact", confidence: 0.45, source_id: "src_api", status: "conflicting", confirmations: 1, contradictions: 1, tags: '["age","demographics"]', explanation: "Estimated from profile data.", created: "2025-04-20T10:00:00Z", updated: "2025-04-20T10:00:00Z", verified: null, expires: "2025-10-20T10:00:00Z" },
      { id: "mem_011", value: "User reads science fiction novels", category: "preference", confidence: 0.65, source_id: "src_ai", status: "unverified", confirmations: 0, contradictions: 0, tags: '["reading","sci-fi","books"]', explanation: "Inferred from discussion of sci-fi.", created: "2025-05-01T10:00:00Z", updated: "2025-05-01T10:00:00Z", verified: null, expires: "2025-11-01T10:00:00Z" },
      { id: "mem_012", value: "User exercises 3 times per week", category: "habit", confidence: 0.3, source_id: "src_ai", status: "expired", confirmations: 0, contradictions: 0, tags: '["health","exercise","routine"]', explanation: "Old inference that expired.", created: "2024-06-01T10:00:00Z", updated: "2024-06-01T10:00:00Z", verified: null, expires: "2025-01-01T10:00:00Z" },
    ];

    for (const m of memories) {
      insertMemory.run(m.id, "default_user", m.value, m.category, m.confidence, m.source_id,
        m.status, m.confirmations, m.contradictions, m.tags, m.explanation,
        m.created, m.updated, m.verified, m.expires);
    }

    insertConflict.run("conf_001", "mem_001", "mem_005",
      "User lives in Paris, France", "User lives in London, UK",
      "location", "2025-03-01T10:00:00Z",
      "Location contradiction: Paris vs London.");

    const verifications = [
      { id: "ver_001", mem: "mem_001", action: "confirm", prev: 0.5, next: 0.75, note: "User confirmed location", created: "2025-02-01T10:00:00Z" },
      { id: "ver_002", mem: "mem_001", action: "confirm", prev: 0.75, next: 0.85, note: "User reconfirmed location", created: "2025-06-01T10:00:00Z" },
      { id: "ver_003", mem: "mem_002", action: "confirm", prev: 0.5, next: 0.7, note: "User confirmed profession", created: "2025-03-01T10:00:00Z" },
      { id: "ver_004", mem: "mem_002", action: "increase_confidence", prev: 0.7, next: 0.9, note: "Consistent with conversations", created: "2025-05-15T10:00:00Z" },
      { id: "ver_005", mem: "mem_006", action: "confirm", prev: 0.5, next: 0.8, note: "User confirmed pet ownership", created: "2025-04-20T10:00:00Z" },
    ];

    for (const v of verifications) {
      insertVerification.run(v.id, v.mem, v.action, "default_user", v.prev, v.next, v.note, v.created);
    }
  });
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
