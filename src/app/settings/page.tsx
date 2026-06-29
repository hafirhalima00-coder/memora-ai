"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Download,
  Upload,
  Settings,
  Database,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [exportData, setExportData] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await fetch("/api/export");
      const data = await res.json();
      const json = JSON.stringify(data, null, 2);
      setExportData(json);

      // Trigger download
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memora-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Export failed");
    }
    setExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError("");
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });

      if (!res.ok) throw new Error("Import failed");
      const result = await res.json();
      setImportResult(result);
    } catch (err) {
      setError("Invalid file or import failed");
    }
    setImporting(false);
    e.target.value = "";
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-600">
          <Settings className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10 mb-6">
        Manage your memory system settings
      </p>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-violet-500" />
            Data Management
          </CardTitle>
          <CardDescription>Export or import your memories as JSON</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-sm">Export Memories</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Download all your memories, conflicts, and verification data as a JSON file.
              </p>
              <Button onClick={handleExport} disabled={exporting} size="sm">
                {exporting ? "Exporting..." : "Export JSON"}
              </Button>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-sm">Import Memories</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Import memories from a previously exported JSON file. Duplicates are skipped.
              </p>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  aria-label="Select JSON file to import"
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={importing} size="sm" variant="outline">
                  {importing ? "Importing..." : "Import JSON"}
                </Button>
              </div>
            </div>
          </div>

          {importResult && (
            <div className={cn(
              "rounded-lg border p-3 flex items-start gap-2",
              importResult.imported > 0
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30"
            )}>
              {importResult.imported > 0
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                : <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              }
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Imported {importResult.imported} memories
                  {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
                </p>
                {importResult.errors.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">{importResult.errors.length} errors</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
