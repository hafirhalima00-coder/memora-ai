"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MemoryCategory, Source } from "@/lib/types";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { createMemory } from "@/lib/api-client";

const categories: { value: MemoryCategory; label: string }[] = [
  { value: "preference", label: "Preference" },
  { value: "fact", label: "Fact" },
  { value: "habit", label: "Habit" },
  { value: "goal", label: "Goal" },
  { value: "opinion", label: "Opinion" },
  { value: "relationship", label: "Relationship" },
  { value: "location", label: "Location" },
  { value: "event", label: "Event" },
  { value: "identity", label: "Identity" },
  { value: "knowledge", label: "Knowledge" },
];

const sourceOptions: { id: string; name: string; reliability: Source["reliability"]; type: Source["type"] }[] = [
  { id: "src_user", name: "User Input", reliability: "high", type: "user_input" },
  { id: "src_ai", name: "AI Inference", reliability: "medium", type: "ai_inference" },
  { id: "src_system", name: "System Observation", reliability: "high", type: "observation" },
  { id: "src_api", name: "External API", reliability: "medium", type: "api" },
  { id: "src_import", name: "Data Import", reliability: "low", type: "import" },
];

export default function NewMemoryPage() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [category, setCategory] = React.useState<MemoryCategory>("fact");
  const [sourceId, setSourceId] = React.useState("src_user");
  const [tagsStr, setTagsStr] = React.useState("");
  const [expiresDays, setExpiresDays] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("Memory value is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const source = sourceOptions.find(s => s.id === sourceId)!;
      const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
      const expiresAt = expiresDays ? new Date(Date.now() + parseInt(expiresDays) * 86400000).toISOString() : null;

      const memory = await createMemory({
        userId: "default_user",
        value: value.trim(),
        category,
        source: {
          id: source.id,
          name: source.name,
          reliability: source.reliability,
          type: source.type,
        },
        tags,
        expiresAt,
      });

      router.push(`/memories/${memory.id}`);
    } catch (err) {
      console.error("Failed to create memory:", err);
      setError("Failed to create memory. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/memories" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Memories
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-violet-500" />
            New Memory
          </CardTitle>
          <CardDescription>
            Create a new memory for the trust-aware memory system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Memory Value</label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., User prefers dark mode interfaces"
                className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      category === c.value
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Source</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {sourceOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.reliability} reliability)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="e.g., dark-mode, ui, preference"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Expires In (days, optional)</label>
              <input
                type="number"
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
                placeholder="e.g., 90"
                min="1"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Memory"}
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/memories">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
