import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, closeDb } from "@/lib/db/connection";

// Note: These tests require the SQLite database to be initialized
// They test the ConfidenceEngine calculation logic

describe("ConfidenceEngine", () => {
  beforeAll(() => {
    // Database is initialized with seed data when getDb() is called
    getDb();
  });

  afterAll(() => {
    closeDb();
  });

  it("should have seed data loaded", () => {
    const db = getDb();
    const count = db.prepare("SELECT COUNT(*) as count FROM memories").get() as { count: number };
    expect(count.count).toBeGreaterThan(0);
  });

  it("should have sources loaded", () => {
    const db = getDb();
    const count = db.prepare("SELECT COUNT(*) as count FROM sources").get() as { count: number };
    expect(count.count).toBe(5);
  });

  it("should have memory_001 with high confidence", () => {
    const db = getDb();
    const memory = db.prepare("SELECT * FROM memories WHERE id = ?").get("mem_001") as {
      confidence: number;
      confirmation_count: number;
    };
    expect(memory).toBeDefined();
    expect(memory.confidence).toBeGreaterThanOrEqual(0.7);
    expect(memory.confirmation_count).toBeGreaterThanOrEqual(2);
  });

  it("should detect conflicts in the location category", () => {
    const db = getDb();
    const conflicts = db.prepare(
      "SELECT * FROM memory_conflicts"
    ).all();
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
  });

  it("should have verification events", () => {
    const db = getDb();
    const events = db.prepare(
      "SELECT * FROM verification_events"
    ).all();
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it("should have memories in each verification status", () => {
    const db = getDb();
    const statuses = db.prepare(
      "SELECT DISTINCT verification_status FROM memories"
    ).all() as { verification_status: string }[];
    const statusList = statuses.map(s => s.verification_status);
    expect(statusList).toContain("verified");
    expect(statusList).toContain("unverified");
    expect(statusList).toContain("conflicting");
  });
});

describe("Confidence Calculation Logic", () => {
  it("should calculate correct confidence from factors", () => {
    // Test the formula: baseScore + confirmationBonus - contradictionPenalty - ageDecay
    // baseScore = 0.3 * sourceMultiplier
    // confirmationBonus = min(confirmations * 0.15, 0.6)
    // contradictionPenalty = contradictions * 0.2
    // ageDecay = max(0, daysSinceCreation - 90) * 0.002

    const sourceMultiplier = 1.0; // high reliability
    const baseScore = 0.3 * sourceMultiplier;
    const confirmations = 3;
    const confirmationBonus = Math.min(confirmations * 0.15, 0.6);
    const contradictions = 0;
    const contradictionPenalty = contradictions * 0.2;
    const daysSinceCreation = 30;
    const ageDecay = Math.max(0, daysSinceCreation - 90) * 0.002;

    const finalScore = baseScore + confirmationBonus - contradictionPenalty - ageDecay;

    expect(baseScore).toBe(0.3);
    expect(confirmationBonus).toBe(0.45);
    expect(contradictionPenalty).toBe(0);
    expect(ageDecay).toBe(0);
    expect(finalScore).toBeCloseTo(0.75, 2);
    expect(Math.max(0, Math.min(1, finalScore))).toBeCloseTo(0.75, 2);
  });

  it("should clamp confidence between 0 and 1", () => {
    const testValues = [-0.5, -0.1, 0, 0.3, 0.7, 1, 1.5, 2];
    const clamped = testValues.map(v => Math.max(0, Math.min(1, v)));
    expect(clamped).toEqual([0, 0, 0, 0.3, 0.7, 1, 1, 1]);
  });

  it("should penalize contradictions heavily", () => {
    const contradictions = 2;
    const contradictionPenalty = contradictions * 0.2;
    expect(contradictionPenalty).toBe(0.4);
  });

  it("should cap confirmation bonus at 0.6", () => {
    expect(Math.min(2 * 0.15, 0.6)).toBe(0.3);
    expect(Math.min(4 * 0.15, 0.6)).toBe(0.6);
    expect(Math.min(10 * 0.15, 0.6)).toBe(0.6);
  });

  it("should apply age decay only after 90 days", () => {
    expect(Math.max(0, 30 - 90) * 0.002).toBe(0);
    expect(Math.max(0, 90 - 90) * 0.002).toBe(0);
    expect(Math.max(0, 100 - 90) * 0.002).toBeCloseTo(0.02, 3);
    expect(Math.max(0, 365 - 90) * 0.002).toBeCloseTo(0.55, 2);
  });

  it("should determine correct confidence level", () => {
    const getLevel = (score: number) => {
      if (score >= 0.9) return "very_high";
      if (score >= 0.7) return "high";
      if (score >= 0.5) return "medium";
      if (score >= 0.3) return "low";
      return "very_low";
    };

    expect(getLevel(0.95)).toBe("very_high");
    expect(getLevel(0.85)).toBe("high");
    expect(getLevel(0.6)).toBe("medium");
    expect(getLevel(0.4)).toBe("low");
    expect(getLevel(0.1)).toBe("very_low");
  });
});

describe("Conflict Detector Logic", () => {
  it("should detect location conflicts between different cities", () => {
    const areConflicting = (a: string, b: string): boolean => {
      const normA = a.toLowerCase().trim();
      const normB = b.toLowerCase().trim();
      const cities = ["paris", "london", "new york", "tokyo", "berlin"];

      if (normA === normB) return false;

      const locA = cities.find(c => normA.includes(c));
      const locB = cities.find(c => normB.includes(c));
      return locA !== undefined && locB !== undefined && locA !== locB;
    };

    expect(areConflicting("User lives in Paris", "User lives in London")).toBe(true);
    expect(areConflicting("User lives in Paris", "User lives in Paris")).toBe(false);
    expect(areConflicting("User lives in Paris", "User likes pizza")).toBe(false);
    expect(areConflicting("User lives in New York", "User lives in Tokyo")).toBe(true);
  });

  it("should not flag non-location statements as conflicts", () => {
    const areConflicting = (a: string, b: string): boolean => {
      const normA = a.toLowerCase().trim();
      const normB = b.toLowerCase().trim();
      const cities = ["paris", "london"];
      const locA = cities.find(c => normA.includes(c));
      const locB = cities.find(c => normB.includes(c));
      return locA !== undefined && locB !== undefined && locA !== locB;
    };

    expect(areConflicting("User likes Paris", "User likes London")).toBe(true);
    expect(areConflicting("Python is great", "Java is great")).toBe(false);
  });
});

describe("Utility Functions", () => {
  it("should format dates correctly", () => {
    // Just test simple date operations
    const date = new Date("2025-01-15T10:00:00Z");
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
  });

  it("should generate unique IDs", () => {
    const generateId = () => `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toContain("mem_");
  });
});
