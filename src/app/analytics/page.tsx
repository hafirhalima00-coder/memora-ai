"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ConfidenceChart } from "@/components/analytics/confidence-chart";
import { ExpiringChart } from "@/components/analytics/expiring-chart";
import { TrendsChart } from "@/components/analytics/trends-chart";
import { getAnalytics } from "@/lib/api-client";
import { cn, formatConfidence } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/types";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAnalytics();
      setData(result);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
            Insights and metrics for your memory system
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Total Memories</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{data.totalMemories}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Trusted (≥70%)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.trustedMemories}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Unverified</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{data.unverifiedMemories}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Avg Confidence</p>
                <p className={cn(
                  "text-2xl font-bold",
                  data.averageConfidence >= 0.7 ? "text-emerald-600 dark:text-emerald-400" :
                  data.averageConfidence >= 0.4 ? "text-yellow-600 dark:text-yellow-400" :
                  "text-red-600 dark:text-red-400"
                )}>
                  {formatConfidence(data.averageConfidence)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConfidenceChart data={data.confidenceDistribution} />
            <ExpiringChart data={data.expiringMemories} />
            <TrendsChart data={data.verificationTrends} />

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChart className="h-5 w-5 text-violet-500" />
                  Category Distribution
                </CardTitle>
                <CardDescription>Memories grouped by category</CardDescription>
              </CardHeader>
              <CardContent>
                {data.categoryDistribution.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.categoryDistribution.map((item) => (
                      <div key={item.category} className="flex items-center gap-2">
                        <Badge variant="outline" className="w-24 text-[10px] uppercase">
                          {item.category}
                        </Badge>
                        <Progress
                          value={(item.count / data.totalMemories) * 100}
                          variant="default"
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-zinc-500 w-8 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-violet-500" />
                  Source Distribution
                </CardTitle>
                <CardDescription>Memories by source reliability</CardDescription>
              </CardHeader>
              <CardContent>
                {data.sourceDistribution.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.sourceDistribution.map((item) => (
                      <div key={item.source} className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 w-28 truncate">
                          {item.source}
                        </span>
                        <Progress
                          value={(item.count / data.totalMemories) * 100}
                          variant="default"
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-zinc-500 w-8 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
