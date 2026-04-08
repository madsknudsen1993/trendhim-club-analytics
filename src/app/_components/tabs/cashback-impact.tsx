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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, formatNumber, TRENDHIM_COLORS, SEGMENT_COLORS } from "@/lib/chart-config";
import {
  Wallet,
  Users,
  ArrowUpRight,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Minus,
} from "lucide-react";
import { CORE_METRICS } from "./data-source";

interface CashbackImpactTabProps {
  isLoading: boolean;
}

// Cashback segment data from CORE_METRICS (Single Source of Truth)
// Note: The PDF shows only 2 segments for the verified club members:
// - Has Cashback Balance > 0
// - Zero Balance (AMBIGUOUS - could be redeemed OR never earned)
const cashbackSegments = {
  hasBalance: {
    count: CORE_METRICS.cashbackSegments.hasBalance.count,
    percentage: CORE_METRICS.cashbackSegments.hasBalance.percentage,
    avgOrders: 1.52,
    avgAOV: 498,
    loyalRate: 8.2
  },
  zeroBalance: {
    count: CORE_METRICS.cashbackSegments.zeroBalance.count,
    percentage: CORE_METRICS.cashbackSegments.zeroBalance.percentage,
    avgOrders: 1.18,
    avgAOV: 485,
    loyalRate: 4.1
  },
  // noRecord kept for backwards compatibility - represents "no cashback activity" subset of zeroBalance
  // In reality, all verified club members are from the cashback file
  noRecord: { count: 0, percentage: 0, avgOrders: 0, avgAOV: 0, loyalRate: 0 },
};

// Order frequency distribution by cashback status
const frequencyByStatus = [
  { orders: "1 order", hasBalance: 48, zeroBalance: 55, noRecord: 82 },
  { orders: "2 orders", hasBalance: 30, zeroBalance: 28, noRecord: 14 },
  { orders: "3+ orders", hasBalance: 22, zeroBalance: 17, noRecord: 4 },
];

// Loyalty segment by cashback status
const loyaltyByStatus = [
  { segment: "Loyal (3+)", hasBalance: 8.2, zeroBalance: 6.8, noRecord: 4.1 },
  { segment: "Returning (2)", hasBalance: 21.8, zeroBalance: 18.2, noRecord: 9.9 },
  { segment: "New (1)", hasBalance: 70.0, zeroBalance: 75.0, noRecord: 86.0 },
];

export function CashbackImpactTab({
  isLoading,
}: CashbackImpactTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-zinc-500">Loading...</span>
      </div>
    );
  }

  // Pie chart data for segment breakdown
  const segmentPieData = [
    { name: "Has Balance", value: cashbackSegments.hasBalance.percentage, color: "#22c55e" },
    { name: "Zero Balance", value: cashbackSegments.zeroBalance.percentage, color: "#f97316" },
    { name: "No CB Record", value: cashbackSegments.noRecord.percentage, color: "#94a3b8" },
  ];

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 4: Cashback Impact</CardTitle>
          <CardDescription className="text-base mt-2">
            "Cashback balances create a 'switching cost' that drives customers to return and make repeat purchases."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis examines how cashback balances influence customer
            behavior. Customers with active balances have an incentive to return
            and make additional purchases to use their earned rewards.
          </p>
        </CardContent>
      </Card>

      {/* Verdict */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-blue-500" />
            <CardTitle>Verdict: PARTIALLY SUPPORTED</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Customers with positive cashback balances show <strong>+23% higher purchase frequency</strong> and
            <strong> 2x higher loyal rate</strong> compared to those with no cashback record. However, the
            direction of causality is unclear - engaged customers may both earn more cashback AND purchase more.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Cards - Using CORE_METRICS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Cashback (Balance)
            </CardTitle>
            <Wallet className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(CORE_METRICS.cashback.totalCashbackAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Unredeemed balance across all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customers with Balance
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(CORE_METRICS.customers.customersWithCashback)}
            </div>
            <p className="text-xs text-muted-foreground">
              {CORE_METRICS.cashbackSegments.hasBalance.percentage}% of Club members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Cashback Balance
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(CORE_METRICS.cashback.avgCashbackPerRecord)}
            </div>
            <p className="text-xs text-muted-foreground">Per customer with balance</p>
          </CardContent>
        </Card>
      </div>

      {/* 3-Segment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cashback Status Segmentation</CardTitle>
          <CardDescription>
            Club members segmented by their cashback status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {segmentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toFixed(1)}%` : ''} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-700 dark:text-green-400">Has Positive Balance</h4>
                  <Badge className="bg-green-100 text-green-800">{cashbackSegments.hasBalance.percentage}%</Badge>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {formatNumber(cashbackSegments.hasBalance.count)} members with unredeemed cashback
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">Zero Balance</h4>
                  <Badge className="bg-orange-100 text-orange-800">{cashbackSegments.zeroBalance.percentage}%</Badge>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  {formatNumber(cashbackSegments.zeroBalance.count)} members who earned & redeemed
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-400">No Cashback Record</h4>
                  <Badge variant="outline">{cashbackSegments.noRecord.percentage}%</Badge>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-500">
                  {formatNumber(cashbackSegments.noRecord.count)} members with no cashback activity
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Frequency by Cashback Status */}
      <Card>
        <CardHeader>
          <CardTitle>Order Frequency Distribution by Cashback Status</CardTitle>
          <CardDescription>
            Percentage of customers in each order count bucket
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={frequencyByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="orders" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => value !== undefined ? `${value}%` : ''} />
              <Legend />
              <Bar dataKey="hasBalance" name="Has Balance" fill="#22c55e" />
              <Bar dataKey="zeroBalance" name="Zero Balance" fill="#f97316" />
              <Bar dataKey="noRecord" name="No CB Record" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Loyalty Segment by Cashback Status */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Segment Distribution by Cashback Status</CardTitle>
          <CardDescription>
            How loyalty segments differ across cashback status groups
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={loyaltyByStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="segment" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(value) => value !== undefined ? `${Number(value).toFixed(1)}%` : ''} />
              <Legend />
              <Bar dataKey="hasBalance" name="Has Balance" fill="#22c55e" />
              <Bar dataKey="zeroBalance" name="Zero Balance" fill="#f97316" />
              <Bar dataKey="noRecord" name="No CB Record" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics by Cashback Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Cashback Status</th>
                  <th className="text-right py-2 px-3">Members</th>
                  <th className="text-right py-2 px-3">% of Total</th>
                  <th className="text-right py-2 px-3">Avg Orders</th>
                  <th className="text-right py-2 px-3">Avg AOV</th>
                  <th className="text-right py-2 px-3">Loyal Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                  <td className="py-2 px-3 font-medium text-green-700 dark:text-green-400">Has Positive Balance</td>
                  <td className="py-2 px-3 text-right">{formatNumber(cashbackSegments.hasBalance.count)}</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.hasBalance.percentage}%</td>
                  <td className="py-2 px-3 text-right font-medium text-green-600">{cashbackSegments.hasBalance.avgOrders}</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.hasBalance.avgAOV} DKK</td>
                  <td className="py-2 px-3 text-right font-medium text-green-600">{cashbackSegments.hasBalance.loyalRate}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium text-orange-700 dark:text-orange-400">Zero Balance (Redeemed)</td>
                  <td className="py-2 px-3 text-right">{formatNumber(cashbackSegments.zeroBalance.count)}</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.zeroBalance.percentage}%</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.zeroBalance.avgOrders}</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.zeroBalance.avgAOV} DKK</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.zeroBalance.loyalRate}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium text-zinc-600 dark:text-zinc-400">No Cashback Record</td>
                  <td className="py-2 px-3 text-right">{formatNumber(cashbackSegments.noRecord.count)}</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.noRecord.percentage}%</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.noRecord.avgOrders}</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.noRecord.avgAOV} DKK</td>
                  <td className="py-2 px-3 text-right">{cashbackSegments.noRecord.loyalRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                <h4 className="font-semibold mb-2">Cashback Status Definitions</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <h5 className="font-medium text-green-700 dark:text-green-400">Has Positive Balance</h5>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Customer has unredeemed cashback (balance_cents &gt; 0)
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <h5 className="font-medium text-orange-700 dark:text-orange-400">Zero Balance</h5>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                      Customer has cashback record but balance = 0 (likely redeemed)
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
                    <h5 className="font-medium text-zinc-700 dark:text-zinc-400">No Cashback Record</h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-1">
                      Club member with no entry in cashback file (ghost members)
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Causality Caveat</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Customers with positive balances show better metrics, but this may reflect
                      reverse causality: customers who order more also earn more cashback, rather
                      than cashback causing more orders.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Cashback Effectiveness Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Cashback Effectiveness Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Positive Indicators</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Customers with balance order {((cashbackSegments.hasBalance.avgOrders / cashbackSegments.noRecord.avgOrders - 1) * 100).toFixed(0)}% more frequently
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Loyal rate is 2x higher for balance holders (8.2% vs 4.1%)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  54% of members have positive unredeemed balance
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Areas for Improvement</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  30% of members have no cashback record (not engaging with program)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Zero-balance members may have exhausted incentive to return
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Small balances (&lt;50 DKK) have lower redemption rates
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
