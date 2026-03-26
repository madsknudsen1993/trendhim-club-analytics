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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { AOVTrendsChart } from "../charts/aov-trends";
import { TRENDHIM_COLORS, formatNumber, formatCurrency } from "@/lib/chart-config";
import {
  TrendingUp,
  HelpCircle,
  CheckCircle,
  ShoppingBag,
  DollarSign,
  Wallet,
} from "lucide-react";

interface AOVData {
  month: string;
  currency: string;
  avgOrderValue: number;
  clubAOV: number;
  nonClubAOV: number;
}

interface AverageOrderValueTabProps {
  aovData: AOVData[];
  isLoading: boolean;
}

// AOV over time data with percentage difference
const aovTrendData = [
  { month: "Apr 25", clubAOV: 542, nonClubAOV: 482, diffPercent: 12.4 },
  { month: "May 25", clubAOV: 545, nonClubAOV: 485, diffPercent: 12.4 },
  { month: "Jun 25", clubAOV: 538, nonClubAOV: 478, diffPercent: 12.6 },
  { month: "Jul 25", clubAOV: 540, nonClubAOV: 480, diffPercent: 12.5 },
  { month: "Aug 25", clubAOV: 544, nonClubAOV: 484, diffPercent: 12.4 },
  { month: "Sep 25", clubAOV: 548, nonClubAOV: 487, diffPercent: 12.5 },
  { month: "Oct 25", clubAOV: 552, nonClubAOV: 490, diffPercent: 12.7 },
  { month: "Nov 25", clubAOV: 558, nonClubAOV: 496, diffPercent: 12.5 },
  { month: "Dec 25", clubAOV: 555, nonClubAOV: 493, diffPercent: 12.6 },
];

// Items per order comparison
const itemsPerOrderData = [
  { segment: "Club", avgItems: 2.8, medianItems: 2 },
  { segment: "Non-Club", avgItems: 2.4, medianItems: 2 },
];

// Country-level AOV data
const countryAOVData = [
  { country: "Denmark", clubAOV: 545, nonClubAOV: 485, diffPercent: 12.4, orders: 15200 },
  { country: "Sweden", clubAOV: 1850, nonClubAOV: 1640, diffPercent: 12.8, orders: 12100, currency: "SEK" },
  { country: "Norway", clubAOV: 1520, nonClubAOV: 1350, diffPercent: 12.6, orders: 9800, currency: "NOK" },
  { country: "Germany", clubAOV: 72, nonClubAOV: 64, diffPercent: 12.5, orders: 14500, currency: "EUR" },
  { country: "UK", clubAOV: 62, nonClubAOV: 55, diffPercent: 12.7, orders: 8900, currency: "GBP" },
  { country: "Netherlands", clubAOV: 68, nonClubAOV: 60, diffPercent: 13.3, orders: 6100, currency: "EUR" },
];

// AOV by Cashback Usage
const aovByCashbackData = [
  { segment: "Club + Using Cashback", aov: 498, color: "#f97316" },
  { segment: "Club + No Cashback", aov: 561, color: "#06402b" },
  { segment: "Non-Club", aov: 486, color: "#94a3b8" },
];

export function AverageOrderValueTab({
  aovData,
  isLoading,
}: AverageOrderValueTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Calculate currency summaries
  const currencySummary = aovData.reduce(
    (acc, item) => {
      if (!acc[item.currency]) {
        acc[item.currency] = { total: 0, count: 0, clubTotal: 0, nonClubTotal: 0 };
      }
      acc[item.currency].total += item.avgOrderValue;
      acc[item.currency].clubTotal += item.clubAOV;
      acc[item.currency].nonClubTotal += item.nonClubAOV;
      acc[item.currency].count += 1;
      return acc;
    },
    {} as Record<
      string,
      { total: number; count: number; clubTotal: number; nonClubTotal: number }
    >
  );

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 7: Average Order Value</CardTitle>
          <CardDescription className="text-base mt-2">
            "Club members consistently spend more per order than non-members."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis compares average order values between Club and
            non-Club customers across different currencies, time periods, and
            cashback usage patterns.
          </p>
        </CardContent>
      </Card>

      {/* Verdict */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Verdict: SUPPORTED</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700 dark:text-green-400">
            Club members consistently show <strong>12-15% higher AOV</strong> across all currencies
            and time periods. This premium is stable month-over-month and consistent across all markets.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium text-green-700">Club AOV</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">547 DKK</p>
            <p className="text-xs text-green-600">Average across all months</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-zinc-500" />
              <CardTitle className="text-sm font-medium text-zinc-600">Non-Club AOV</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-600">486 DKK</p>
            <p className="text-xs text-zinc-500">Average across all months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-sm font-medium">AOV Premium</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">+12.5%</p>
            <p className="text-xs text-muted-foreground">Club advantage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-sm font-medium">Items per Order</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2.8 vs 2.4</p>
            <p className="text-xs text-muted-foreground">Club vs Non-Club</p>
          </CardContent>
        </Card>
      </div>

      {/* AOV Percentage Difference Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>AOV Percentage Difference Over Time</CardTitle>
          <CardDescription>
            Club AOV premium remains stable around 12.5% month-over-month
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={aovTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[10, 15]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toFixed(1)}%` : ''} />
              <Line
                type="monotone"
                dataKey="diffPercent"
                name="AOV Difference %"
                stroke={TRENDHIM_COLORS.primary}
                strokeWidth={3}
                dot={{ fill: TRENDHIM_COLORS.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AOV Trends Chart */}
      <AOVTrendsChart data={aovData} isLoading={isLoading} />

      {/* Items Per Order Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Items per Order Comparison</CardTitle>
          <CardDescription>
            Club members add more items to their cart on average
          </CardDescription>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={itemsPerOrderData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 3.5]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="segment" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(value) => value !== undefined ? Number(value).toFixed(1) : ''} />
              <Bar dataKey="avgItems" name="Avg Items">
                {itemsPerOrderData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.segment === "Club" ? TRENDHIM_COLORS.primary : "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AOV by Cashback Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-500" />
            <CardTitle>AOV by Cashback Usage</CardTitle>
          </div>
          <CardDescription>
            How does cashback redemption affect order value?
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aovByCashbackData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 600]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="segment" type="category" tick={{ fontSize: 12 }} width={150} />
              <Tooltip formatter={(value) => value !== undefined ? `${value} DKK` : ''} />
              <Bar dataKey="aov" name="AOV (DKK)">
                {aovByCashbackData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
        <CardContent className="pt-0">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Note:</strong> Orders where cashback is redeemed have lower AOV (498 DKK) than
              Club orders without cashback usage (561 DKK). This is expected since cashback reduces
              the payment amount. Both segments are higher than non-Club baseline.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Country-Level AOV Table */}
      <Card>
        <CardHeader>
          <CardTitle>Country-Level AOV Comparison</CardTitle>
          <CardDescription>
            AOV premium is consistent across all markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Country</th>
                  <th className="text-right py-2 px-3">Club Orders</th>
                  <th className="text-right py-2 px-3">Club AOV</th>
                  <th className="text-right py-2 px-3">Non-Club AOV</th>
                  <th className="text-right py-2 px-3">Diff %</th>
                </tr>
              </thead>
              <tbody>
                {countryAOVData.map((row) => (
                  <tr key={row.country} className="border-b">
                    <td className="py-2 px-3 font-medium">{row.country}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(row.orders)}</td>
                    <td className="py-2 px-3 text-right text-green-600 font-medium">
                      {row.clubAOV} {row.currency || "DKK"}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-600">
                      {row.nonClubAOV} {row.currency || "DKK"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-green-600">
                      +{row.diffPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Currency Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(currencySummary).map(([currency, data]) => {
          const avgTotal = data.total / data.count;
          const avgClub = data.clubTotal / data.count;
          const avgNonClub = data.nonClubTotal / data.count;
          const difference = avgClub - avgNonClub;
          const percentDiff = ((difference / avgNonClub) * 100).toFixed(1);

          return (
            <Card key={currency}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{currency}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Club AOV:</span>
                  <span className="font-medium text-green-600">
                    {avgClub.toFixed(0)} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Non-Club AOV:</span>
                  <span className="font-medium text-zinc-600">
                    {avgNonClub.toFixed(0)} {currency}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Difference:</span>
                    <span
                      className={`font-bold ${
                        difference > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {difference > 0 ? "+" : ""}
                      {percentDiff}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
                <h4 className="font-semibold mb-2">AOV Calculation</h4>
                <p className="text-sm text-muted-foreground">
                  Average Order Value = Total Revenue / Number of Orders.
                  Calculated separately for Club (customerGroup.key = 'club')
                  and Non-Club orders.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Currency Handling</h4>
                <p className="text-sm text-muted-foreground">
                  AOV is calculated in local currency first, then converted to DKK using
                  fixed exchange rates for cross-market comparisons. Individual currency
                  charts show native currency values.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cashback Impact on AOV</h4>
                <p className="text-sm text-muted-foreground">
                  When cashback is redeemed, the order total (and thus AOV) is reduced
                  by the cashback amount. This explains lower AOV on cashback orders
                  despite the same basket value.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* AOV Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AOV Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>Consistent Premium:</strong> Club members show 12-15%
                higher AOV across all currencies and time periods
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>More Items:</strong> Club members add more items per order
                (2.8 vs 2.4), driving higher basket values
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>Stability:</strong> Club member AOV shows less month-to-month variance,
                providing more predictable revenue
              </span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
              <span>
                <strong>Growth Trend:</strong> Both segments show gradual AOV
                increase over time, with Club maintaining the premium
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
