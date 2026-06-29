/**
 * API Client - All server-side database operations go through these functions.
 * This keeps better-sqlite3 on the server side only.
 */

const BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Dashboard
export async function getDashboardStats() {
  return fetchJson<any>(`${BASE}/dashboard`);
}

// Memories
export async function getMemories(params?: { category?: string; status?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return fetchJson<any[]>(`${BASE}/memories${q ? `?${q}` : ""}`);
}

export async function getMemory(id: string) {
  return fetchJson<any>(`${BASE}/memories/${id}`);
}

export async function createMemory(data: any) {
  return fetchJson<any>(`${BASE}/memories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMemory(id: string, data: any) {
  return fetchJson<any>(`${BASE}/memories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMemory(id: string) {
  return fetchJson<any>(`${BASE}/memories/${id}`, { method: "DELETE" });
}

// Conflicts
export async function getConflicts() {
  return fetchJson<{ conflicts: any[]; stats: { total: number; unresolved: number; resolved: number } }>(`${BASE}/conflicts`);
}

export async function resolveConflict(id: string, resolution: string) {
  return fetchJson<any>(`${BASE}/conflicts/${id}`, {
    method: "POST",
    body: JSON.stringify({ resolution }),
  });
}

// Verification
export async function getPendingVerifications() {
  return fetchJson<any[]>(`${BASE}/verification`);
}

export async function performVerification(memoryId: string, action: string, note?: string) {
  return fetchJson<any>(`${BASE}/verification`, {
    method: "POST",
    body: JSON.stringify({ memoryId, action, note }),
  });
}

// Timeline
export async function getTimeline() {
  return fetchJson<any[]>(`${BASE}/timeline`);
}

// Graph
export async function getGraph() {
  return fetchJson<{ nodes: any[]; edges: any[]; stats: any }>(`${BASE}/graph`);
}

// Analytics
export async function getAnalytics() {
  return fetchJson<any>(`${BASE}/analytics`);
}

// Explanation
export async function getExplanation(memoryId: string) {
  return fetchJson<any>(`${BASE}/explain/${memoryId}`);
}

// Verification history
export async function getVerificationHistory(memoryId: string) {
  return fetchJson<any[]>(`${BASE}/memories/${memoryId}/verifications`);
}
