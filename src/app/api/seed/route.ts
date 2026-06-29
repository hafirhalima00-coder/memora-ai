import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/connection";
import { generateId } from "@/lib/utils";
import fs from "fs";
import path from "path";

/**
 * POST /api/seed
 * Seeds the database with standard sources and sample data.
 * Works on both local (better-sqlite3) and Turso (serverless) deployments.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { importSampleData } = body as { importSampleData?: boolean };

    const db = getDb();

    const result = { sourceCount: 0, memoryCount: 0, conflictCount: 0, verifCount: 0 };

    db.transaction(() => {
      // Insert standard sources (idempotent)
      const sources = [
        { id: "src_user", name: "User Input", reliability: "high", type: "user_input" },
        { id: "src_ai", name: "AI Inference", reliability: "medium", type: "ai_inference" },
        { id: "src_system", name: "System Observation", reliability: "high", type: "observation" },
        { id: "src_api", name: "External API", reliability: "medium", type: "api" },
        { id: "src_import", name: "Data Import", reliability: "low", type: "import" },
      ];

      for (const s of sources) {
        const existing = db.prepare("SELECT id FROM sources WHERE id = ?").get(s.id);
        if (!existing) {
          db.prepare("INSERT INTO sources (id, name, reliability, type) VALUES (?, ?, ?, ?)").run(
            s.id, s.name, s.reliability, s.type
          );
          result.sourceCount++;
        }
      }

      if (!importSampleData) return;

      // Skip if already seeded
      const count = (db.prepare("SELECT COUNT(*) as c FROM memories WHERE user_id = 'default_user'").get() as { c: number }).c;
      if (count > 0) return;

      // Try sample-data.json, fall back to inline demo memories
      const samplePath = path.join(process.cwd(), "sample-data.json");
      const hasSampleFile = fs.existsSync(samplePath);

      let memories: any[];
      let conflicts: any[];
      let verifCount: number;

      if (hasSampleFile) {
        const raw = fs.readFileSync(samplePath, "utf-8");
        const data = JSON.parse(raw);
        memories = data.memories;
        conflicts = data.conflicts || [];
        verifCount = data.verificationEvents || 0;
      } else {
        memories = [
          { value: "User lives in Paris, France", category: "location", source: "User Input", tags: ["location", "home", "paris"], confidence: 0.85, verificationStatus: "verified", confirmationCount: 3, contradictionCount: 0, explanation: "Confirmed by user on multiple occasions. 3 confirmations.", createdAt: "2025-01-15T10:00:00Z", expiresAt: "2026-01-15T10:00:00Z" },
          { value: "User works as a software engineer", category: "identity", source: "User Input", tags: ["work", "profession", "engineering", "software"], confidence: 0.9, verificationStatus: "verified", confirmationCount: 4, contradictionCount: 0, explanation: "Very high confidence — user explicitly stated profession multiple times.", createdAt: "2025-01-20T10:00:00Z", expiresAt: null },
          { value: "User enjoys hiking on weekends", category: "preference", source: "AI Inference", tags: ["hobby", "outdoor", "weekend", "hiking"], confidence: 0.6, verificationStatus: "unverified", confirmationCount: 1, contradictionCount: 0, explanation: "Inferred from 3 separate mentions. Medium confidence — not yet user-confirmed.", createdAt: "2025-02-10T10:00:00Z", expiresAt: "2025-08-10T10:00:00Z" },
          { value: "User prefers dark mode interfaces", category: "preference", source: "System Observation", tags: ["preference", "ui", "dark-mode", "theme"], confidence: 0.75, verificationStatus: "verified", confirmationCount: 2, contradictionCount: 0, explanation: "Observed from system settings and confirmed by user.", createdAt: "2025-02-20T10:00:00Z", expiresAt: "2025-08-20T10:00:00Z" },
          { value: "User lives in London, UK", category: "location", source: "External API", tags: ["location", "london", "uk", "ip-geolocation"], confidence: 0.4, verificationStatus: "conflicting", confirmationCount: 1, contradictionCount: 1, explanation: "IP geolocation suggests London — conflicts with Paris memory.", createdAt: "2025-03-01T10:00:00Z", expiresAt: "2025-09-01T10:00:00Z" },
          { value: "User has a cat named Luna", category: "fact", source: "User Input", tags: ["pet", "cat", "luna", "animals"], confidence: 0.8, verificationStatus: "verified", confirmationCount: 2, contradictionCount: 0, explanation: "User explicitly mentioned their cat Luna twice.", createdAt: "2025-03-15T10:00:00Z", expiresAt: null },
          { value: "User is learning Spanish", category: "goal", source: "AI Inference", tags: ["learning", "language", "spanish", "education"], confidence: 0.5, verificationStatus: "unverified", confirmationCount: 0, contradictionCount: 0, explanation: "Inferred from conversation about Spanish lessons. Needs confirmation.", createdAt: "2025-04-01T10:00:00Z", expiresAt: "2025-10-01T10:00:00Z" },
          { value: "User avoids processed foods", category: "habit", source: "AI Inference", tags: ["health", "diet", "food", "nutrition"], confidence: 0.35, verificationStatus: "unverified", confirmationCount: 0, contradictionCount: 1, explanation: "Inferred from 2 mentions of healthy eating — low confidence.", createdAt: "2025-04-10T10:00:00Z", expiresAt: "2025-10-10T10:00:00Z" },
          { value: "User visited Japan in 2024", category: "event", source: "User Input", tags: ["travel", "japan", "2024", "vacation"], confidence: 0.7, verificationStatus: "verified", confirmationCount: 1, contradictionCount: 0, explanation: "User mentioned their Japan trip last year.", createdAt: "2025-04-15T10:00:00Z", expiresAt: null },
          { value: "User is 28 years old", category: "fact", source: "External API", tags: ["age", "demographics"], confidence: 0.45, verificationStatus: "conflicting", confirmationCount: 1, contradictionCount: 1, explanation: "Estimated age from public profile — conflicts with stated age.", createdAt: "2025-04-20T10:00:00Z", expiresAt: "2025-10-20T10:00:00Z" },
          { value: "User reads science fiction novels", category: "preference", source: "AI Inference", tags: ["reading", "sci-fi", "books", "literature"], confidence: 0.65, verificationStatus: "unverified", confirmationCount: 0, contradictionCount: 0, explanation: "Inferred from discussion of Dune and Three-Body Problem.", createdAt: "2025-05-01T10:00:00Z", expiresAt: "2025-11-01T10:00:00Z" },
          { value: "User exercises 3 times per week", category: "habit", source: "AI Inference", tags: ["health", "exercise", "routine", "fitness"], confidence: 0.3, verificationStatus: "expired", confirmationCount: 0, contradictionCount: 0, explanation: "Old inference that has expired — confidence has decayed to very low.", createdAt: "2024-06-01T10:00:00Z", expiresAt: "2025-01-01T10:00:00Z" },
          { value: "User is a fan of electronic music", category: "preference", source: "AI Inference", tags: ["music", "electronic", "preference"], confidence: 0.55, verificationStatus: "unverified", confirmationCount: 0, contradictionCount: 0, explanation: "Inferred from playlist mentions in conversation.", createdAt: "2025-05-10T10:00:00Z", expiresAt: "2025-11-10T10:00:00Z" },
          { value: "User prefers coffee over tea", category: "preference", source: "User Input", tags: ["preference", "coffee", "tea", "beverages"], confidence: 0.75, verificationStatus: "verified", confirmationCount: 2, contradictionCount: 0, explanation: "User directly stated coffee preference twice.", createdAt: "2025-03-20T10:00:00Z", expiresAt: null },
          { value: "User has a degree in Computer Science", category: "fact", source: "User Input", tags: ["education", "computer-science", "degree"], confidence: 0.85, verificationStatus: "verified", confirmationCount: 2, contradictionCount: 0, explanation: "User mentioned their CS degree in conversation twice.", createdAt: "2025-02-05T10:00:00Z", expiresAt: null },
          { value: "User is interested in machine learning", category: "knowledge", source: "AI Inference", tags: ["ai", "machine-learning", "interest", "career"], confidence: 0.7, verificationStatus: "unverified", confirmationCount: 0, contradictionCount: 0, explanation: "Strong inference from multiple technical discussions about ML.", createdAt: "2025-05-20T10:00:00Z", expiresAt: "2025-11-20T10:00:00Z" },
          { value: "User meditates daily", category: "habit", source: "User Input", tags: ["meditation", "mindfulness", "daily-routine", "health"], confidence: 0.65, verificationStatus: "unverified", confirmationCount: 1, contradictionCount: 0, explanation: "User mentioned meditation once. Could use more confirmation.", createdAt: "2025-06-01T10:00:00Z", expiresAt: "2026-06-01T10:00:00Z" },
          { value: "User owns a Tesla Model 3", category: "fact", source: "User Input", tags: ["car", "tesla", "electric-vehicle", "ownership"], confidence: 0.8, verificationStatus: "verified", confirmationCount: 2, contradictionCount: 0, explanation: "User mentioned their Tesla in conversation twice.", createdAt: "2025-04-05T10:00:00Z", expiresAt: null },
          { value: "User wants to start a side business", category: "goal", source: "User Input", tags: ["goal", "business", "entrepreneurship", "career"], confidence: 0.7, verificationStatus: "verified", confirmationCount: 1, contradictionCount: 0, explanation: "User explicitly stated their entrepreneurial goal.", createdAt: "2025-06-10T10:00:00Z", expiresAt: "2026-06-10T10:00:00Z" },
          { value: "User has a brother named Alex", category: "relationship", source: "User Input", tags: ["family", "brother", "alex", "relationship"], confidence: 0.75, verificationStatus: "verified", confirmationCount: 2, contradictionCount: 0, explanation: "User mentioned their brother Alex on two occasions.", createdAt: "2025-03-25T10:00:00Z", expiresAt: null },
        ];
        conflicts = [
          { valueA: "User lives in Paris, France", valueB: "User lives in London, UK", category: "location", explanation: "Location contradiction: Paris vs London. User stated Paris directly (high confidence) but IP geolocation suggests London (medium confidence)." },
          { valueA: "User is 28 years old", valueB: "User mentioned being in their early 30s", category: "fact", explanation: "Age contradiction: Profile data suggests 28, but a conversation reference suggests early 30s." },
        ];
        verifCount = 5;
      }

      for (const mem of memories) {
        const id = generateId();
        const source = db.prepare("SELECT id FROM sources WHERE name = ? LIMIT 1").get(mem.source) as { id: string } | undefined;
        db.prepare(`
          INSERT INTO memories (id, user_id, value, category, confidence, source_id,
            verification_status, confirmation_count, contradiction_count,
            tags, explanation, created_at, updated_at, expires_at)
          VALUES (?, 'default_user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
        `).run(
          id, mem.value, mem.category, mem.confidence, source?.id || "src_import",
          mem.verificationStatus, mem.confirmationCount, mem.contradictionCount,
          JSON.stringify(mem.tags), mem.explanation, mem.createdAt, mem.expiresAt
        );
        result.memoryCount++;
      }

      for (const conf of conflicts) {
        const memA = db.prepare("SELECT id FROM memories WHERE value = ? LIMIT 1").get(conf.valueA) as { id: string } | undefined;
        const memB = db.prepare("SELECT id FROM memories WHERE value = ? LIMIT 1").get(conf.valueB) as { id: string } | undefined;
        if (memA && memB) {
          db.prepare(`
            INSERT INTO memory_conflicts (id, memory_id_a, memory_id_b, value_a, value_b, category, detected_at, explanation)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
          `).run(generateId(), memA.id, memB.id, conf.valueA, conf.valueB, conf.category, conf.explanation);
          result.conflictCount++;
        }
      }

      // Create verification events for first batch of memories
      const firstBatch = db.prepare("SELECT id, confidence FROM memories WHERE user_id = 'default_user' ORDER BY created_at ASC").all() as { id: string; confidence: number }[];
      for (let i = 0; i < Math.min(firstBatch.length, verifCount); i++) {
        const mem = firstBatch[i];
        db.prepare(`
          INSERT INTO verification_events (id, memory_id, action, user_id, previous_confidence, new_confidence, note, created_at)
          VALUES (?, ?, 'confirm', 'default_user', 0.5, ?, 'Initial seed verification', datetime('now'))
        `).run(generateId(), mem.id, mem.confidence);
        result.verifCount++;
      }
    });

    const total = (db.prepare("SELECT COUNT(*) as c FROM memories WHERE user_id = 'default_user'").get() as { c: number }).c;
    return NextResponse.json({
      message: "Seed completed successfully",
      result,
      totalMemories: total,
    });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message || "Seed failed" }, { status: 500 });
  }
}
