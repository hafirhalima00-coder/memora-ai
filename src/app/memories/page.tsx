"use client";

import * as React from "react";
import { MemoryCard } from "@/components/memory/memory-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Memory } from "@/lib/types";
import {
  FileText,
  PlusCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { getMemories } from "@/lib/api-client";

const categories = [
  { value: "", label: "All Categories" },
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

const statuses = [
  { value: "", label: "All Status" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
  { value: "conflicting", label: "Conflicting" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
];

export default function MemoriesPage() {
  const [memories, setMemories] = React.useState<Memory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);

  const loadMemories = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMemories({
        category: category || undefined,
        status: status || undefined,
        search: search || undefined,
      });
      setMemories(data);
    } catch (err) {
      console.error("Failed to load memories:", err);
    }
    setLoading(false);
  }, [category, status, search]);

  React.useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadMemories();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadMemories]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Memories</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
            Browse and manage all memories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button asChild>
            <Link href="/memories/new">
              <PlusCircle className="h-4 w-4 mr-1" />
              New Memory
            </Link>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMemories}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-sm text-zinc-500">Loading memories...</p>
          </div>
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4">
            <FileText className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            No memories found
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-md">
            {search || category || status
              ? "Try adjusting your search or filters"
              : "Create your first memory to start building your trust-aware memory system"}
          </p>
          {(search || category || status) ? (
            <Button variant="outline" onClick={() => { setSearch(""); setCategory(""); setStatus(""); }}>
              Clear Filters
            </Button>
          ) : (
            <Button asChild>
              <Link href="/memories/new">
                <PlusCircle className="h-4 w-4 mr-1" /> Create Memory
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}
    </div>
  );
}
