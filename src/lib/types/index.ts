// ============================================
// Memora AI - Core Type Definitions
// ============================================

export type MemoryCategory =
  | "preference"
  | "fact"
  | "habit"
  | "goal"
  | "opinion"
  | "relationship"
  | "location"
  | "event"
  | "identity"
  | "knowledge";

export type VerificationStatus =
  | "verified"
  | "unverified"
  | "conflicting"
  | "expired"
  | "rejected";

export type SourceReliability = "high" | "medium" | "low" | "unknown";

export type ConfidenceLevel = "very_high" | "high" | "medium" | "low" | "very_low";

export interface Source {
  id: string;
  name: string;
  reliability: SourceReliability;
  type: "user_input" | "ai_inference" | "observation" | "import" | "api";
}

export interface Memory {
  id: string;
  userId: string;
  value: string;
  category: MemoryCategory;
  confidence: number; // 0-1
  confidenceLevel: ConfidenceLevel;
  source: Source;
  verificationStatus: VerificationStatus;
  confirmationCount: number;
  contradictionCount: number;
  tags: string[];
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt: Date | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface MemoryConflict {
  id: string;
  memoryIdA: string;
  memoryIdB: string;
  valueA: string;
  valueB: string;
  category: MemoryCategory;
  detectedAt: Date;
  resolvedAt: Date | null;
  resolution: "keep_a" | "keep_b" | "merge" | "reject_both" | null;
  resolvedBy: string | null;
  explanation: string;
}

export interface VerificationEvent {
  id: string;
  memoryId: string;
  action: "confirm" | "reject" | "edit" | "increase_confidence" | "decrease_confidence";
  userId: string;
  previousConfidence: number;
  newConfidence: number;
  note: string;
  createdAt: Date;
}

export interface TimelineEvent {
  id: string;
  memoryId: string;
  memoryValue: string;
  type: "created" | "updated" | "confirmed" | "expired" | "conflicted" | "verified" | "rejected";
  confidence: number;
  timestamp: Date;
  detail: string;
}

export interface MemoryNode {
  id: string;
  value: string;
  category: MemoryCategory;
  confidence: number;
  verificationStatus: VerificationStatus;
}

export interface MemoryEdge {
  source: string;
  target: string;
  relationship: "contradicts" | "supports" | "related_to" | "derived_from";
  strength: number;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}

export interface AnalyticsData {
  totalMemories: number;
  trustedMemories: number;
  unverifiedMemories: number;
  expiredMemories: number;
  conflictingMemories: number;
  averageConfidence: number;
  confidenceDistribution: { level: string; count: number }[];
  verificationTrends: { date: string; verified: number; rejected: number; total: number }[];
  expiringMemories: { date: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
}

export interface CreateMemoryInput {
  userId: string;
  value: string;
  category: MemoryCategory;
  source: Source;
  tags?: string[];
  metadata?: Record<string, unknown>;
  expiresAt?: Date | null;
}

export interface UpdateMemoryInput {
  value?: string;
  category?: MemoryCategory;
  tags?: string[];
  metadata?: Record<string, unknown>;
  expiresAt?: Date | null;
}

export interface DashboardStats {
  totalMemories: number;
  trustedMemories: number;
  unverifiedMemories: number;
  expiredMemories: number;
  conflictingMemories: number;
  averageConfidence: number;
  recentMemories: Memory[];
  upcomingExpirations: Memory[];
}

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.9) return "very_high";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.3) return "low";
  return "very_low";
}

export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case "very_high": return "text-emerald-500";
    case "high": return "text-green-500";
    case "medium": return "text-yellow-500";
    case "low": return "text-orange-500";
    case "very_low": return "text-red-500";
  }
}

export function getConfidenceBgColor(level: ConfidenceLevel): string {
  switch (level) {
    case "very_high": return "bg-emerald-500/10 border-emerald-500/30";
    case "high": return "bg-green-500/10 border-green-500/30";
    case "medium": return "bg-yellow-500/10 border-yellow-500/30";
    case "low": return "bg-orange-500/10 border-orange-500/30";
    case "very_low": return "bg-red-500/10 border-red-500/30";
  }
}

export function getStatusColor(status: VerificationStatus): string {
  switch (status) {
    case "verified": return "text-emerald-500";
    case "unverified": return "text-yellow-500";
    case "conflicting": return "text-red-500";
    case "expired": return "text-gray-500";
    case "rejected": return "text-rose-500";
  }
}
