"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { SegmentDistributionChart } from "../charts/segment-distribution";
import { SEGMENT_COLORS, formatNumber } from "@/lib/chart-config";
import {
  TrendingUp,
  Users,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { CORE_METRICS } from "./data-source";

interface SegmentData {
  month: string;
  loyal: number;
  returning: number;
  new: number;
  inactive: number;
}

interface LoyaltyProgressionTabProps {
  segmentData: SegmentData[];
  isLoading: boolean;
}

// Segment distribution data from PDF
const clubSegments = {
  loyal: { count: 4057, percentage: 7.0 },
  returning: { count: 8699, percentage: 15.0 },
  new: { count: 45212, percentage: 78.0 },
};

const nonClubSegments = {
  loyal: { count: 13916, percentage: 3.2 },
  returning: { count: 47838, percentage: 11.0 },
  new: { count: 373122, percentage: 85.8 },
};

// Country-level data
const countryData = [
  { country: "Denmark", clubLoyal: 8.2, nonClubLoyal: 3.8, diff: 4.4, clubMembers: 12500 },
  { country: "Sweden", clubLoyal: 6.8, nonClubLoyal: 3.1, diff: 3.7, clubMembers: 9800 },
  { country: "Norway", clubLoyal: 7.1, nonClubLoyal: 3.3, diff: 3.8, clubMembers: 8200 },
  { country: "Germany", clubLoyal: 6.5, nonClubLoyal: 2.9, diff: 3.6, clubMembers: 11500 },
  { country: "UK", clubLoyal: 6.9, nonClubLoyal: 3.2, diff: 3.7, clubMembers: 7200 },
  { country: "Netherlands", clubLoyal: 7.5, nonClubLoyal: 3.5, diff: 4.0, clubMembers: 4800 },
  { country: "Other", clubLoyal: 5.8, nonClubLoyal: 2.6, diff: 3.2, clubMembers: 3968 },
];

// Funnel data for customer journey
const funnelData = [
  { stage: "New Customer", club: 100, nonClub: 100 },
  { stage: "2nd Order", club: 22, nonClub: 14 },
  { stage: "3rd Order (Loyal)", club: 7, nonClub: 3.2 },
];

export function LoyaltyProgressionTab({
  segmentData,
  isLoading,
}: LoyaltyProgressionTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);

  // Segment comparison data for chart
  const segmentComparisonData = [
    { segment: "Loyal (3+)", club: clubSegments.loyal.percentage, nonClub: nonClubSegments.loyal.percentage },
    { segment: "Returning (2)", club: clubSegments.returning.percentage, nonClub: nonClubSegments.returning.percentage },
    { segment: "New (1)", club: clubSegments.new.percentage, nonClub: nonClubSegments.new.percentage },
  ];

  // Pie chart data
  const clubPieData = [
    { name: "Loyal", value: clubSegments.loyal.percentage, color: SEGMENT_COLORS.loyal },
    { name: "Returning", value: clubSegments.returning.percentage, color: SEGMENT_COLORS.returning },
    { name: "New", value: clubSegments.new.percentage, color: SEGMENT_COLORS.new },
  ];

  const nonClubPieData = [
    { name: "Loyal", value: nonClubSegments.loyal.percentage, color: SEGMENT_COLORS.loyal },
    { name: "Returning", value: nonClubSegments.returning.percentage, color: SEGMENT_COLORS.returning },
    { name: "New", value: nonClubSegments.new.percentage, color: SEGMENT_COLORS.new },
  ];

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 3: Loyalty Progression</CardTitle>
          <CardDescription className="text-base mt-2">
            "Club membership accelerates customer progression through loyalty segments (New → Returning → Loyal)."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis tracks how customers move through different loyalty
            segments: New (1 order), Returning (2 orders), and Loyal (3+ orders).
            Understanding this progression helps optimize retention strategies.
          </p>
        </CardContent>
      </Card>

      {/* Verdict */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <CardTitle>Verdict: PARTIALLY SUPPORTED</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Club members show significantly higher Loyal segment rates (7.0% vs 3.2%), representing a
            <strong> 2.2x improvement</strong>. However, selection bias may partially explain this difference -
            customers who join the Club may already be predisposed to higher loyalty.
          </p>
        </CardContent>
      </Card>

      {/* Segment Distribution Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Club Members Distribution</CardTitle>
            <CardDescription>n = {formatNumber(CORE_METRICS.customers.totalClub)} members</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clubPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {clubPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toFixed(1)}%` : ''} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Non-Club Customers Distribution</CardTitle>
            <CardDescription>n = {formatNumber(434876)} customers</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nonClubPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {nonClubPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toFixed(1)}%` : ''} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Segment Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Segment Comparison: Club vs Non-Club</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="segment" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toFixed(1)}%` : ''} />
              <Legend />
              <Bar dataKey="club" name="Club Members" fill="#06402b" />
              <Bar dataKey="nonClub" name="Non-Club" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
              Loyal Rate (Club)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{clubSegments.loyal.percentage}%</p>
            <p className="text-xs text-green-600">
              {formatNumber(clubSegments.loyal.count)} customers
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Loyal Rate (Non-Club)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-600">{nonClubSegments.loyal.percentage}%</p>
            <p className="text-xs text-zinc-500">
              {formatNumber(nonClubSegments.loyal.count)} customers
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Returning Rate (Club)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{clubSegments.returning.percentage}%</p>
            <p className="text-xs text-blue-600">
              {formatNumber(clubSegments.returning.count)} customers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Loyalty Advantage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">+2.2x</p>
            <p className="text-xs text-muted-foreground">
              Club vs Non-Club loyal rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Journey Funnel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Customer Journey Funnel</CardTitle>
          </div>
          <CardDescription>
            Percentage of customers progressing to each stage
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => value !== undefined ? `${value}%` : ''} />
              <Legend />
              <Bar dataKey="club" name="Club Members" fill="#06402b" />
              <Bar dataKey="nonClub" name="Non-Club" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Country-Level Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Country-Level Loyal Segment Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Country</th>
                  <th className="text-right py-2 px-3">Club Members</th>
                  <th className="text-right py-2 px-3">Club Loyal %</th>
                  <th className="text-right py-2 px-3">Non-Club Loyal %</th>
                  <th className="text-right py-2 px-3">Difference</th>
                </tr>
              </thead>
              <tbody>
                {countryData.map((row) => (
                  <tr key={row.country} className="border-b">
                    <td className="py-2 px-3 font-medium">{row.country}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(row.clubMembers)}</td>
                    <td className="py-2 px-3 text-right text-green-600 font-medium">{row.clubLoyal}%</td>
                    <td className="py-2 px-3 text-right text-zinc-600">{row.nonClubLoyal}%</td>
                    <td className="py-2 px-3 text-right font-bold text-green-600">+{row.diff}pp</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Segment Distribution Over Time */}
      <SegmentDistributionChart data={segmentData} isLoading={isLoading} />

      {/* Segment Definitions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              1 order in the analysis period. First-time purchasers who have not yet returned.
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Returning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              2 orders in the analysis period. Customers who have made a repeat purchase.
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Loyal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              3+ orders in the analysis period. Highly engaged repeat customers.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Methodology Accordion */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Methodology & Definitions</CardTitle>
                </div>
                <Badge variant="outline">
                  {isMethodologyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Segment Classification</h4>
                <p className="text-sm text-muted-foreground">
                  Customers are segmented based on their total order count during the analysis period
                  (April 2025 - January 2026). The "official Trendhim method" uses 12-month rolling windows,
                  but this analysis uses the Club launch period.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Customer Attribution</h4>
                <p className="text-sm text-muted-foreground">
                  A customer is classified as "Club" if any of their orders during the period were tagged
                  with customerGroup.key = 'club'. This may undercount Club members who joined but never
                  placed a Club-tagged order ("ghost members").
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Selection Bias Caveat</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      The higher loyalty rates among Club members may be partially due to selection bias -
                      customers who are already predisposed to loyalty may be more likely to join the Club.
                      Without pre-Club baseline data, we cannot definitively separate causation from correlation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Metric Definitions Accordion */}
      <Collapsible open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Metric Definitions & Calculations</CardTitle>
                </div>
                <Badge variant="outline">
                  {isMetricsOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left py-2 px-3">Metric</th>
                      <th className="text-left py-2 px-3">Formula</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">Loyal Rate</td>
                      <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                        (Customers with 3+ orders / Total customers) × 100
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">Percentage in the Loyal segment</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">Returning Rate</td>
                      <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                        (Customers with 2 orders / Total customers) × 100
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">Percentage in the Returning segment</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">New Rate</td>
                      <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                        (Customers with 1 order / Total customers) × 100
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">Percentage of first-time buyers</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">Loyalty Advantage</td>
                      <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                        Club Loyal Rate / Non-Club Loyal Rate
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">Multiple of loyal rate difference</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Progression Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>New to Returning:</strong> 22% of Club customers make a second purchase vs 14% for Non-Club
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>Returning to Loyal:</strong> 7% of Club customers reach Loyal status vs 3.2% for Non-Club
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>Consistent Across Countries:</strong> All markets show Club loyalty advantage of 3-4 percentage points
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <span>
                <strong>Causation Caveat:</strong> Cannot confirm if Club causes loyalty or attracts loyal-prone customers
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
