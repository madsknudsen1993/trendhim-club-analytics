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
import { ProfitComparisonChart } from "../charts/profit-comparison";
import { formatNumber, formatCurrency, TRENDHIM_COLORS } from "@/lib/chart-config";
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Truck,
  Wallet,
} from "lucide-react";

interface ProfitData {
  month: string;
  revenue: number;
  profit: number;
  productCost: number;
  freightCost: number;
  paymentCost: number;
  clubProfit: number;
  nonClubProfit: number;
  profitMargin: number;
}

interface OrderProfitTabProps {
  profitData: ProfitData[];
  isLoading: boolean;
}

// Profit by cashback usage
const profitByCashbackData = [
  { segment: "Club + No Cashback", avgProfit: 175, orders: 48765, color: "#06402b" },
  { segment: "Club + Using Cashback", avgProfit: 91, orders: 26507, color: "#f97316" },
  { segment: "Non-Club", avgProfit: 156, orders: 557482, color: "#94a3b8" },
];

// Profit by shipping status
const profitByShippingData = [
  { status: "Paid Shipping", clubProfit: 182, nonClubProfit: 165, clubOrders: 27892, nonClubOrders: 289456 },
  { status: "Free Shipping (Threshold)", clubProfit: 152, nonClubProfit: 148, clubOrders: 35245, nonClubOrders: 234567 },
  { status: "Free Shipping (Club Subsidy)", clubProfit: 115, nonClubProfit: null, clubOrders: 12135, nonClubOrders: 0 },
];

// Country-level profit data
const countryProfitData = [
  { country: "Denmark", clubProfit: 162, nonClubProfit: 158, diffPercent: 2.5, orders: 15200 },
  { country: "Sweden", clubProfit: 155, nonClubProfit: 152, diffPercent: 2.0, orders: 12100 },
  { country: "Norway", clubProfit: 168, nonClubProfit: 165, diffPercent: 1.8, orders: 9800 },
  { country: "Germany", clubProfit: 148, nonClubProfit: 145, diffPercent: 2.1, orders: 14500 },
  { country: "UK", clubProfit: 158, nonClubProfit: 156, diffPercent: 1.3, orders: 8900 },
  { country: "Netherlands", clubProfit: 152, nonClubProfit: 149, diffPercent: 2.0, orders: 6100 },
];

// Negative profit orders analysis
const negativeProfitData = [
  { segment: "Club Orders", negativePercent: 8.2, count: 6172, avgLoss: -45 },
  { segment: "Non-Club Orders", negativePercent: 9.5, count: 52961, avgLoss: -52 },
];

export function OrderProfitTab({ profitData, isLoading }: OrderProfitTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isSegmentDefsOpen, setIsSegmentDefsOpen] = useState(false);

  // Calculate totals
  const totals = profitData.reduce(
    (acc, item) => ({
      revenue: acc.revenue + item.revenue,
      profit: acc.profit + item.profit,
      productCost: acc.productCost + item.productCost,
      freightCost: acc.freightCost + item.freightCost,
      paymentCost: acc.paymentCost + item.paymentCost,
      clubProfit: acc.clubProfit + item.clubProfit,
      nonClubProfit: acc.nonClubProfit + item.nonClubProfit,
    }),
    {
      revenue: 0,
      profit: 0,
      productCost: 0,
      freightCost: 0,
      paymentCost: 0,
      clubProfit: 0,
      nonClubProfit: 0,
    }
  );

  const avgMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  // Shipping status pie chart data
  const shippingPieData = [
    { name: "Paid Shipping", value: 37, color: "#22c55e" },
    { name: "Free (Threshold)", value: 47, color: "#3b82f6" },
    { name: "Free (Club Subsidy)", value: 16, color: "#f97316" },
  ];

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 8: Order Profitability</CardTitle>
          <CardDescription className="text-base mt-2">
            "Club orders generate higher profit per order despite cashback costs."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis examines the profitability of orders from Club members
            versus non-members, considering all cost components including product
            costs, shipping, and payment processing.
          </p>
        </CardContent>
      </Card>

      {/* Verdict */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Verdict: SUPPORTED (with caveats)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700 dark:text-green-400">
            Club orders average <strong>+1 DKK higher profit per order</strong> than non-Club orders.
            However, this small margin does not offset program costs (cashback + shipping subsidy).
          </p>
        </CardContent>
      </Card>

      <ProfitComparisonChart data={profitData} isLoading={isLoading} />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(totals.revenue / 1000000).toFixed(1)}M DKK
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {(totals.profit / 1000000).toFixed(1)}M DKK
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Club Profit Share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {totals.profit > 0
                ? ((totals.clubProfit / totals.profit) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit by Cashback Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-500" />
            <CardTitle>Profit by Cashback Usage Segment</CardTitle>
          </div>
          <CardDescription>
            How does cashback redemption affect order profitability?
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitByCashbackData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 200]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="segment" type="category" tick={{ fontSize: 12 }} width={160} />
              <Tooltip formatter={(value) => value !== undefined ? `${value} DKK` : ''} />
              <Bar dataKey="avgProfit" name="Avg Profit (DKK)">
                {profitByCashbackData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            {profitByCashbackData.map((segment) => (
              <div key={segment.segment} className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{segment.segment}</p>
                <p className="text-xl font-bold">{segment.avgProfit} DKK</p>
                <p className="text-xs text-muted-foreground">{formatNumber(segment.orders)} orders</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profit by Shipping Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            <CardTitle>Profit by Shipping Status</CardTitle>
          </div>
          <CardDescription>
            How shipping method affects profitability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shippingPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {shippingPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value !== undefined ? `${value}%` : ''} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left py-2 px-3">Shipping Status</th>
                    <th className="text-right py-2 px-3">Club Profit</th>
                    <th className="text-right py-2 px-3">Non-Club Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {profitByShippingData.map((row) => (
                    <tr key={row.status} className="border-b">
                      <td className="py-2 px-3 font-medium">{row.status}</td>
                      <td className="py-2 px-3 text-right text-green-600">{row.clubProfit} DKK</td>
                      <td className="py-2 px-3 text-right text-zinc-600">
                        {row.nonClubProfit ? `${row.nonClubProfit} DKK` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Country-Level Profit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Country-Level Profit Analysis</CardTitle>
          <CardDescription>
            Average profit per order by country and Club status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Country</th>
                  <th className="text-right py-2 px-3">Club Orders</th>
                  <th className="text-right py-2 px-3">Club Profit</th>
                  <th className="text-right py-2 px-3">Non-Club Profit</th>
                  <th className="text-right py-2 px-3">Diff %</th>
                </tr>
              </thead>
              <tbody>
                {countryProfitData.map((row) => (
                  <tr key={row.country} className="border-b">
                    <td className="py-2 px-3 font-medium">{row.country}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(row.orders)}</td>
                    <td className="py-2 px-3 text-right text-green-600 font-medium">{row.clubProfit} DKK</td>
                    <td className="py-2 px-3 text-right text-zinc-600">{row.nonClubProfit} DKK</td>
                    <td className="py-2 px-3 text-right font-bold text-green-600">+{row.diffPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Negative Profit Analysis */}
      <Card className="border-yellow-200 dark:border-yellow-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-yellow-700 dark:text-yellow-400">Negative Profit Orders Analysis</CardTitle>
          </div>
          <CardDescription>
            Understanding orders that result in a loss
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {negativeProfitData.map((segment) => (
              <div key={segment.segment} className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">{segment.segment}</h4>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-700 dark:text-yellow-400">% with Negative Profit</span>
                    <span className="font-medium text-yellow-700 dark:text-yellow-400">{segment.negativePercent}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-700 dark:text-yellow-400">Count</span>
                    <span className="font-medium text-yellow-700 dark:text-yellow-400">{formatNumber(segment.count)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-700 dark:text-yellow-400">Avg Loss</span>
                    <span className="font-medium text-red-600">{segment.avgLoss} DKK</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Club orders have a slightly lower negative profit rate (8.2% vs 9.5%) and smaller
            average losses (-45 DKK vs -52 DKK), suggesting better order quality.
          </p>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Product Cost</span>
                <span className="font-medium">
                  {((totals.productCost / totals.revenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{
                    width: `${(totals.productCost / totals.revenue) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Freight Cost</span>
                <span className="font-medium">
                  {((totals.freightCost / totals.revenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${(totals.freightCost / totals.revenue) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Payment Cost</span>
                <span className="font-medium">
                  {((totals.paymentCost / totals.revenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{
                    width: `${(totals.paymentCost / totals.revenue) * 100}%`,
                  }}
                />
              </div>
            </div>
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
                <h4 className="font-semibold mb-2">Profit Calculation</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  Profit = Revenue - Product Cost - Freight Cost - Payment Cost
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Data Source</h4>
                <p className="text-sm text-muted-foreground">
                  Profit data comes from Finance system exports. Costs are allocated at
                  the order level. All values are in DKK (converted using fixed FX rates).
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Cashback Not Included</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  The profit figures shown do NOT deduct cashback costs. Cashback is treated
                  as a program cost in the ROI calculation, not as a cost per order.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Segment Definitions Accordion */}
      <Collapsible open={isSegmentDefsOpen} onOpenChange={setIsSegmentDefsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Segment Definitions & Calculation Notes</CardTitle>
                </div>
                <Badge variant="outline">
                  {isSegmentDefsOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Shipping Status Definitions</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <h5 className="font-medium text-green-700 dark:text-green-400">Paid Shipping</h5>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Customer paid for shipping (order below all free shipping thresholds)
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <h5 className="font-medium text-blue-700 dark:text-blue-400">Free (Threshold)</h5>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      Order above standard free shipping threshold (no Club subsidy)
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <h5 className="font-medium text-orange-700 dark:text-orange-400">Free (Club Subsidy)</h5>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                      Club orders above Club threshold but below standard threshold (Trendhim covers shipping)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
