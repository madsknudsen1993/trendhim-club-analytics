"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  BarChart3,
  Calculator,
  TrendingUp,
  ShoppingCart,
  Truck,
  Wallet,
  Users,
  HelpCircle,
  Calendar,
  Mail,
  ArrowRight,
  Sprout,
  Info,
} from "lucide-react";
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
} from "recharts";
import { CORE_METRICS } from "./data-source";

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

function formatCurrency(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M DKK`;
  }
  return `${formatNumber(num)} DKK`;
}

function formatDecimal(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('da-DK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
}

// Helper for MoM color grading: green >= +5%, red <= -5%
function getMoMColor(current: number, previous: number | null): string {
  if (previous === null || previous === 0) return "";
  const change = ((current - previous) / previous) * 100;
  if (change >= 5) return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300";
  if (change <= -5) return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300";
  return "";
}

function getMoMTextColor(current: number, previous: number | null): string {
  if (previous === null || previous === 0) return "";
  const change = ((current - previous) / previous) * 100;
  if (change >= 5) return "text-green-600 dark:text-green-400";
  if (change <= -5) return "text-red-600 dark:text-red-400";
  return "";
}

// ============================================================================
// DATA CONSTANTS - All metrics for the three segments
// ============================================================================

// Program-wide costs (10 months)
const COSTS = {
  cashbackRedeemed: CORE_METRICS.costs.cashbackRedeemed,
  shippingSubsidy: CORE_METRICS.costs.shippingSubsidy,
  totalProgramCosts: CORE_METRICS.costs.totalProgramCosts,
  avgCashbackPerOrder: CORE_METRICS.costs.avgCashbackPerOrder,
  cashbackOrderCount: CORE_METRICS.costs.cashbackOrderCount,
  shippingSubsidyOrderCount: CORE_METRICS.costs.shippingSubsidyOrderCount,
  avgShippingPerOrder: CORE_METRICS.costs.shippingSubsidy / CORE_METRICS.costs.shippingSubsidyOrderCount,
};

// Segment 1: Club Program ROI (Cross-sectional)
const CLUB_PROGRAM = {
  // Sample
  sampleDescription: "All Club orders in analysis period",
  clubOrders: CORE_METRICS.orders.club,
  totalClubMembers: CORE_METRICS.customers.totalClub,

  // Metrics
  clubAOV: CORE_METRICS.aov.club,
  nonClubAOV: CORE_METRICS.aov.nonClub,
  clubProfitPerOrder: CORE_METRICS.profit.clubAvgProfit,
  nonClubProfitPerOrder: CORE_METRICS.profit.nonClubAvgProfit,
  profitDifference: CORE_METRICS.profit.differenceDKK,

  // Frequency (cross-sectional)
  clubFrequency: CORE_METRICS.frequency.club,
  nonClubFrequency: CORE_METRICS.frequency.nonClub,
  frequencyDifferencePercent: CORE_METRICS.frequency.differencePercent,

  // Calculations
  incrementalProfit: CORE_METRICS.value.incrementalProfit,
  netValue: CORE_METRICS.value.netValue,
  roi: CORE_METRICS.value.roi,
};

// Segment 2: Best Customers (Robust Sample - 2+ orders before AND after)
const BEST_CUSTOMERS = {
  // Sample
  sampleSize: CORE_METRICS.orderHistory.robustSampleSize,
  sampleDescription: "2+ orders BEFORE and AFTER joining Club",
  criteria: "60+ days history in both periods",

  // Metrics - Before
  beforeFrequency: CORE_METRICS.orderHistory.before.frequency,
  beforeAOV: CORE_METRICS.orderHistory.before.avgOrderValue,
  beforeProfitPerOrder: CORE_METRICS.orderHistory.before.profitPerOrder,
  beforeMonthlyProfit: CORE_METRICS.orderHistory.before.monthlyProfit,

  // Metrics - After
  afterFrequency: CORE_METRICS.orderHistory.after.frequency,
  afterAOV: CORE_METRICS.orderHistory.after.avgOrderValue,
  afterProfitPerOrder: CORE_METRICS.orderHistory.after.profitPerOrder,
  afterMonthlyProfit: CORE_METRICS.orderHistory.after.monthlyProfit,

  // Changes
  frequencyChange: CORE_METRICS.orderHistory.changes.frequencyChange,
  aovChange: CORE_METRICS.orderHistory.changes.aovChange,
  profitPerOrderChange: CORE_METRICS.orderHistory.changes.profitPerOrderChange,
  monthlyProfitChange: CORE_METRICS.orderHistory.changes.monthlyProfitChange,
  incrementalMonthlyValue: CORE_METRICS.orderHistory.changes.incrementalMonthlyValue,

  // Order behavior (items per order & shipping)
  beforeItemsPerOrder: CORE_METRICS.orderHistory.orderBehavior.before.itemsPerOrder,
  afterItemsPerOrder: CORE_METRICS.orderHistory.orderBehavior.after.itemsPerOrder,
  itemsPerOrderChange: CORE_METRICS.orderHistory.orderBehavior.changes.itemsPerOrderPct,
  beforeShippingPerOrder: CORE_METRICS.orderHistory.orderBehavior.before.shippingPerOrder,
  afterShippingPerOrder: CORE_METRICS.orderHistory.orderBehavior.after.shippingPerOrder,
  shippingPerOrderChange: CORE_METRICS.orderHistory.orderBehavior.changes.shippingPerOrderPct,
};

// Segment 3: Medium Customers (Broader Sample - 1+ order before, 2+ after)
const MEDIUM_CUSTOMERS = {
  // Sample
  sampleSize: CORE_METRICS.orderHistory.broaderSample.sampleSize,
  sampleDescription: "1+ order BEFORE, 2+ orders AFTER joining",
  multiOrderBefore: CORE_METRICS.orderHistory.broaderSample.multiOrderBefore,
  singleOrderBefore: CORE_METRICS.orderHistory.broaderSample.singleOrderBefore,

  // Metrics - Before
  beforeFrequency: CORE_METRICS.orderHistory.broaderSample.before.frequency,
  beforeAOV: CORE_METRICS.orderHistory.broaderSample.before.avgOrderValue,
  beforeProfitPerOrder: CORE_METRICS.orderHistory.broaderSample.before.profitPerOrder,
  beforeMonthlyProfit: CORE_METRICS.orderHistory.broaderSample.before.monthlyProfit,

  // Metrics - After
  afterFrequency: CORE_METRICS.orderHistory.broaderSample.after.frequency,
  afterAOV: CORE_METRICS.orderHistory.broaderSample.after.avgOrderValue,
  afterProfitPerOrder: CORE_METRICS.orderHistory.broaderSample.after.profitPerOrder,
  afterMonthlyProfit: CORE_METRICS.orderHistory.broaderSample.after.monthlyProfit,

  // Changes
  frequencyChange: CORE_METRICS.orderHistory.broaderSample.changes.frequencyChange,
  aovChange: CORE_METRICS.orderHistory.broaderSample.changes.aovChange,
  profitPerOrderChange: CORE_METRICS.orderHistory.broaderSample.changes.profitPerOrderChange,
  monthlyProfitChange: CORE_METRICS.orderHistory.broaderSample.changes.monthlyProfitChange,
  incrementalMonthlyValue: CORE_METRICS.orderHistory.broaderSample.changes.incrementalMonthlyValue,

  // Order behavior (items per order & shipping)
  beforeItemsPerOrder: CORE_METRICS.orderHistory.broaderSample.orderBehavior.before.itemsPerOrder,
  afterItemsPerOrder: CORE_METRICS.orderHistory.broaderSample.orderBehavior.after.itemsPerOrder,
  itemsPerOrderChange: CORE_METRICS.orderHistory.broaderSample.orderBehavior.changes.itemsPerOrderPct,
  beforeShippingPerOrder: CORE_METRICS.orderHistory.broaderSample.orderBehavior.before.shippingPerOrder,
  afterShippingPerOrder: CORE_METRICS.orderHistory.broaderSample.orderBehavior.after.shippingPerOrder,
  shippingPerOrderChange: CORE_METRICS.orderHistory.broaderSample.orderBehavior.changes.shippingPerOrderPct,
};

// Segment 4: Fresh Customers (Period comparison - before/after Club launch)
const FRESH_CUSTOMERS = {
  // Sample info
  conversionWindow: CORE_METRICS.freshCustomers.conversionWindow,
  customerIdentifier: CORE_METRICS.freshCustomers.customerIdentifier,

  // Before period
  beforeLabel: CORE_METRICS.freshCustomers.beforePeriod.label,
  beforeNewCustomers: CORE_METRICS.freshCustomers.beforePeriod.newCustomers,
  beforeConverted: CORE_METRICS.freshCustomers.beforePeriod.converted60d,
  beforeConversionRate: CORE_METRICS.freshCustomers.beforePeriod.conversionRate,
  beforeAvgDays: CORE_METRICS.freshCustomers.beforePeriod.avgDaysToSecond,
  beforeMedianDays: CORE_METRICS.freshCustomers.beforePeriod.medianDaysToSecond,
  beforeAvgProfit: CORE_METRICS.freshCustomers.beforePeriod.avgSecondOrderProfit,

  // After period
  afterLabel: CORE_METRICS.freshCustomers.afterPeriod.label,
  afterNewCustomers: CORE_METRICS.freshCustomers.afterPeriod.newCustomers,
  afterConverted: CORE_METRICS.freshCustomers.afterPeriod.converted60d,
  afterConversionRate: CORE_METRICS.freshCustomers.afterPeriod.conversionRate,
  afterAvgDays: CORE_METRICS.freshCustomers.afterPeriod.avgDaysToSecond,
  afterMedianDays: CORE_METRICS.freshCustomers.afterPeriod.medianDaysToSecond,
  afterAvgProfit: CORE_METRICS.freshCustomers.afterPeriod.avgSecondOrderProfit,

  // Impact
  rateLiftPP: CORE_METRICS.freshCustomers.impact.rateLiftPP,
  monthlyNewCustomers: CORE_METRICS.freshCustomers.impact.monthlyNewCustomers,
  extraConversionsPerMonth: CORE_METRICS.freshCustomers.impact.extraConversionsPerMonth,
  profitPerConversion: CORE_METRICS.freshCustomers.impact.profitPerConversion,
  monthlyValue: CORE_METRICS.freshCustomers.impact.monthlyValue,

  // Validation
  avgDaysValidation: CORE_METRICS.freshCustomers.avgDaysValidation,
  note: CORE_METRICS.freshCustomers.note,
};

// Program constants
const PROGRAM = {
  analysisPeriod: "April 2025 - January 2026",
  monthsAnalyzed: 10,
  totalClubMembers: CORE_METRICS.customers.totalClub,
  membersWithCashback: CORE_METRICS.cashbackSegments.hasBalance.count,
  membersWithCashbackPercent: CORE_METRICS.cashbackSegments.hasBalance.percentage,
};

// Per-member costs (monthly)
const MONTHLY_COST_PER_MEMBER = COSTS.totalProgramCosts / PROGRAM.monthsAnalyzed / PROGRAM.totalClubMembers;

// Channel Attribution Data (summary for executive view)
const CHANNEL_DATA = [
  { channel: "Email", clubPct: 39.8, nonClubPct: 3.6, diff: 36.2 },
  { channel: "Untracked", clubPct: 26.0, nonClubPct: 26.6, diff: -0.6 },
  { channel: "Paid Search - Brand", clubPct: 11.0, nonClubPct: 8.3, diff: 2.7 },
  { channel: "Paid Search - Generic", clubPct: 11.5, nonClubPct: 34.5, diff: -23.0 },
  { channel: "Search - Organic", clubPct: 4.9, nonClubPct: 7.1, diff: -2.2 },
  { channel: "Direct", clubPct: 3.1, nonClubPct: 8.6, diff: -5.5 },
];

// Before vs After Club channel shift (9,161 customers longitudinal)
const CHANNEL_SHIFT = [
  { channel: "Paid Search - Brand", shift: 5.8, direction: "up" },
  { channel: "Email", shift: -3.9, direction: "down" },
  { channel: "Paid Search - Generic", shift: -2.1, direction: "down" },
];

export function ExecutiveSummaryTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-[#06402b] to-[#0a5c3e] text-white border-0">
        <CardContent className="py-8 px-6">
          <div className="text-center space-y-4">
            <Badge className="bg-white/20 text-white border-0 text-sm px-4 py-1">
              Executive Summary
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold">
              Trendhim Club: The Business Case
            </h1>
            <p className="text-green-100 max-w-2xl mx-auto">
              Four customer segments analyzed with complete cost breakdown
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Program Context - Compact Banner */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Analysis Period</p>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="font-semibold">{PROGRAM.analysisPeriod}</p>
          <p className="text-[10px] text-muted-foreground mt-1">10 months of Club data</p>
        </div>
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Club Members</p>
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="font-semibold">{formatNumber(PROGRAM.totalClubMembers)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Unique customers with 1+ Club order</p>
        </div>
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Monthly Cashback</p>
            <Wallet className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="font-semibold">~{formatCurrency(CORE_METRICS.monthlyCosts.monthlyCashbackRedeemed)}</p>
          <p className="text-[10px] text-green-600">Already in profit figures</p>
          <div className="mt-1 p-1.5 bg-white dark:bg-zinc-900 rounded text-[9px] text-muted-foreground">
            {formatCurrency(CORE_METRICS.costs.cashbackRedeemed)} total ÷ 10 mo<br/>
            = {formatNumber(CORE_METRICS.costs.cashbackOrderCount)} orders × {formatNumber(CORE_METRICS.costs.avgCashbackPerOrder)} DKK avg
          </div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-red-600">Monthly Shipping Cost</p>
            <Truck className="h-4 w-4 text-red-500" />
          </div>
          <p className="font-semibold text-red-600">~{formatCurrency(CORE_METRICS.monthlyCosts.monthlyShippingSubsidy)}</p>
          <p className="text-[10px] text-red-500">Actual incremental cost</p>
          <div className="mt-1 p-1.5 bg-white dark:bg-red-900/20 rounded text-[9px] text-red-600">
            {formatCurrency(CORE_METRICS.costs.shippingSubsidy)} total ÷ 10 mo<br/>
            = {formatNumber(CORE_METRICS.costs.shippingSubsidyOrderCount)} orders × ~{formatNumber(Math.round(CORE_METRICS.costs.shippingSubsidy / CORE_METRICS.costs.shippingSubsidyOrderCount))} DKK avg
          </div>
        </div>
      </div>

      {/* Four Segments Analysis */}
      <Card className="border-2 border-amber-500">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <CardTitle>Four Customer Segments Compared</CardTitle>
          </div>
          <CardDescription>
            Complete breakdown of metrics, costs, and ROI for each segment. All explanations are visible text (PDF format).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/*
            ALIGNED GRID LAYOUT
            Each segment has 4 rows with fixed min-heights:
            - Row 1: Sample Definition (min-h-[180px])
            - Row 2: Metrics Table (min-h-[200px])
            - Row 3: Value Calculation (min-h-[180px])
            - Row 4: Result + Note (min-h-[140px])
          */}
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">

            {/* ============================================================ */}
            {/* SEGMENT 1: Club Program ROI (Cross-sectional) */}
            {/* ============================================================ */}
            <div className="border-2 border-red-400 rounded-lg overflow-hidden flex flex-col">
              {/* Header - Fixed height */}
              <div className="bg-red-500 text-white p-4 min-h-[80px]">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Club Program ROI</h3>
                </div>
                <p className="text-red-100 text-sm mt-1">Cross-sectional comparison (10-month totals)</p>
              </div>

              <div className="p-4 space-y-4 bg-red-50/30 dark:bg-red-950/10 flex-1 flex flex-col">
                {/* ROW 1: Sample Definition */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-sm">Sample Definition</span>
                  </div>
                  <p className="text-sm font-medium">Comparing ALL Club orders vs ALL Non-Club orders</p>
                  <p className="text-xs text-muted-foreground mt-1">Analysis period: {PROGRAM.analysisPeriod}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                      <span className="text-red-700 dark:text-red-400">Club Orders</span>
                      <p className="font-mono font-bold text-red-700">{formatNumber(CLUB_PROGRAM.clubOrders)}</p>
                      <p className="text-[10px] text-red-600">Orders after joining Club</p>
                    </div>
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                      <span className="text-muted-foreground">Non-Club Orders</span>
                      <p className="font-mono font-bold">{formatNumber(CORE_METRICS.orders.nonClub)}</p>
                      <p className="text-[10px] text-muted-foreground">All other orders</p>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Metrics Table */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-sm">Club vs Non-Club Comparison</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1.5 text-left text-muted-foreground">Metric</th>
                        <th className="py-1.5 text-right text-muted-foreground">Club</th>
                        <th className="py-1.5 text-right text-muted-foreground">Non-Club</th>
                        <th className="py-1.5 text-right text-muted-foreground">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5">AOV (DKK)</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.clubAOV}</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.nonClubAOV}</td>
                        <td className="py-1.5 text-right font-mono text-red-600">{CORE_METRICS.aov.differenceDKK}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">Profit/Order (DKK)</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.clubProfitPerOrder}</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.nonClubProfitPerOrder}</td>
                        <td className="py-1.5 text-right font-mono text-red-600">{CLUB_PROGRAM.profitDifference}</td>
                      </tr>
                      <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                        <td className="py-1.5 text-green-700">Frequency</td>
                        <td className="py-1.5 text-right font-mono text-green-700">{CLUB_PROGRAM.clubFrequency}</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.nonClubFrequency}</td>
                        <td className="py-1.5 text-right font-mono text-green-600">+{CLUB_PROGRAM.frequencyDifferencePercent}%</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2 p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded text-[10px]">
                    <span className="text-blue-600">MEDIAN values. Club profit lower due to cashback.</span>
                  </div>
                </div>

                {/* ROW 3: Value Calculation */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-sm">Value Calculation</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">① Profit Diff/Order</span>
                        <span className="font-mono text-red-600">{CLUB_PROGRAM.profitDifference} DKK</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Club {CLUB_PROGRAM.clubProfitPerOrder} − Non-Club {CLUB_PROGRAM.nonClubProfitPerOrder} DKK</p>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-red-700">② × Total Orders</span>
                        <span className="font-mono font-bold text-red-600">{formatCurrency(CLUB_PROGRAM.incrementalProfit)}</span>
                      </div>
                      <p className="text-[10px] text-red-600 mt-0.5">{CLUB_PROGRAM.profitDifference} DKK × {formatNumber(CLUB_PROGRAM.clubOrders)} Club orders</p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-[10px] text-green-600">
                      ✓ Cashback & shipping already reflected in profit figures
                    </div>
                  </div>
                </div>

                {/* ROW 4: Result + Note */}
                <div className="mt-auto space-y-2">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 text-center">
                    <p className="text-xs text-red-700">Net Value (10 months)</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(CLUB_PROGRAM.netValue)}</p>
                  </div>
                  <div className="p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded text-[10px] text-muted-foreground">
                    <strong>Limitation:</strong> Cross-sectional analysis. Does NOT track same customers over time.
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 2: Best Customers (Robust Sample) */}
            {/* ============================================================ */}
            <div className="border-2 border-green-400 rounded-lg overflow-hidden flex flex-col">
              {/* Header - Fixed height */}
              <div className="bg-green-500 text-white p-4 min-h-[80px]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Best Customers</h3>
                </div>
                <p className="text-green-100 text-sm mt-1">Highly engaged repeat buyers (monthly metrics)</p>
              </div>

              <div className="p-4 space-y-4 bg-green-50/30 dark:bg-green-950/10 flex-1 flex flex-col">
                {/* ROW 1: Sample Definition */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-sm">Sample Definition</span>
                  </div>
                  <p className="text-sm font-medium">Same customers tracked before AND after joining</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                      <span className="text-muted-foreground">Before Joining</span>
                      <p className="font-medium">2+ orders</p>
                      <p className="text-[10px] text-muted-foreground">60+ days history</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                      <span className="text-green-700">After Joining</span>
                      <p className="font-medium text-green-700">2+ orders</p>
                      <p className="text-[10px] text-green-600">60+ days history</p>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-center">
                    <span className="text-xs text-green-700">Sample: </span>
                    <span className="font-mono font-bold text-green-700">{formatNumber(BEST_CUSTOMERS.sampleSize)} members</span>
                  </div>
                </div>

                {/* ROW 2: Metrics Table */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-sm">Monthly Metrics</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1 text-left text-muted-foreground">Metric</th>
                        <th className="py-1 text-right text-muted-foreground">Before</th>
                        <th className="py-1 text-right text-muted-foreground">After</th>
                        <th className="py-1 text-right text-muted-foreground">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-purple-50/50 dark:bg-purple-950/20">
                        <td className="py-1 text-purple-700">Items/Order</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.beforeItemsPerOrder.toFixed(2)}</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.afterItemsPerOrder.toFixed(2)}</td>
                        <td className="py-1 text-right font-mono text-purple-600">{BEST_CUSTOMERS.itemsPerOrderChange}%</td>
                      </tr>
                      <tr className="border-b bg-purple-50/50 dark:bg-purple-950/20">
                        <td className="py-1 text-purple-700">Shipping/Order</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.beforeShippingPerOrder.toFixed(0)} DKK</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.afterShippingPerOrder.toFixed(0)} DKK</td>
                        <td className="py-1 text-right font-mono text-purple-600">+{BEST_CUSTOMERS.shippingPerOrderChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Frequency</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.beforeFrequency.toFixed(3)}</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.afterFrequency.toFixed(3)}</td>
                        <td className="py-1 text-right font-mono text-green-600">+{BEST_CUSTOMERS.frequencyChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">AOV</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.beforeAOV.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.afterAOV.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono text-red-600">{BEST_CUSTOMERS.aovChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Profit/Order</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.beforeProfitPerOrder.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.afterProfitPerOrder.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono text-red-600">{BEST_CUSTOMERS.profitPerOrderChange}%</td>
                      </tr>
                      <tr className="bg-green-50 dark:bg-green-950/30">
                        <td className="py-1 font-medium">Monthly Profit</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.beforeMonthlyProfit.toFixed(1)}</td>
                        <td className="py-1 text-right font-mono">{BEST_CUSTOMERS.afterMonthlyProfit.toFixed(1)}</td>
                        <td className="py-1 text-right font-mono font-bold text-green-600">+{BEST_CUSTOMERS.monthlyProfitChange}%</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2 p-1.5 bg-blue-50/50 dark:bg-blue-950/20 rounded text-[10px] text-blue-600">
                    Monthly Profit = Frequency × Profit/Order
                  </div>
                </div>

                {/* ROW 3: Measured Result */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-sm">Measured Monthly Uplift</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Profit Before</span>
                        <span className="font-mono">{BEST_CUSTOMERS.beforeMonthlyProfit.toFixed(1)} DKK</span>
                      </div>
                    </div>
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Profit After</span>
                        <span className="font-mono">{BEST_CUSTOMERS.afterMonthlyProfit.toFixed(1)} DKK</span>
                      </div>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded border border-green-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-green-700">Monthly Uplift per Customer</span>
                        <span className="font-mono font-bold text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK</span>
                      </div>
                      <p className="text-[10px] text-green-600 mt-0.5">{BEST_CUSTOMERS.afterMonthlyProfit.toFixed(1)} − {BEST_CUSTOMERS.beforeMonthlyProfit.toFixed(1)} DKK</p>
                    </div>
                  </div>
                </div>

                {/* ROW 4: Result + Note */}
                <div className="mt-auto space-y-2">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 text-center">
                    <p className="text-xs text-green-700">Monthly Uplift per Customer</p>
                    <p className="text-2xl font-bold text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</p>
                    <p className="text-[10px] text-green-600 mt-1">Sample: {formatNumber(BEST_CUSTOMERS.sampleSize)} customers</p>
                  </div>
                  <div className="p-2 bg-green-100/50 dark:bg-green-900/20 rounded text-[10px] text-muted-foreground">
                    <strong>Strength:</strong> Longitudinal analysis proves causal behavior change.
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 3: Medium Customers (Broader Sample) - NOW POSITIVE! */}
            {/* ============================================================ */}
            <div className="border-2 border-teal-400 rounded-lg overflow-hidden flex flex-col">
              {/* Header - Fixed height */}
              <div className="bg-teal-500 text-white p-4 min-h-[80px]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Medium Customers</h3>
                </div>
                <p className="text-teal-100 text-sm mt-1">Broader sample incl. one-time buyers (monthly)</p>
              </div>

              <div className="p-4 space-y-4 bg-teal-50/30 dark:bg-teal-950/10 flex-1 flex flex-col">
                {/* ROW 1: Sample Definition */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-teal-500" />
                    <span className="font-semibold text-sm">Sample Definition</span>
                  </div>
                  <p className="text-sm font-medium">Same customers tracked before AND after joining</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                      <span className="text-muted-foreground">Before Joining</span>
                      <p className="font-medium">1+ orders</p>
                      <p className="text-[10px] text-muted-foreground">Any history</p>
                    </div>
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded">
                      <span className="text-teal-700">After Joining</span>
                      <p className="font-medium text-teal-700">2+ orders</p>
                      <p className="text-[10px] text-teal-600">60+ days history</p>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-teal-100 dark:bg-teal-900/30 rounded text-center">
                    <span className="text-xs text-teal-700">Sample: </span>
                    <span className="font-mono font-bold text-teal-700">{formatNumber(MEDIUM_CUSTOMERS.sampleSize)} members</span>
                  </div>
                </div>

                {/* ROW 2: Metrics Table */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-teal-500" />
                    <span className="font-semibold text-sm">Monthly Metrics</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1 text-left text-muted-foreground">Metric</th>
                        <th className="py-1 text-right text-muted-foreground">Before</th>
                        <th className="py-1 text-right text-muted-foreground">After</th>
                        <th className="py-1 text-right text-muted-foreground">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-purple-50/50 dark:bg-purple-950/20">
                        <td className="py-1 text-purple-700">Items/Order</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.beforeItemsPerOrder.toFixed(2)}</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.afterItemsPerOrder.toFixed(2)}</td>
                        <td className="py-1 text-right font-mono text-purple-600">{MEDIUM_CUSTOMERS.itemsPerOrderChange}%</td>
                      </tr>
                      <tr className="border-b bg-purple-50/50 dark:bg-purple-950/20">
                        <td className="py-1 text-purple-700">Shipping/Order</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.beforeShippingPerOrder.toFixed(0)} DKK</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.afterShippingPerOrder.toFixed(0)} DKK</td>
                        <td className="py-1 text-right font-mono text-purple-600">+{MEDIUM_CUSTOMERS.shippingPerOrderChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Frequency</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.beforeFrequency.toFixed(3)}</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.afterFrequency.toFixed(3)}</td>
                        <td className="py-1 text-right font-mono text-green-600">+{MEDIUM_CUSTOMERS.frequencyChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">AOV</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.beforeAOV.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.afterAOV.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.aovChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Profit/Order</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.beforeProfitPerOrder.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.afterProfitPerOrder.toFixed(0)}</td>
                        <td className="py-1 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.profitPerOrderChange}%</td>
                      </tr>
                      <tr className="bg-green-50 dark:bg-green-950/30">
                        <td className="py-1 font-medium">Monthly Profit</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.beforeMonthlyProfit.toFixed(1)}</td>
                        <td className="py-1 text-right font-mono">{MEDIUM_CUSTOMERS.afterMonthlyProfit.toFixed(1)}</td>
                        <td className="py-1 text-right font-mono font-bold text-green-600">+{MEDIUM_CUSTOMERS.monthlyProfitChange}%</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2 p-1.5 bg-blue-50/50 dark:bg-blue-950/20 rounded text-[10px] text-blue-600">
                    Monthly Profit = Frequency × Profit/Order
                  </div>
                </div>

                {/* ROW 3: Measured Result */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-teal-500" />
                    <span className="font-semibold text-sm">Measured Monthly Uplift</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Profit Before</span>
                        <span className="font-mono">{MEDIUM_CUSTOMERS.beforeMonthlyProfit.toFixed(1)} DKK</span>
                      </div>
                    </div>
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Profit After</span>
                        <span className="font-mono">{MEDIUM_CUSTOMERS.afterMonthlyProfit.toFixed(1)} DKK</span>
                      </div>
                    </div>
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded border border-teal-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-teal-700">Monthly Uplift per Customer</span>
                        <span className="font-mono font-bold text-teal-600">+{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK</span>
                      </div>
                      <p className="text-[10px] text-teal-600 mt-0.5">{MEDIUM_CUSTOMERS.afterMonthlyProfit.toFixed(1)} − {MEDIUM_CUSTOMERS.beforeMonthlyProfit.toFixed(1)} DKK</p>
                    </div>
                  </div>
                </div>

                {/* ROW 4: Result + Note */}
                <div className="mt-auto space-y-2">
                  <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg border border-teal-300 text-center">
                    <p className="text-xs text-teal-700">Monthly Uplift per Customer</p>
                    <p className="text-2xl font-bold text-teal-600">+{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</p>
                    <p className="text-[10px] text-teal-600 mt-1">Sample: {formatNumber(MEDIUM_CUSTOMERS.sampleSize)} customers</p>
                  </div>
                  <div className="p-2 bg-teal-100/50 dark:bg-teal-900/20 rounded text-[10px] text-teal-700">
                    <strong>Why so positive?</strong> This sample includes many one-time buyers (38%) who became repeat customers after joining Club. The +{MEDIUM_CUSTOMERS.frequencyChange}% frequency lift reflects strong customer activation.
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 4: Fresh Customers (Period Comparison) */}
            {/* ============================================================ */}
            <div className="border-2 border-blue-400 rounded-lg overflow-hidden flex flex-col">
              {/* Header - Fixed height */}
              <div className="bg-blue-500 text-white p-4 min-h-[80px]">
                <div className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Fresh Customers</h3>
                </div>
                <p className="text-blue-100 text-sm mt-1">1st → 2nd order conversion (period comparison)</p>
              </div>

              <div className="p-4 space-y-4 bg-blue-50/30 dark:bg-blue-950/10 flex-1 flex flex-col">
                {/* ROW 1: Sample Definition */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">Sample Definition</span>
                  </div>
                  <p className="text-sm font-medium">ALL customers placing their first-ever order</p>
                  <p className="text-xs text-muted-foreground">Success = 2nd order within {FRESH_CUSTOMERS.conversionWindow} days</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                      <span className="text-muted-foreground">Before Club</span>
                      <p className="font-mono font-bold text-[10px]">{FRESH_CUSTOMERS.beforeLabel}</p>
                      <p className="text-[10px] text-muted-foreground">{formatNumber(FRESH_CUSTOMERS.beforeNewCustomers)} new</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <span className="text-blue-700">After Club</span>
                      <p className="font-mono font-bold text-blue-700 text-[10px]">{FRESH_CUSTOMERS.afterLabel}</p>
                      <p className="text-[10px] text-blue-600">{formatNumber(FRESH_CUSTOMERS.afterNewCustomers)} new</p>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Metrics Table */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">Conversion Metrics</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1 text-left text-muted-foreground">Metric</th>
                        <th className="py-1 text-right text-muted-foreground">Before</th>
                        <th className="py-1 text-right text-muted-foreground">After</th>
                        <th className="py-1 text-right text-muted-foreground">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1">Converted (60d)</td>
                        <td className="py-1 text-right font-mono">{formatNumber(FRESH_CUSTOMERS.beforeConverted)}</td>
                        <td className="py-1 text-right font-mono">{formatNumber(FRESH_CUSTOMERS.afterConverted)}</td>
                        <td className="py-1 text-right font-mono">-</td>
                      </tr>
                      <tr className="border-b bg-amber-50 dark:bg-amber-950/30">
                        <td className="py-1 font-medium">Conv. Rate</td>
                        <td className="py-1 text-right font-mono">{FRESH_CUSTOMERS.beforeConversionRate}%</td>
                        <td className="py-1 text-right font-mono">{FRESH_CUSTOMERS.afterConversionRate}%</td>
                        <td className="py-1 text-right font-mono font-bold text-amber-600">{FRESH_CUSTOMERS.rateLiftPP}pp</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Avg Days</td>
                        <td className="py-1 text-right font-mono">{FRESH_CUSTOMERS.beforeAvgDays}</td>
                        <td className="py-1 text-right font-mono">{FRESH_CUSTOMERS.afterAvgDays}</td>
                        <td className="py-1 text-right font-mono text-green-600">+0.00</td>
                      </tr>
                      <tr>
                        <td className="py-1">Median Days</td>
                        <td className="py-1 text-right font-mono">{FRESH_CUSTOMERS.beforeMedianDays}</td>
                        <td className="py-1 text-right font-mono">{FRESH_CUSTOMERS.afterMedianDays}</td>
                        <td className="py-1 text-right font-mono text-green-600">-1</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2 p-1.5 bg-green-50/50 dark:bg-green-950/20 rounded text-[10px] text-green-600">
                    Avg days validated: diff only +0.003 days
                  </div>
                </div>

                {/* ROW 3: Value Calculation */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">Value Calculation</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">① Rate Change</span>
                        <span className="font-mono text-amber-600">{FRESH_CUSTOMERS.rateLiftPP} pp</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{FRESH_CUSTOMERS.afterConversionRate}% − {FRESH_CUSTOMERS.beforeConversionRate}% = {FRESH_CUSTOMERS.rateLiftPP}pp</p>
                    </div>
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">② New Customers/mo</span>
                        <span className="font-mono">{formatNumber(FRESH_CUSTOMERS.monthlyNewCustomers)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatNumber(FRESH_CUSTOMERS.afterNewCustomers)} ÷ 10 months</p>
                    </div>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-amber-700">③ Lost Conversions</span>
                        <span className="font-mono font-bold text-amber-600">{formatNumber(FRESH_CUSTOMERS.extraConversionsPerMonth)}/mo</span>
                      </div>
                      <p className="text-[10px] text-amber-600 mt-0.5">{FRESH_CUSTOMERS.rateLiftPP}% × {formatNumber(FRESH_CUSTOMERS.monthlyNewCustomers)} = {formatNumber(FRESH_CUSTOMERS.extraConversionsPerMonth)} fewer 2nd orders</p>
                    </div>
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">④ Profit per 2nd Order</span>
                        <span className="font-mono">{formatNumber(FRESH_CUSTOMERS.profitPerConversion)} DKK</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Avg profit from 2nd orders (after period, {formatNumber(FRESH_CUSTOMERS.afterConverted)} orders)</p>
                    </div>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-amber-700">⑤ Monthly Value</span>
                        <span className="font-mono font-bold text-amber-600">{formatCurrency(FRESH_CUSTOMERS.monthlyValue)}/mo</span>
                      </div>
                      <p className="text-[10px] text-amber-600 mt-0.5">{formatNumber(FRESH_CUSTOMERS.extraConversionsPerMonth)} lost × {formatNumber(FRESH_CUSTOMERS.profitPerConversion)} DKK profit</p>
                    </div>
                  </div>
                </div>

                {/* ROW 4: Result + Note */}
                <div className="mt-auto space-y-2">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 text-center">
                    <p className="text-xs text-amber-700">Est. Monthly Value</p>
                    <p className="text-2xl font-bold text-amber-600">{FRESH_CUSTOMERS.monthlyValue >= 0 ? '+' : ''}{formatCurrency(FRESH_CUSTOMERS.monthlyValue)}</p>
                  </div>
                  <div className="p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded text-[10px] text-muted-foreground">
                    <strong>Note:</strong> ALL customers (Club + Non-Club). May reflect market trends.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* BOTTOM LINE - MEASURED MONTHLY PERFORMANCE */}
          {/* ================================================================ */}
          <div className="mt-6 p-6 bg-gradient-to-br from-zinc-100 to-zinc-50 rounded-xl border-2 border-zinc-300">
            <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-zinc-800">
              <Target className="h-6 w-6 text-green-600" />
              Bottom Line: Measured Monthly Performance
            </h4>

            {/* Monthly Uplift Summary - 2 columns */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-700">Best Customers</p>
                </div>
                <p className="text-3xl font-bold text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</p>
                <p className="text-sm text-green-600 mt-1">per customer</p>
                <div className="mt-3 pt-3 border-t border-green-200 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Sample size:</span>
                    <span className="font-mono">{formatNumber(BEST_CUSTOMERS.sampleSize)} customers</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency lift:</span>
                    <span className="font-mono text-green-600">+{BEST_CUSTOMERS.frequencyChange}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly profit lift:</span>
                    <span className="font-mono text-green-600">+{BEST_CUSTOMERS.monthlyProfitChange}%</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-teal-50 rounded-lg border-2 border-teal-300">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  <p className="font-semibold text-teal-700">Medium Customers</p>
                </div>
                <p className="text-3xl font-bold text-teal-600">+{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</p>
                <p className="text-sm text-teal-600 mt-1">per customer</p>
                <div className="mt-3 pt-3 border-t border-teal-200 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Sample size:</span>
                    <span className="font-mono">{formatNumber(MEDIUM_CUSTOMERS.sampleSize)} customers</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency lift:</span>
                    <span className="font-mono text-teal-600">+{MEDIUM_CUSTOMERS.frequencyChange}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly profit lift:</span>
                    <span className="font-mono text-teal-600">+{MEDIUM_CUSTOMERS.monthlyProfitChange}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Why We Don't Extrapolate */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 mb-2">Why We Report Per-Customer Metrics</p>
                  <p className="text-sm text-blue-700">
                    The monthly uplift values above are <strong>measured from actual customers</strong> tracked before and after joining the Club.
                    We avoid extrapolating to all {formatNumber(PROGRAM.totalClubMembers)} members because we cannot reliably know how many will behave like the measured samples.
                  </p>
                  <div className="mt-2 text-xs text-blue-600">
                    <strong>Best Customers:</strong> {formatNumber(BEST_CUSTOMERS.sampleSize)} with 2+ orders both periods<br/>
                    <strong>Medium Customers:</strong> {formatNumber(MEDIUM_CUSTOMERS.sampleSize)} with 1+ before, 2+ after
                  </div>
                </div>
              </div>
            </div>

            {/* Program Cost Context */}
            <div className="p-4 bg-zinc-100 rounded-lg border border-zinc-200 mb-6">
              <p className="font-medium text-zinc-800 mb-2">Program Cost Context</p>
              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly shipping subsidy:</span>
                  <span className="font-mono text-red-600">~{formatCurrency(CORE_METRICS.monthlyCosts.monthlyShippingSubsidy)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per Club order:</span>
                  <span className="font-mono">~{formatNumber(Math.round(CORE_METRICS.costs.shippingSubsidy / CORE_METRICS.costs.shippingSubsidyOrderCount))} DKK</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Cashback is already reflected in profit figures (reduces order revenue when redeemed).
              </p>
            </div>

            {/* Actionable Recommendations */}
            <h5 className="font-semibold text-lg mb-3 flex items-center gap-2 text-zinc-800">
              <ArrowRight className="h-5 w-5 text-green-600" />
              Recommended Actions
            </h5>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                <p className="font-medium text-green-700 mb-1">1. Increase Engaged Member %</p>
                <p className="text-xs text-zinc-600">Currently {PROGRAM.membersWithCashbackPercent}% have cashback balance. Target: 50%+. More engaged = more Best Customer behavior.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                <p className="font-medium text-green-700 mb-1">2. Activate Ghost Members</p>
                <p className="text-xs text-zinc-600">{formatNumber(PROGRAM.totalClubMembers - PROGRAM.membersWithCashback)} members have zero balance. Re-engagement campaign to convert them.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                <p className="font-medium text-green-700 mb-1">3. Improve Fresh Customer Conversion</p>
                <p className="text-xs text-zinc-600">1st→2nd order rate dropped 0.85pp. Fix this to recover lost conversions.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                <p className="font-medium text-green-700 mb-1">4. Track Cohorts Monthly</p>
                <p className="text-xs text-zinc-600">Set up monthly cohort tracking to measure actual member behavior over time.</p>
              </div>
            </div>

            {/* Final Verdict */}
            <div className="mt-6 p-4 bg-green-100 rounded-lg border-2 border-green-300">
              <p className="text-sm text-zinc-800">
                <strong className="text-green-700">Verdict:</strong> Both measured segments show positive monthly uplift:
                <strong className="text-green-700"> +{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</strong> (Best Customers) and
                <strong className="text-teal-700"> +{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</strong> (Medium Customers) per customer.
                The Club drives measurable behavior change with frequency lifts of <strong>+{BEST_CUSTOMERS.frequencyChange}%</strong> and <strong>+{MEDIUM_CUSTOMERS.frequencyChange}%</strong> respectively.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* MARKETING CHANNEL ATTRIBUTION */}
      {/* ================================================================ */}
      <Card className="border-t-4 border-t-purple-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-500" />
            <CardTitle>Marketing Channel Attribution</CardTitle>
          </div>
          <CardDescription>
            How Club members are acquired differently from Non-Club customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Finding */}
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-green-700 dark:text-green-400 text-lg">Email is 11x More Effective for Club</h4>
                <p className="text-green-700 dark:text-green-400 mt-1">
                  <strong>39.8%</strong> of Club orders come from Email vs only <strong>3.6%</strong> for Non-Club.
                  This +36.2pp difference shows Club members are highly responsive to email marketing.
                </p>
              </div>
            </div>
          </div>

          {/* Channel Comparison Chart */}
          <div>
            <h4 className="font-semibold mb-3">Club vs Non-Club Order Attribution by Channel</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={CHANNEL_DATA}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 45]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="channel" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="clubPct" name="Club %" fill="#22c55e" />
                  <Bar dataKey="nonClubPct" name="Non-Club %" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Insights Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">39.8%</div>
              <div className="text-sm text-green-700">Club orders from Email</div>
              <div className="text-xs text-muted-foreground mt-1">vs 3.6% Non-Club</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">+5.8pp</div>
              <div className="text-sm text-blue-700">Paid Search Brand shift</div>
              <div className="text-xs text-muted-foreground mt-1">After joining Club</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200">
              <div className="text-2xl font-bold text-amber-600">-23pp</div>
              <div className="text-sm text-amber-700">Less Paid Search Generic</div>
              <div className="text-xs text-muted-foreground mt-1">Club vs Non-Club</div>
            </div>
          </div>

          {/* Longitudinal Insight */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Channel Shift After Joining Club (9,161 customers)
            </h4>
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">+5.8%</span>
                <span className="text-purple-700">Paid Search Brand</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-bold">-3.9%</span>
                <span className="text-purple-700">Email (still #1 at 40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-bold">-2.1%</span>
                <span className="text-purple-700">Paid Search Generic</span>
              </div>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              After joining Club, customers shift from generic discovery to brand-aware channels, indicating stronger brand recognition.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* MONTHLY CLUB METRICS BREAKDOWN */}
      {/* ================================================================ */}
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <CardTitle>Monthly Club Metrics Breakdown</CardTitle>
          </div>
          <CardDescription>
            These numbers are following the Trendhim Club monthly KPIs defined by the CRM team in Trendhim when launching the club.
            <br />
            <span className="text-xs">Detailed monthly breakdown of all Club program metrics with MoM changes</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="text-left p-2 border border-zinc-300 dark:border-zinc-600 sticky left-0 bg-zinc-100 dark:bg-zinc-800 min-w-[140px]">Metric</th>
                  {CORE_METRICS.monthlyBreakdown.map((row) => (
                    <th key={row.month} className="text-right p-2 border border-zinc-300 dark:border-zinc-600 min-w-[85px]">
                      {row.month}
                    </th>
                  ))}
                  <th className="text-right p-2 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 min-w-[85px]">Overall</th>
                </tr>
              </thead>
              <tbody>
                {/* Total Club Orders */}
                <tr>
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium sticky left-0 bg-white dark:bg-zinc-900">Total Club Orders</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].totalClubOrders : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.totalClubOrders, prev)}`}>
                        {formatNumber(row.totalClubOrders)}
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {formatNumber(CORE_METRICS.orders.club)}
                  </td>
                </tr>
                {/* Cashback Order Count */}
                <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium sticky left-0 bg-zinc-50 dark:bg-zinc-900/50">Cashback Order Count</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].cashbackOrderCount : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.cashbackOrderCount, prev)}`}>
                        {formatNumber(row.cashbackOrderCount)}
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {formatNumber(CORE_METRICS.cashback.recordsWithCashback)}
                  </td>
                </tr>
                {/* Total Cashback (DKK) */}
                <tr>
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium sticky left-0 bg-white dark:bg-zinc-900">Total Cashback (DKK)</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].totalCashbackDKK : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.totalCashbackDKK, prev)}`}>
                        {formatNumber(row.totalCashbackDKK)} DKK
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {formatNumber(CORE_METRICS.cashback.totalCashbackAmount)} DKK
                  </td>
                </tr>
                {/* Avg Cashback (DKK) */}
                <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium sticky left-0 bg-zinc-50 dark:bg-zinc-900/50">Avg Cashback (DKK)</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].avgCashbackDKK : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.avgCashbackDKK, prev)}`}>
                        {row.avgCashbackDKK} DKK
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {CORE_METRICS.cashback.avgCashbackPerRecord} DKK
                  </td>
                </tr>
                {/* AOV - All Club (Median) */}
                <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium text-blue-700 dark:text-blue-400 sticky left-0 bg-blue-50/50 dark:bg-blue-950/20">AOV - All Club (Median)</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].aovAllClub : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold ${getMoMColor(row.aovAllClub, prev)}`}>
                        {row.aovAllClub} DKK
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {CORE_METRICS.aov.club} DKK
                  </td>
                </tr>
                {/* AOV - With CB (Median) */}
                <tr className="bg-orange-50/50 dark:bg-orange-950/20">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium text-orange-700 dark:text-orange-400 sticky left-0 bg-orange-50/50 dark:bg-orange-950/20">AOV - With CB (Median)</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].aovWithCB : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.aovWithCB, prev)}`}>
                        {row.aovWithCB} DKK
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                    -
                  </td>
                </tr>
                {/* AOV - Without CB (Median) */}
                <tr className="bg-green-50/50 dark:bg-green-950/20">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium text-green-700 dark:text-green-400 sticky left-0 bg-green-50/50 dark:bg-green-950/20">AOV - Without CB (Median)</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].aovWithoutCB : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.aovWithoutCB, prev)}`}>
                        {row.aovWithoutCB} DKK
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                    -
                  </td>
                </tr>
                {/* Avg Profit - All Club (Median) */}
                <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium text-blue-700 dark:text-blue-400 sticky left-0 bg-blue-50/50 dark:bg-blue-950/20">Avg Profit - All Club (Median)</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].avgProfitAllClub : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold ${getMoMColor(row.avgProfitAllClub, prev)}`}>
                        {row.avgProfitAllClub} DKK
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {CORE_METRICS.profit.clubAvgProfit} DKK
                  </td>
                </tr>
                {/* Avg Profit - CB Orders (Median) */}
                <tr className="bg-orange-50/50 dark:bg-orange-950/20">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium text-orange-700 dark:text-orange-400 sticky left-0 bg-orange-50/50 dark:bg-orange-950/20">Avg Profit - CB Orders (Median)</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].avgProfitCBOrders : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.avgProfitCBOrders, prev)}`}>
                        {row.avgProfitCBOrders} DKK
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                    -
                  </td>
                </tr>
                {/* Shipping: PAID */}
                <tr>
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium sticky left-0 bg-white dark:bg-zinc-900">Shipping: PAID</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].shippingPaid : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.shippingPaid, prev)}`}>
                        {formatNumber(row.shippingPaid)}
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {formatNumber(CORE_METRICS.monthlyBreakdown.reduce((sum, r) => sum + r.shippingPaid, 0))}
                  </td>
                </tr>
                {/* Shipping: PAID W CB */}
                <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium sticky left-0 bg-zinc-50 dark:bg-zinc-900/50">Shipping: PAID+CB</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].shippingPaidWithCB : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.shippingPaidWithCB, prev)}`}>
                        {formatNumber(row.shippingPaidWithCB)}
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {formatNumber(CORE_METRICS.monthlyBreakdown.reduce((sum, r) => sum + r.shippingPaidWithCB, 0))}
                  </td>
                </tr>
                {/* Shipping: FREE */}
                <tr className="bg-green-50/50 dark:bg-green-950/20">
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 font-medium text-green-700 dark:text-green-400 sticky left-0 bg-green-50/50 dark:bg-green-950/20">Shipping: FREE</td>
                  {CORE_METRICS.monthlyBreakdown.map((row, idx) => {
                    const prev = idx > 0 ? CORE_METRICS.monthlyBreakdown[idx - 1].shippingFree : null;
                    return (
                      <td key={row.month} className={`p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono ${getMoMColor(row.shippingFree, prev)}`}>
                        {formatNumber(row.shippingFree)}
                      </td>
                    );
                  })}
                  <td className="p-2 border border-zinc-300 dark:border-zinc-600 text-right font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                    {formatNumber(CORE_METRICS.monthlyBreakdown.reduce((sum, r) => sum + r.shippingFree, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-green-100 dark:bg-green-900/40 border border-green-300 rounded"></span>
              <span className="text-green-700 dark:text-green-400">Green: MoM +5% or more</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-red-100 dark:bg-red-900/40 border border-red-300 rounded"></span>
              <span className="text-red-700 dark:text-red-400">Red: MoM -5% or more</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* CORE METRICS REFERENCE - Simple Overview */}
      {/* ================================================================ */}
      <Card className="border-t-4 border-t-zinc-400">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-zinc-600" />
            <CardTitle>Core Metrics Reference</CardTitle>
          </div>
          <CardDescription>
            Key definitions and metrics used across all analyses. Source: Data Source tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* 1. Conservative Club Order Definition */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              1. Conservative Club Order Definition
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b">Approach</th>
                    <th className="text-left p-2 border-b">Definition</th>
                    <th className="text-right p-2 border-b">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50/50 dark:bg-green-950/20">
                    <td className="p-2 border-b font-medium text-green-700">Conservative (Used)</td>
                    <td className="p-2 border-b text-green-700">Orders from verified cashback file customers placed AFTER their club join date</td>
                    <td className="p-2 border-b text-right font-mono font-bold text-green-700">{formatNumber(CORE_METRICS.orders.club)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-b font-medium text-muted-foreground">Simple (Not Used)</td>
                    <td className="p-2 border-b text-muted-foreground">All orders where customerGroup.key = 'club'</td>
                    <td className="p-2 border-b text-right font-mono text-muted-foreground">{formatNumber(CORE_METRICS.orders.clubSimple)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Analysis Period:</strong> {CORE_METRICS.analysisPeriod.label} ({CORE_METRICS.analysisPeriod.months} months)
            </p>
          </div>

          {/* 2. Core Order & Customer Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              2. Core Order & Customer Metrics
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border-b">Orders</th>
                      <th className="text-right p-2 border-b">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 border-b">Total Orders</td><td className="p-2 border-b text-right font-mono">{formatNumber(CORE_METRICS.orders.total)}</td></tr>
                    <tr className="bg-green-50/50 dark:bg-green-950/20"><td className="p-2 border-b text-green-700">Club Orders</td><td className="p-2 border-b text-right font-mono text-green-700">{formatNumber(CORE_METRICS.orders.club)} ({CORE_METRICS.orders.clubPercentage}%)</td></tr>
                    <tr><td className="p-2 border-b">Non-Club Orders</td><td className="p-2 border-b text-right font-mono">{formatNumber(CORE_METRICS.orders.nonClub)} ({CORE_METRICS.orders.nonClubPercentage}%)</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border-b">Customers</th>
                      <th className="text-right p-2 border-b">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 border-b">Total Unique</td><td className="p-2 border-b text-right font-mono">{formatNumber(CORE_METRICS.customers.totalUnique)}</td></tr>
                    <tr className="bg-green-50/50 dark:bg-green-950/20"><td className="p-2 border-b text-green-700">Club Members</td><td className="p-2 border-b text-right font-mono text-green-700">{formatNumber(CORE_METRICS.customers.totalClub)} ({CORE_METRICS.customers.clubPercentage}%)</td></tr>
                    <tr className="bg-amber-50/50 dark:bg-amber-950/20"><td className="p-2 border-b text-amber-700 dark:text-amber-400 pl-4">↳ Engaged (CB balance &gt; 0)</td><td className="p-2 border-b text-right font-mono text-amber-700 dark:text-amber-400">{formatNumber(CORE_METRICS.customers.customersWithCashback)} ({((CORE_METRICS.customers.customersWithCashback / CORE_METRICS.customers.totalClub) * 100).toFixed(1)}%)</td></tr>
                    <tr><td className="p-2 border-b">Never-Club</td><td className="p-2 border-b text-right font-mono">{formatNumber(CORE_METRICS.customers.neverClub)} ({CORE_METRICS.customers.neverClubPercentage}%)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. Profit & AOV Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              3. Profit & AOV Metrics
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b">Metric</th>
                    <th className="text-right p-2 border-b">Club</th>
                    <th className="text-right p-2 border-b">Non-Club</th>
                    <th className="text-right p-2 border-b">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border-b font-medium">Average Order Value</td>
                    <td className="p-2 border-b text-right font-mono">{CORE_METRICS.aov.club} DKK</td>
                    <td className="p-2 border-b text-right font-mono">{CORE_METRICS.aov.nonClub} DKK</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{CORE_METRICS.aov.differenceDKK} DKK (+{CORE_METRICS.aov.differencePercent}%)</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-b font-medium">Avg Profit per Order</td>
                    <td className="p-2 border-b text-right font-mono">{CORE_METRICS.profit.clubAvgProfit} DKK</td>
                    <td className="p-2 border-b text-right font-mono">{CORE_METRICS.profit.nonClubAvgProfit} DKK</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{CORE_METRICS.profit.differenceDKK} DKK</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-b font-medium">Purchase Frequency</td>
                    <td className="p-2 border-b text-right font-mono">{CORE_METRICS.frequency.club} orders/cust</td>
                    <td className="p-2 border-b text-right font-mono">{CORE_METRICS.frequency.nonClub} orders/cust</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{CORE_METRICS.frequency.differencePercent}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Longitudinal Analysis: Best Customers vs Medium Customers */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              4. Longitudinal Analysis: Before vs After Club
            </h4>
            <p className="text-xs text-muted-foreground">
              Tracks the <strong>same customers</strong> before AND after joining Club to prove causal behavior change.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b">Sample</th>
                    <th className="text-right p-2 border-b">Size</th>
                    <th className="text-left p-2 border-b">Criteria</th>
                    <th className="text-right p-2 border-b">Freq Change</th>
                    <th className="text-right p-2 border-b">Monthly Profit Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50/50 dark:bg-green-950/20">
                    <td className="p-2 border-b font-medium text-green-700">Best Customers</td>
                    <td className="p-2 border-b text-right font-mono">{formatNumber(BEST_CUSTOMERS.sampleSize)}</td>
                    <td className="p-2 border-b text-xs">{BEST_CUSTOMERS.sampleDescription}</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{BEST_CUSTOMERS.frequencyChange}%</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{BEST_CUSTOMERS.monthlyProfitChange}%</td>
                  </tr>
                  <tr className="bg-teal-50/50 dark:bg-teal-950/20">
                    <td className="p-2 border-b font-medium text-teal-700">Medium Customers</td>
                    <td className="p-2 border-b text-right font-mono">{formatNumber(MEDIUM_CUSTOMERS.sampleSize)}</td>
                    <td className="p-2 border-b text-xs">{MEDIUM_CUSTOMERS.sampleDescription}</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{MEDIUM_CUSTOMERS.frequencyChange}%</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{MEDIUM_CUSTOMERS.monthlyProfitChange}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid gap-2 md:grid-cols-2 text-xs">
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200">
                <strong className="text-green-700">Best Customers:</strong> <span className="text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/member/month</span>
              </div>
              <div className="p-2 bg-teal-50 dark:bg-teal-950/30 rounded border border-teal-200">
                <strong className="text-teal-700">Medium Customers:</strong> <span className="text-green-600">+{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/member/month</span>
              </div>
            </div>
          </div>

          {/* 5. Club Member Cashback Segments */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-orange-500" />
              5. Club Member Cashback Segments
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b">Segment</th>
                    <th className="text-right p-2 border-b">Count</th>
                    <th className="text-right p-2 border-b">Share</th>
                    <th className="text-left p-2 border-b">Definition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50/50 dark:bg-green-950/20">
                    <td className="p-2 border-b font-medium text-green-700">Has Cashback Balance &gt; 0</td>
                    <td className="p-2 border-b text-right font-mono text-green-700">{formatNumber(CORE_METRICS.cashbackSegments.hasBalance.count)}</td>
                    <td className="p-2 border-b text-right font-mono text-green-700">{CORE_METRICS.cashbackSegments.hasBalance.percentage}%</td>
                    <td className="p-2 border-b text-xs text-green-600">Actively engaged - has earned cashback</td>
                  </tr>
                  <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                    <td className="p-2 border-b font-medium text-amber-700">Zero Balance</td>
                    <td className="p-2 border-b text-right font-mono text-amber-700">{formatNumber(CORE_METRICS.cashbackSegments.zeroBalance.count)}</td>
                    <td className="p-2 border-b text-right font-mono text-amber-700">{CORE_METRICS.cashbackSegments.zeroBalance.percentage}%</td>
                    <td className="p-2 border-b text-xs text-amber-600">Redeemed OR never earned (ambiguous)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Total Club Members</td>
                    <td className="p-2 text-right font-mono font-bold">{formatNumber(CORE_METRICS.customers.totalClub)}</td>
                    <td className="p-2 text-right font-mono">100%</td>
                    <td className="p-2 text-xs">All members in cashback file</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Segment bar */}
            <div className="h-6 flex rounded-lg overflow-hidden">
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${CORE_METRICS.cashbackSegments.hasBalance.percentage}%` }}
              >
                {CORE_METRICS.cashbackSegments.hasBalance.percentage}%
              </div>
              <div
                className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${CORE_METRICS.cashbackSegments.zeroBalance.percentage}%` }}
              >
                {CORE_METRICS.cashbackSegments.zeroBalance.percentage}%
              </div>
            </div>
          </div>

          {/* 6. Key Definitions */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-zinc-500" />
              6. Key Definitions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b w-1/4">Term</th>
                    <th className="text-left p-2 border-b">Definition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border-b font-medium">Club Order</td><td className="p-2 border-b text-muted-foreground">Order where customerGroup.key = 'club'</td></tr>
                  <tr><td className="p-2 border-b font-medium">Club Join Date</td><td className="p-2 border-b text-muted-foreground">MIN(createdAt) of orders where customerGroup.key = 'club' per customer</td></tr>
                  <tr><td className="p-2 border-b font-medium">Before Club</td><td className="p-2 border-b text-muted-foreground">Orders from Club customers placed BEFORE their join date</td></tr>
                  <tr><td className="p-2 border-b font-medium">After Club</td><td className="p-2 border-b text-muted-foreground">Orders from Club customers placed ON or AFTER their join date</td></tr>
                  <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                    <td className="p-2 border-b font-medium text-blue-700">Frequency</td>
                    <td className="p-2 border-b">
                      <span className="text-blue-700 font-medium">Orders per customer per month = Total Orders ÷ Customer-Months</span>
                      <p className="text-xs text-blue-600 mt-1">
                        Example: {formatNumber(CORE_METRICS.orderHistory.after.totalOrders)} orders ÷ {formatNumber(CORE_METRICS.orderHistory.after.totalCustomerMonths)} customer-months = {CORE_METRICS.orderHistory.after.frequency.toFixed(3)} orders/customer/month
                      </p>
                    </td>
                  </tr>
                  <tr><td className="p-2 border-b font-medium">Monthly Profit</td><td className="p-2 border-b text-muted-foreground">Frequency × Profit per Order = profit per member per month</td></tr>
                  <tr><td className="p-2 font-medium">Conversion Rate (Fresh)</td><td className="p-2 text-muted-foreground">% of new customers placing 2nd order within 60 days</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
