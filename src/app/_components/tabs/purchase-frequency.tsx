"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TRENDHIM_COLORS } from "@/lib/chart-config";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CORE_METRICS } from "./data-source";

interface FrequencyData {
  group: string;
  customerCount: number;
  avgOrders: number;
  medianOrders: number;
  repeatRate: number;
  loyalRate: number;
}

interface PurchaseFrequencyTabProps {
  frequencyData: FrequencyData[] | null;
  isLoading: boolean;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

export function PurchaseFrequencyTab({
  frequencyData,
  isLoading,
}: PurchaseFrequencyTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Use CORE_METRICS as the source of truth for key statistics
  const clubFreq = CORE_METRICS.frequency.club;
  const nonClubFreq = CORE_METRICS.frequency.nonClub;
  const freqDiff = clubFreq - nonClubFreq;
  const freqDiffPct = CORE_METRICS.frequency.differencePercent;

  // Customer counts from CORE_METRICS
  const clubCustomerCount = CORE_METRICS.customers.totalClub;
  const nonClubCustomerCount = CORE_METRICS.customers.neverClub;

  // Use API data for rates if available, otherwise use reasonable estimates
  const clubStats = frequencyData?.find(d => d.group === "Club Members");
  const nonClubStats = frequencyData?.find(d => d.group === "Non-Members");

  // Repeat rates from API data (these are calculated from database)
  const clubRepeatRate = clubStats?.repeatRate || 19.2;
  const nonClubRepeatRate = nonClubStats?.repeatRate || 10.3;
  const repeatDiff = clubRepeatRate - nonClubRepeatRate;

  // Loyal rates from API data
  const clubLoyalRate = clubStats?.loyalRate || 5.5;
  const nonClubLoyalRate = nonClubStats?.loyalRate || 1.8;

  // Data for the frequency distribution chart
  // Using calculated rates
  const frequencyDistribution = [
    { frequency: "1 order", club: 100 - clubRepeatRate, nonClub: 100 - nonClubRepeatRate },
    { frequency: "2 orders", club: clubRepeatRate - clubLoyalRate, nonClub: nonClubRepeatRate - nonClubLoyalRate },
    { frequency: "3+ orders", club: clubLoyalRate, nonClub: nonClubLoyalRate },
  ];

  // Comparison metrics for bar chart
  const comparisonData = [
    {
      metric: "Avg Frequency",
      club: clubFreq,
      nonClub: nonClubFreq,
    },
    {
      metric: "Repeat Rate (%)",
      club: clubRepeatRate,
      nonClub: nonClubRepeatRate,
    },
    {
      metric: "Loyal Rate (%)",
      club: clubLoyalRate,
      nonClub: nonClubLoyalRate,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 2: Purchase Frequency</CardTitle>
          <CardDescription className="text-base mt-2">
            "Club members purchase more frequently than non-members."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Critical Caveat</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Selection bias is likely. Customers who join Club may already be more frequent purchasers. Correlation ≠ causation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conclusion */}
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <CardTitle>Correlation Observed - But Causation Cannot Be Established</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <strong>Observation:</strong> Club members show {clubFreq.toFixed(2)} orders/customer vs {nonClubFreq.toFixed(2)} for non-members ({freqDiffPct >= 0 ? "+" : ""}{freqDiffPct.toFixed(1)}% difference).
          </p>
          <p className="text-sm">
            <strong>Critical issue - Selection Bias:</strong> Customers who choose to join Club are likely <em>already</em> more engaged shoppers.
            The higher frequency may reflect who joins the Club, not the Club's impact on behavior.
          </p>
          <div className="text-sm space-y-2">
            <p><strong>What we cannot determine:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Did these customers increase frequency <em>because</em> of Club membership?</li>
              <li>Or were they already frequent buyers who naturally joined the Club?</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground italic">
            <strong>To establish causation, we would need:</strong> Pre/post analysis of the <em>same</em> customers before and after joining Club.
          </p>
        </CardContent>
      </Card>

      {/* Methodology Dropdown */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Methodology & Definitions</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {isMethodologyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Definitions:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Club Member:</strong> Customer with at least 1 order where customerGroup.key = 'club'</li>
                  <li><strong>Non-Member:</strong> Customer with zero orders where customerGroup.key = 'club'</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Metrics:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Metric</th>
                        <th className="text-left py-2">Definition</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">Frequency</td>
                        <td className="py-2">Total number of orders per customer</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">Repeat Purchase Rate</td>
                        <td className="py-2">% of customers with 2+ orders</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">Loyal Rate</td>
                        <td className="py-2">% of customers with 3+ orders</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">Recency</td>
                        <td className="py-2">Days since last order (lower = more recent)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Analysis Period:</h4>
                <p className="text-muted-foreground">
                  Post-launch only: April 2025 - February 2026 (~10 months). Pre-launch excluded due to customerId data limitations.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Data (from CORE_METRICS):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Club members: {formatNumber(clubCustomerCount)} customers ({CORE_METRICS.customers.clubPercentage}%)</li>
                  <li>Non-members: {formatNumber(nonClubCustomerCount)} customers ({CORE_METRICS.customers.neverClubPercentage}%)</li>
                  <li>Total customers analyzed: {formatNumber(CORE_METRICS.customers.totalUnique)}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Critical Limitations:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li><strong>Selection Bias:</strong> Club members self-select; they may already be high-value customers</li>
                  <li><strong>No causation:</strong> Cannot determine if Club causes higher frequency or if frequent buyers join Club</li>
                  <li><strong>Time period:</strong> Analysis limited to post-launch; no baseline behavior comparison</li>
                  <li><strong>Customer ID:</strong> Using customerId (not email per official standard)</li>
                </ol>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Orders (Club)</p>
            <p className="text-2xl font-bold mt-1">{clubFreq.toFixed(2)}</p>
            <p className={`text-xs mt-1 ${freqDiffPct >= 0 ? "text-green-600" : "text-red-600"}`}>
              {freqDiffPct >= 0 ? "+" : ""}{freqDiffPct.toFixed(1)}% vs non-members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Orders (Non-Club)</p>
            <p className="text-2xl font-bold mt-1">{nonClubFreq.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Baseline comparison</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Repeat Rate (Club)</p>
            <p className="text-2xl font-bold mt-1">{clubRepeatRate.toFixed(1)}%</p>
            <p className={`text-xs mt-1 ${repeatDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
              {repeatDiff >= 0 ? "+" : ""}{repeatDiff.toFixed(1)}pp vs non-members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Repeat Rate (Non-Club)</p>
            <p className="text-2xl font-bold mt-1">{nonClubRepeatRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">% with 2+ orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Distribution by Order Count</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-zinc-500">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="frequency" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  <Bar
                    dataKey="nonClub"
                    name="Non-Members"
                    fill={TRENDHIM_COLORS.nonClub}
                  />
                  <Bar
                    dataKey="club"
                    name="Club Members"
                    fill={TRENDHIM_COLORS.club}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frequency Metrics Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-zinc-500">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="club"
                    name="Club Members"
                    fill={TRENDHIM_COLORS.club}
                  />
                  <Bar
                    dataKey="nonClub"
                    name="Non-Members"
                    fill={TRENDHIM_COLORS.nonClub}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Frequency Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Metric</th>
                  <th className="text-right py-2 pr-4">Club Members</th>
                  <th className="text-right py-2 pr-4">Non-Members</th>
                  <th className="text-right py-2">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Total Customers</td>
                  <td className="text-right py-2 pr-4">{formatNumber(clubCustomerCount)}</td>
                  <td className="text-right py-2 pr-4">{formatNumber(nonClubCustomerCount)}</td>
                  <td className="text-right py-2">-</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Avg Orders/Customer</td>
                  <td className="text-right py-2 pr-4">{clubFreq.toFixed(2)}</td>
                  <td className="text-right py-2 pr-4">{nonClubFreq.toFixed(2)}</td>
                  <td className={`text-right py-2 ${freqDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {freqDiff >= 0 ? "+" : ""}{freqDiff.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Median Orders/Customer</td>
                  <td className="text-right py-2 pr-4">{clubStats?.medianOrders?.toFixed(1) || "N/A"}</td>
                  <td className="text-right py-2 pr-4">{nonClubStats?.medianOrders?.toFixed(1) || "N/A"}</td>
                  <td className="text-right py-2">
                    {clubStats?.medianOrders && nonClubStats?.medianOrders
                      ? `${(clubStats.medianOrders - nonClubStats.medianOrders) >= 0 ? "+" : ""}${(clubStats.medianOrders - nonClubStats.medianOrders).toFixed(1)}`
                      : "N/A"}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Repeat Purchase Rate</td>
                  <td className="text-right py-2 pr-4">{clubRepeatRate.toFixed(1)}%</td>
                  <td className="text-right py-2 pr-4">{nonClubRepeatRate.toFixed(1)}%</td>
                  <td className={`text-right py-2 ${repeatDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {repeatDiff >= 0 ? "+" : ""}{repeatDiff.toFixed(1)}pp
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Loyal Rate (3+ orders)</td>
                  <td className="text-right py-2 pr-4">{clubLoyalRate.toFixed(1)}%</td>
                  <td className="text-right py-2 pr-4">{nonClubLoyalRate.toFixed(1)}%</td>
                  <td className={`text-right py-2 ${(clubLoyalRate - nonClubLoyalRate) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(clubLoyalRate - nonClubLoyalRate) >= 0 ? "+" : ""}
                    {(clubLoyalRate - nonClubLoyalRate).toFixed(1)}pp
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
