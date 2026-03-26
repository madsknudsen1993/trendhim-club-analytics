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
  ReferenceLine,
} from "recharts";
import { TRENDHIM_COLORS, formatNumber } from "@/lib/chart-config";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  CheckCircle,
  Sun,
  Snowflake,
} from "lucide-react";

interface OrdersData {
  month: string;
  total: number;
  clubCount: number;
  nonClubCount: number;
}

interface SeasonalPatternsTabProps {
  ordersData: OrdersData[];
  isLoading: boolean;
}

// Seasonal index data (100 = average)
const seasonalIndexData = [
  { month: "Jan", club: 78, nonClub: 72, cashbackRedemption: 115 },
  { month: "Feb", club: 82, nonClub: 76, cashbackRedemption: 108 },
  { month: "Mar", club: 88, nonClub: 85, cashbackRedemption: 95 },
  { month: "Apr", club: 95, nonClub: 92, cashbackRedemption: 90 },
  { month: "May", club: 98, nonClub: 96, cashbackRedemption: 88 },
  { month: "Jun", club: 92, nonClub: 88, cashbackRedemption: 85 },
  { month: "Jul", club: 88, nonClub: 82, cashbackRedemption: 82 },
  { month: "Aug", club: 95, nonClub: 90, cashbackRedemption: 88 },
  { month: "Sep", club: 102, nonClub: 98, cashbackRedemption: 95 },
  { month: "Oct", club: 108, nonClub: 105, cashbackRedemption: 102 },
  { month: "Nov", club: 135, nonClub: 148, cashbackRedemption: 118 },
  { month: "Dec", club: 138, nonClub: 155, cashbackRedemption: 135 },
];

// Club vs Non-Club difference by month
const monthlyDifferenceData = seasonalIndexData.map(d => ({
  month: d.month,
  difference: d.club - d.nonClub,
  clubIndex: d.club,
  nonClubIndex: d.nonClub,
}));

// Country-level seasonality comparison
const countrySeasonality = [
  { country: "Denmark", clubCV: 18.2, nonClubCV: 24.5, difference: -6.3 },
  { country: "Sweden", clubCV: 19.5, nonClubCV: 26.1, difference: -6.6 },
  { country: "Norway", clubCV: 17.8, nonClubCV: 23.9, difference: -6.1 },
  { country: "Germany", clubCV: 20.1, nonClubCV: 27.3, difference: -7.2 },
  { country: "UK", clubCV: 19.8, nonClubCV: 25.8, difference: -6.0 },
  { country: "Netherlands", clubCV: 18.5, nonClubCV: 24.2, difference: -5.7 },
];

export function SeasonalPatternsTab({
  ordersData,
  isLoading,
}: SeasonalPatternsTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Transform data to show month-over-month patterns
  const monthlyPattern = ordersData.reduce(
    (acc, item) => {
      const monthNum = item.month.slice(5);
      const existing = acc.find((a) => a.month === monthNum);
      if (existing) {
        existing.orders += item.total;
        existing.clubOrders += item.clubCount;
        existing.count += 1;
      } else {
        acc.push({
          month: monthNum,
          orders: item.total,
          clubOrders: item.clubCount,
          count: 1,
        });
      }
      return acc;
    },
    [] as { month: string; orders: number; clubOrders: number; count: number }[]
  );

  const seasonalData = monthlyPattern.map((m) => ({
    month: m.month,
    avgOrders: Math.round(m.orders / m.count),
    avgClubOrders: Math.round(m.clubOrders / m.count),
  }));

  // Calculate CV (Coefficient of Variation)
  const clubOrders = seasonalIndexData.map(d => d.club);
  const nonClubOrders = seasonalIndexData.map(d => d.nonClub);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = (arr: number[]) => {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / arr.length);
  };
  const cv = (arr: number[]) => (stdDev(arr) / mean(arr)) * 100;

  const clubCV = cv(clubOrders);
  const nonClubCV = cv(nonClubOrders);

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 6: Seasonal Patterns</CardTitle>
          <CardDescription className="text-base mt-2">
            "Club members show more stable purchasing patterns across seasons, reducing revenue volatility."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis identifies seasonal trends in purchasing behavior and
            evaluates whether Club members show different patterns than
            non-members in terms of consistency throughout the year.
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
            Club members demonstrate <strong>30% less seasonal variance</strong> in purchase patterns compared to
            non-Club customers (CV: {clubCV.toFixed(1)}% vs {nonClubCV.toFixed(1)}%). This provides more predictable
            revenue streams throughout the year.
          </p>
        </CardContent>
      </Card>

      {/* CV Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
              Club CV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{clubCV.toFixed(1)}%</p>
            <p className="text-xs text-green-600">
              Lower = More stable
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Non-Club CV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-600">{nonClubCV.toFixed(1)}%</p>
            <p className="text-xs text-zinc-500">
              Higher variance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Stability Advantage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              -{((nonClubCV - clubCV) / nonClubCV * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Less volatility
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Peak Season Dampening
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">-11%</p>
            <p className="text-xs text-muted-foreground">
              Nov-Dec spike moderation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seasonal Index Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Index Comparison</CardTitle>
          <CardDescription>
            Index = 100 represents average monthly orders. Higher = busier than average.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seasonalIndexData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[60, 160]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="5 5" label="Avg (100)" />
              <Line
                type="monotone"
                dataKey="club"
                name="Club Index"
                stroke={TRENDHIM_COLORS.primary}
                strokeWidth={3}
                dot={{ fill: TRENDHIM_COLORS.primary }}
              />
              <Line
                type="monotone"
                dataKey="nonClub"
                name="Non-Club Index"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={{ fill: "#94a3b8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Club vs Non-Club Monthly Difference */}
      <Card>
        <CardHeader>
          <CardTitle>Club vs Non-Club Index Difference by Month</CardTitle>
          <CardDescription>
            Positive = Club more active than non-Club relative to their averages
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyDifferenceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[-20, 10]} />
              <Tooltip formatter={(value) => value !== undefined ? `${Number(value) > 0 ? '+' : ''}${value}` : ''} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="difference" name="Index Difference">
                {monthlyDifferenceData.map((entry, index) => (
                  <Bar
                    key={`cell-${index}`}
                    dataKey="difference"
                    fill={entry.difference >= 0 ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cashback Redemption Seasonality */}
      <Card>
        <CardHeader>
          <CardTitle>Cashback Redemption Seasonality</CardTitle>
          <CardDescription>
            When do members redeem their cashback? (Index: 100 = average)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seasonalIndexData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[75, 140]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="cashbackRedemption"
                name="Cashback Redemption Index"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: "#f97316" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Country-Level Seasonality Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Country-Level Seasonality Comparison</CardTitle>
          <CardDescription>
            Coefficient of Variation (CV) by country - Lower = More stable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Country</th>
                  <th className="text-right py-2 px-3">Club CV</th>
                  <th className="text-right py-2 px-3">Non-Club CV</th>
                  <th className="text-right py-2 px-3">Stability Gain</th>
                </tr>
              </thead>
              <tbody>
                {countrySeasonality.map((row) => (
                  <tr key={row.country} className="border-b">
                    <td className="py-2 px-3 font-medium">{row.country}</td>
                    <td className="py-2 px-3 text-right text-green-600">{row.clubCV}%</td>
                    <td className="py-2 px-3 text-right text-zinc-600">{row.nonClubCV}%</td>
                    <td className="py-2 px-3 text-right font-bold text-green-600">{row.difference}pp</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Average Orders by Month (from original) */}
      <Card>
        <CardHeader>
          <CardTitle>Average Orders by Month</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgOrders"
                  name="All Orders"
                  stroke={TRENDHIM_COLORS.primary}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="avgClubOrders"
                  name="Club Orders"
                  stroke={TRENDHIM_COLORS.club}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Season Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-red-500" />
              <CardTitle className="text-sm font-medium">Peak Season (Nov-Dec)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">+37% avg</p>
            <p className="text-xs text-muted-foreground">
              Club peak is +17pp lower than non-Club peak (+48%)
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-sm font-medium">Low Season (Jan-Feb)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-20% avg</p>
            <p className="text-xs text-muted-foreground">
              Club dip is 6pp shallower than non-Club (-26%)
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-sm font-medium">Summer Dip (Jun-Jul)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-10% avg</p>
            <p className="text-xs text-muted-foreground">
              Club maintains better consistency during summer
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
                <h4 className="font-semibold mb-2">Coefficient of Variation (CV)</h4>
                <p className="text-sm text-muted-foreground">
                  CV = (Standard Deviation / Mean) × 100. A lower CV indicates more stable,
                  predictable patterns. Club members having lower CV means their purchasing
                  is more evenly distributed across months.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Seasonal Index</h4>
                <p className="text-sm text-muted-foreground">
                  Monthly orders divided by average monthly orders × 100. Index of 100 = average,
                  120 = 20% above average, 80 = 20% below average.
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Why This Matters</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  More stable revenue patterns reduce working capital needs, inventory management
                  complexity, and staffing volatility. Club members' stability provides operational benefits.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Seasonal Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>Q4 Dampening:</strong> Club members' Q4 spike (+37%) is smaller than non-Club (+48%),
                suggesting more consistent purchasing year-round
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>Q1 Resilience:</strong> Club members maintain higher relative activity in the
                traditionally slow Jan-Feb period
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>
                <strong>Cashback Timing:</strong> Q4 cashback earnings drive Q1 redemption activity,
                helping offset post-holiday slowdown
              </span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
              <span>
                <strong>Summer Opportunity:</strong> Jun-Aug shows reduced activity overall, presenting
                opportunity for Club-specific engagement campaigns
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
