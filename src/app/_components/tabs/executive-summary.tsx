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

// Segment 2: Best Customers (Segment-Isolated - ONLY Club members)
// Source: scripts/segment_pnl_isolated.py
// Filter: Club members with 2+ orders AND 60+ days span in BOTH periods
const BEST_CUSTOMERS = {
  // Sample
  sampleSize: 4589,
  sampleDescription: "2+ orders BEFORE and AFTER joining Club",
  criteria: "60+ days history in both periods, Club members only",

  // Metrics - Before
  beforeFrequency: 0.179,
  beforeAOV: 500.54,
  beforeProfitPerOrder: 243.83,
  beforeMonthlyProfit: 43.71,

  // Metrics - After
  afterFrequency: 0.291,
  afterAOV: 452.32,
  afterProfitPerOrder: 218.83,
  afterMonthlyProfit: 63.63,

  // Changes
  frequencyChange: 62.2,
  aovChange: -9.6,
  profitPerOrderChange: -10.3,
  monthlyProfitChange: 45.6,
  incrementalMonthlyValue: 19.92,

  // Order behavior (items per order & shipping)
  beforeItemsPerOrder: 2.34,
  afterItemsPerOrder: 2.25,
  itemsPerOrderChange: -0.09,
  beforeShippingPerOrder: 22.49,
  afterShippingPerOrder: 22.25,
  shippingPerOrderChange: -0.24,
  beforeFreeShippingPct: 36.4,
  afterFreeShippingPct: 37.4,
  freeShippingChangePP: 1.0,

  // Cashback metrics
  cbUsageRateBefore: 0,
  cbUsageRateAfter: 9.0,
  cbUsageChangePP: 9.0,
  medianCbPerOrder: 73.55,

  // Shipping Cost Calculation (Subsidy Zone Only: 199-449 DKK)
  subsidyZoneOrders: 6910,
  freeRateInZoneBefore: 31.9,
  freeRateInZoneAfter: 37.4,
  incrementalFreeRatePP: 5.5,
  incrementalFreeOrders: 382,
  avgShippingFee: 39,
  totalShippingCost: 14898,
  shippingCostPerCustomer: 3.25,
  monthlyShippingCostPerCustomer: 0.30,

  // Net Value Per Customer
  netValuePerCustomer: 19.62,
};

// Segment 3: Medium Customers (Segment-Isolated - ONLY Club members)
// Source: scripts/segment_pnl_isolated.py
// Filter: Club members with 1+ order before, 2+ orders AND 60+ days after
const MEDIUM_CUSTOMERS = {
  // Sample
  sampleSize: 4664,
  sampleDescription: "1+ order BEFORE, 2+ orders AFTER joining",
  multiOrderBefore: 0,
  singleOrderBefore: 0,

  // Metrics - Before
  beforeFrequency: 0.049,
  beforeAOV: 464.78,
  beforeProfitPerOrder: 232.38,
  beforeMonthlyProfit: 11.42,

  // Metrics - After
  afterFrequency: 0.248,
  afterAOV: 443.70,
  afterProfitPerOrder: 217.77,
  afterMonthlyProfit: 53.91,

  // Changes
  frequencyChange: 403.8,
  aovChange: -4.5,
  profitPerOrderChange: -6.3,
  monthlyProfitChange: 372.2,
  incrementalMonthlyValue: 42.49,

  // Order behavior (items per order & shipping)
  beforeItemsPerOrder: 2.10,
  afterItemsPerOrder: 2.11,
  itemsPerOrderChange: 0.01,
  beforeShippingPerOrder: 22.52,
  afterShippingPerOrder: 22.19,
  shippingPerOrderChange: -0.33,
  beforeFreeShippingPct: 35.4,
  afterFreeShippingPct: 37.2,
  freeShippingChangePP: 1.8,

  // Cashback metrics
  cbUsageRateBefore: 0,
  cbUsageRateAfter: 6.3,
  cbUsageChangePP: 6.3,
  medianCbPerOrder: 68.63,

  // Shipping Cost Calculation (Subsidy Zone Only: 199-449 DKK)
  subsidyZoneOrders: 6153,
  freeRateInZoneBefore: 31.3,
  freeRateInZoneAfter: 37.2,
  incrementalFreeRatePP: 5.9,
  incrementalFreeOrders: 364,
  avgShippingFee: 39,
  totalShippingCost: 14196,
  shippingCostPerCustomer: 3.04,
  monthlyShippingCostPerCustomer: 0.28,

  // Net Value Per Customer
  netValuePerCustomer: 42.21,
};

// Segment 4: Fresh Customers (Period comparison - before/after Club launch)
// Source: scripts/fresh_customer_analysis.py + scripts/fresh_customer_cashback_analysis.py
const FRESH_CUSTOMERS = {
  // Sample info
  conversionWindow: 60,
  customerIdentifier: "UNIQUE_CUSTOMER_ID",

  // Before period (Jan 2023 - Mar 2025)
  beforeLabel: "Jan 2023 - Mar 2025",
  beforeNewCustomers: 782605,
  beforeConverted: 63113,
  beforeConversionRate: 8.06,
  beforeAvgDays: 19.98,
  beforeMedianDays: 14,

  // After period (Apr 2025 - Jan 2026)
  afterLabel: "Apr 2025 - Jan 2026",
  afterNewCustomers: 340259,
  afterConverted: 24533,
  afterConversionRate: 7.21,
  afterAvgDays: 19.98,
  afterMedianDays: 13,

  // Impact calculation
  rateLiftPP: -0.85,
  monthlyNewCustomers: 34026,
  lostConversionsPerMonth: 289,
  profitPerConversion: 197,
  lostProfitPerMonth: 56933,

  // Cashback analysis for converters (from fresh_customer_cashback_analysis.py)
  convertersWithCashback: 12,
  converterCashbackRate: 0.05,
  totalCashbackRedeemed: 762,
  monthlyCashbackCost: 85,

  // Total monthly cost
  totalMonthlyCost: 57018,
  costFromLostConversions: 56933,
  costFromCashback: 85,
  pctFromLostConversions: 99.85,
  pctFromCashback: 0.15,
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

// ============================================================================
// CLUB MEMBER BREAKDOWN - SIMPLE DEFINITION (matches P&L segments)
// Using customerGroupKey = 'club' (201,477 members)
// Includes order type distinction: Club orders vs Non-Club orders
// ============================================================================
const CLUB_MEMBER_BREAKDOWN = {
  total: 201477,
  definition: "Simple", // customerGroupKey = 'club'
  categories: [
    {
      name: "Best Customers",
      count: 4589, pct: 2.3,
      description: "2+ orders, 60+ days in BOTH periods",
      clubOrders: 13343, nonClubOrders: 1342, clubOrdersPct: 90.9,
      color: "green"
    },
    {
      name: "Medium Customers",
      count: 4664, pct: 2.3,
      description: "1+ before, 2+ orders & 60+ days after",
      clubOrders: 10925, nonClubOrders: 1782, clubOrdersPct: 86.0,
      color: "teal"
    },
    {
      name: "New Active",
      count: 12000, pct: 6.0,
      description: "No orders before, 2+ orders & 60+ days after",
      clubOrders: 24561, nonClubOrders: 7381, clubOrdersPct: 76.9,
      color: "blue"
    },
    {
      name: "New Single-Order",
      count: 114585, pct: 56.9,
      description: "No orders before, only 1 Club order after",
      clubOrders: 114585, nonClubOrders: 0, clubOrdersPct: 100.0,
      color: "red"
    },
    {
      name: "Lapsed Returned",
      count: 36232, pct: 18.0,
      description: "Had orders before, only 1 Club order after",
      clubOrders: 36232, nonClubOrders: 0, clubOrdersPct: 100.0,
      color: "amber"
    },
    {
      name: "Inactive/Short Span",
      count: 29407, pct: 14.6,
      description: "2+ orders but < 60 days span",
      clubOrders: 49631, nonClubOrders: 14487, clubOrdersPct: 77.4,
      color: "zinc"
    },
  ],
};

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
                  <div className="p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded text-[10px] text-muted-foreground space-y-1">
                    <p><strong>Finding:</strong> Club orders have +{CLUB_PROGRAM.frequencyDifferencePercent}% higher frequency but {CLUB_PROGRAM.profitDifference} DKK lower profit/order due to cashback.</p>
                    <p><strong>Limitation:</strong> Cross-sectional. Does NOT track same customers over time.</p>
                    <p><strong>Action:</strong> Use longitudinal segments (Best/Medium) for true behavior change.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 2: Best Customers - Detailed P&L */}
            {/* ============================================================ */}
            <div className="border-2 border-green-400 rounded-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-green-500 text-white p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Best Customers</h3>
                  <p className="text-green-100 text-sm">2+ orders, 60+ days in BOTH periods</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{formatNumber(BEST_CUSTOMERS.sampleSize)}</p>
                  <p className="text-green-100 text-xs">Club members</p>
                </div>
              </div>

              <div className="p-4 space-y-4 bg-white dark:bg-zinc-900 flex-1">
                {/* Full Metrics Table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-zinc-50 dark:bg-zinc-800">
                      <th className="py-2 text-left font-medium">Metric</th>
                      <th className="py-2 text-right font-medium">Before</th>
                      <th className="py-2 text-right font-medium">After</th>
                      <th className="py-2 text-right font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5">Items/Order (AOQ)</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeItemsPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterItemsPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.itemsPerOrderChange}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Shipping/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeShippingPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterShippingPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.shippingPerOrderChange}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 text-green-600">Free Shipping %</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeFreeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterFreeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono text-green-600">+{BEST_CUSTOMERS.freeShippingChangePP}pp</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 text-orange-600 font-medium">Frequency</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeFrequency.toFixed(3)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterFrequency.toFixed(3)}</td>
                      <td className="py-1.5 text-right font-mono text-orange-600 font-bold">+{BEST_CUSTOMERS.frequencyChange}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">CB Usage Rate</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.cbUsageRateBefore}%</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.cbUsageRateAfter}%</td>
                      <td className="py-1.5 text-right font-mono">+{BEST_CUSTOMERS.cbUsageChangePP}pp</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Median CB/Order</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">-</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.medianCbPerOrder} DKK</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">AOV (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeAOV.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterAOV.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{BEST_CUSTOMERS.aovChange}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Profit/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeProfitPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterProfitPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{BEST_CUSTOMERS.profitPerOrderChange}%</td>
                    </tr>
                    <tr className="bg-green-50 dark:bg-green-950/30">
                      <td className="py-1.5 font-medium">Monthly Profit</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeMonthlyProfit.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterMonthlyProfit.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-green-600">+{BEST_CUSTOMERS.monthlyProfitChange}%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground">Monthly Profit = Frequency × Profit/Order</p>

                {/* Shipping Cost Calculation */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border text-xs">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Shipping Cost Calculation (Subsidy Zone Only)</p>
                  <p className="text-[10px] text-muted-foreground mb-2">Note: These rates are for orders in the 199-449 DKK zone only, NOT the overall free shipping rate shown above.</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Orders in subsidy zone (199-449 DKK):</span><span className="font-mono">{formatNumber(BEST_CUSTOMERS.subsidyZoneOrders)} orders</span></div>
                    <div className="flex justify-between"><span>Free shipping rate in zone BEFORE:</span><span className="font-mono">{BEST_CUSTOMERS.freeRateInZoneBefore}%</span></div>
                    <div className="flex justify-between"><span>Free shipping rate in zone AFTER:</span><span className="font-mono">{BEST_CUSTOMERS.freeRateInZoneAfter}%</span></div>
                    <div className="flex justify-between text-green-600"><span>Incremental free rate (Club benefit):</span><span className="font-mono">+{BEST_CUSTOMERS.incrementalFreeRatePP}pp</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between"><span>Incremental free orders:</span><span className="font-mono">{formatNumber(BEST_CUSTOMERS.subsidyZoneOrders)} × {BEST_CUSTOMERS.incrementalFreeRatePP}% = {formatNumber(BEST_CUSTOMERS.incrementalFreeOrders)} orders</span></div>
                    <div className="flex justify-between"><span>× Avg shipping fee:</span><span className="font-mono">× {BEST_CUSTOMERS.avgShippingFee} DKK</span></div>
                    <div className="flex justify-between"><span>= Total shipping cost (11 mo):</span><span className="font-mono">{formatNumber(BEST_CUSTOMERS.totalShippingCost)} DKK</span></div>
                    <div className="flex justify-between"><span>÷ {formatNumber(BEST_CUSTOMERS.sampleSize)} customers:</span><span className="font-mono">{BEST_CUSTOMERS.shippingCostPerCustomer} DKK/customer (11 mo)</span></div>
                    <div className="flex justify-between font-medium"><span>Monthly shipping cost/customer:</span><span className="font-mono">{BEST_CUSTOMERS.monthlyShippingCostPerCustomer} DKK/mo</span></div>
                  </div>
                </div>

                {/* Monthly Value Per Customer */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border text-xs">
                  <p className="font-semibold mb-2">Monthly Value Per Customer</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Monthly Profit Lift:</span><span className="font-mono text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK</span></div>
                    <div className="flex justify-between"><span>Shipping Cost/Customer:</span><span className="font-mono text-red-600">-{BEST_CUSTOMERS.monthlyShippingCostPerCustomer} DKK</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-700">Net Value/Customer:</span>
                      <span className="text-xl font-bold text-green-600">+{BEST_CUSTOMERS.netValuePerCustomer} DKK/mo</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Note: Cashback is already reflected in profit figures (reduces revenue at redemption).</p>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 3: Medium Customers - Detailed P&L */}
            {/* ============================================================ */}
            <div className="border-2 border-teal-400 rounded-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-teal-500 text-white p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Medium Customers</h3>
                  <p className="text-teal-100 text-sm">1+ before, 2+ orders & 60+ days after</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{formatNumber(MEDIUM_CUSTOMERS.sampleSize)}</p>
                  <p className="text-teal-100 text-xs">Club members</p>
                </div>
              </div>

              <div className="p-4 space-y-4 bg-white dark:bg-zinc-900 flex-1">
                {/* Full Metrics Table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-zinc-50 dark:bg-zinc-800">
                      <th className="py-2 text-left font-medium">Metric</th>
                      <th className="py-2 text-right font-medium">Before</th>
                      <th className="py-2 text-right font-medium">After</th>
                      <th className="py-2 text-right font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5">Items/Order (AOQ)</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeItemsPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterItemsPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">+{MEDIUM_CUSTOMERS.itemsPerOrderChange}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Shipping/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeShippingPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterShippingPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.shippingPerOrderChange}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 text-green-600">Free Shipping %</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeFreeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterFreeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono text-green-600">+{MEDIUM_CUSTOMERS.freeShippingChangePP}pp</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 text-orange-600 font-medium">Frequency</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeFrequency.toFixed(3)}</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterFrequency.toFixed(3)}</td>
                      <td className="py-1.5 text-right font-mono text-orange-600 font-bold">+{MEDIUM_CUSTOMERS.frequencyChange}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">CB Usage Rate</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.cbUsageRateBefore}%</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.cbUsageRateAfter}%</td>
                      <td className="py-1.5 text-right font-mono">+{MEDIUM_CUSTOMERS.cbUsageChangePP}pp</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Median CB/Order</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">-</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.medianCbPerOrder} DKK</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">AOV (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeAOV.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterAOV.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.aovChange}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Profit/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeProfitPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterProfitPerOrder.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.profitPerOrderChange}%</td>
                    </tr>
                    <tr className="bg-green-50 dark:bg-green-950/30">
                      <td className="py-1.5 font-medium">Monthly Profit</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeMonthlyProfit.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterMonthlyProfit.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-green-600">+{MEDIUM_CUSTOMERS.monthlyProfitChange}%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground">Monthly Profit = Frequency × Profit/Order</p>

                {/* Shipping Cost Calculation */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border text-xs">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Shipping Cost Calculation (Subsidy Zone Only)</p>
                  <p className="text-[10px] text-muted-foreground mb-2">Note: These rates are for orders in the 199-449 DKK zone only, NOT the overall free shipping rate shown above.</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Orders in subsidy zone (199-449 DKK):</span><span className="font-mono">{formatNumber(MEDIUM_CUSTOMERS.subsidyZoneOrders)} orders</span></div>
                    <div className="flex justify-between"><span>Free shipping rate in zone BEFORE:</span><span className="font-mono">{MEDIUM_CUSTOMERS.freeRateInZoneBefore}%</span></div>
                    <div className="flex justify-between"><span>Free shipping rate in zone AFTER:</span><span className="font-mono">{MEDIUM_CUSTOMERS.freeRateInZoneAfter}%</span></div>
                    <div className="flex justify-between text-green-600"><span>Incremental free rate (Club benefit):</span><span className="font-mono">+{MEDIUM_CUSTOMERS.incrementalFreeRatePP}pp</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between"><span>Incremental free orders:</span><span className="font-mono">{formatNumber(MEDIUM_CUSTOMERS.subsidyZoneOrders)} × {MEDIUM_CUSTOMERS.incrementalFreeRatePP}% = {formatNumber(MEDIUM_CUSTOMERS.incrementalFreeOrders)} orders</span></div>
                    <div className="flex justify-between"><span>× Avg shipping fee:</span><span className="font-mono">× {MEDIUM_CUSTOMERS.avgShippingFee} DKK</span></div>
                    <div className="flex justify-between"><span>= Total shipping cost (11 mo):</span><span className="font-mono">{formatNumber(MEDIUM_CUSTOMERS.totalShippingCost)} DKK</span></div>
                    <div className="flex justify-between"><span>÷ {formatNumber(MEDIUM_CUSTOMERS.sampleSize)} customers:</span><span className="font-mono">{MEDIUM_CUSTOMERS.shippingCostPerCustomer} DKK/customer (11 mo)</span></div>
                    <div className="flex justify-between font-medium"><span>Monthly shipping cost/customer:</span><span className="font-mono">{MEDIUM_CUSTOMERS.monthlyShippingCostPerCustomer} DKK/mo</span></div>
                  </div>
                </div>

                {/* Monthly Value Per Customer */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border text-xs">
                  <p className="font-semibold mb-2">Monthly Value Per Customer</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Monthly Profit Lift:</span><span className="font-mono text-green-600">+{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK</span></div>
                    <div className="flex justify-between"><span>Shipping Cost/Customer:</span><span className="font-mono text-red-600">-{MEDIUM_CUSTOMERS.monthlyShippingCostPerCustomer} DKK</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-teal-700">Net Value/Customer:</span>
                      <span className="text-xl font-bold text-teal-600">+{MEDIUM_CUSTOMERS.netValuePerCustomer} DKK/mo</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Note: Cashback is already reflected in profit figures (reduces revenue at redemption).</p>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 4: Fresh Customers - Detailed P&L Breakdown */}
            {/* ============================================================ */}
            <div className="border-2 border-red-400 rounded-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-red-500 text-white p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Fresh Customers</h3>
                  <p className="text-red-100 text-sm">1st → 2nd order conversion</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{formatNumber(FRESH_CUSTOMERS.afterConverted)}</p>
                  <p className="text-red-100 text-xs">converted after Club</p>
                </div>
              </div>

              <div className="p-4 space-y-4 bg-white dark:bg-zinc-900 flex-1">
                {/* STEP 1: What is a Fresh Customer? */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-700 mb-2">Step 1: What is a Fresh Customer?</p>
                  <p className="text-xs text-blue-600">
                    A customer placing their <strong>first-ever order</strong>. We measure success by whether they
                    return for a <strong>2nd order within {FRESH_CUSTOMERS.conversionWindow} days</strong>.
                  </p>
                </div>

                {/* STEP 2: Before vs After Comparison */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border">
                  <p className="font-semibold mb-2">Step 2: Before vs After Club Launch</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1.5 text-left"></th>
                        <th className="py-1.5 text-right">Before Club<br/><span className="font-normal text-muted-foreground">{FRESH_CUSTOMERS.beforeLabel}</span></th>
                        <th className="py-1.5 text-right">After Club<br/><span className="font-normal text-muted-foreground">{FRESH_CUSTOMERS.afterLabel}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5">New customers</td>
                        <td className="py-1.5 text-right font-mono">{formatNumber(FRESH_CUSTOMERS.beforeNewCustomers)}</td>
                        <td className="py-1.5 text-right font-mono">{formatNumber(FRESH_CUSTOMERS.afterNewCustomers)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">Converted (2nd order in 60d)</td>
                        <td className="py-1.5 text-right font-mono">{formatNumber(FRESH_CUSTOMERS.beforeConverted)}</td>
                        <td className="py-1.5 text-right font-mono">{formatNumber(FRESH_CUSTOMERS.afterConverted)}</td>
                      </tr>
                      <tr className="bg-amber-50 dark:bg-amber-900/20">
                        <td className="py-1.5 font-medium">Conversion Rate</td>
                        <td className="py-1.5 text-right font-mono font-bold">{FRESH_CUSTOMERS.beforeConversionRate}%</td>
                        <td className="py-1.5 text-right font-mono font-bold text-red-600">{FRESH_CUSTOMERS.afterConversionRate}%</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                    <strong>Result:</strong> Conversion rate dropped by <span className="text-red-600 font-bold">{FRESH_CUSTOMERS.rateLiftPP}pp</span> (from {FRESH_CUSTOMERS.beforeConversionRate}% to {FRESH_CUSTOMERS.afterConversionRate}%)
                  </div>
                </div>

                {/* STEP 3: Cost Calculation - Lost Conversions */}
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                  <p className="font-semibold text-red-700 mb-2">Step 3: Cost from Lost Conversions</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded">
                      <span>① Monthly new customers (after Club):</span>
                      <span className="font-mono">{formatNumber(FRESH_CUSTOMERS.afterNewCustomers)} ÷ 10 mo = <strong>{formatNumber(FRESH_CUSTOMERS.monthlyNewCustomers)}/mo</strong></span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded">
                      <span>② Lost conversion rate:</span>
                      <span className="font-mono text-red-600"><strong>{Math.abs(FRESH_CUSTOMERS.rateLiftPP)}%</strong> fewer convert</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded">
                      <span>③ Lost conversions per month:</span>
                      <span className="font-mono">{formatNumber(FRESH_CUSTOMERS.monthlyNewCustomers)} × {Math.abs(FRESH_CUSTOMERS.rateLiftPP)}% = <strong className="text-red-600">{formatNumber(FRESH_CUSTOMERS.lostConversionsPerMonth)}/mo</strong></span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded">
                      <span>④ Profit per 2nd order:</span>
                      <span className="font-mono"><strong>{FRESH_CUSTOMERS.profitPerConversion} DKK</strong></span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-200 dark:bg-red-800/50 rounded font-medium">
                      <span>⑤ Lost profit per month:</span>
                      <span className="font-mono">{formatNumber(FRESH_CUSTOMERS.lostConversionsPerMonth)} × {FRESH_CUSTOMERS.profitPerConversion} = <strong className="text-red-700">{formatNumber(FRESH_CUSTOMERS.lostProfitPerMonth)} DKK/mo</strong></span>
                    </div>
                  </div>
                </div>

                {/* STEP 4: Cashback Cost for Converters */}
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-700 mb-2">Step 4: Cashback Cost for the {formatNumber(FRESH_CUSTOMERS.afterConverted)} Who DID Convert</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded">
                      <span>Converters who used cashback on 2nd order:</span>
                      <span className="font-mono"><strong>{FRESH_CUSTOMERS.convertersWithCashback}</strong> of {formatNumber(FRESH_CUSTOMERS.afterConverted)} ({FRESH_CUSTOMERS.converterCashbackRate}%)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded">
                      <span>Total cashback redeemed:</span>
                      <span className="font-mono"><strong>{formatNumber(FRESH_CUSTOMERS.totalCashbackRedeemed)} DKK</strong></span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-200 dark:bg-green-800/50 rounded font-medium">
                      <span>Monthly cashback cost:</span>
                      <span className="font-mono text-green-700"><strong>{formatNumber(FRESH_CUSTOMERS.monthlyCashbackCost)} DKK/mo</strong></span>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px]">
                    <strong>Why so low?</strong> Fresh customers EARN cashback on their 1st order, but by their 2nd order (within 60 days),
                    they haven&apos;t accumulated enough to redeem. They need more orders to build up cashback balance.
                  </div>
                </div>

                {/* STEP 5: Total Monthly Cost */}
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-zinc-400">
                  <p className="font-semibold mb-2">Step 5: Total Monthly Cost Breakdown</p>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Cost 1: Lost conversion profit</td>
                        <td className="py-2 text-right font-mono text-red-600">{formatNumber(FRESH_CUSTOMERS.costFromLostConversions)} DKK/mo</td>
                        <td className="py-2 text-right text-muted-foreground">{FRESH_CUSTOMERS.pctFromLostConversions}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Cost 2: Cashback for converters</td>
                        <td className="py-2 text-right font-mono text-green-600">{formatNumber(FRESH_CUSTOMERS.costFromCashback)} DKK/mo</td>
                        <td className="py-2 text-right text-muted-foreground">{FRESH_CUSTOMERS.pctFromCashback}%</td>
                      </tr>
                      <tr className="bg-red-100 dark:bg-red-900/30 font-bold">
                        <td className="py-2">TOTAL</td>
                        <td className="py-2 text-right font-mono text-red-700">{formatNumber(FRESH_CUSTOMERS.totalMonthlyCost)} DKK/mo</td>
                        <td className="py-2 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Key Insight */}
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg border-2 border-amber-400 text-xs">
                  <p className="font-bold text-amber-700 mb-1">Key Insight for CEO</p>
                  <p className="text-amber-600">
                    The Fresh Customer cost is <strong>99.85% from lost conversions</strong> (fewer people returning for 2nd order),
                    NOT from cashback costs. Cashback is negligible because fresh customers haven&apos;t built up balances yet.
                  </p>
                  <p className="text-amber-600 mt-2">
                    <strong>Annual impact:</strong> {formatNumber(FRESH_CUSTOMERS.totalMonthlyCost)} × 12 = <strong>~{formatNumber(FRESH_CUSTOMERS.totalMonthlyCost * 12)} DKK/year</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* ================================================================ */}
          {/* CRITICAL: WHERE ARE THE 201K CLUB MEMBERS?                       */}
          {/* ================================================================ */}
          <div className="mt-6 p-6 bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30 rounded-xl border-2 border-red-400">
            <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Critical: Where Are the 201K Club Members?
            </h4>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Total Club Members</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.total)}</p>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">In Best + Medium P&L</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].count + CLUB_MEMBER_BREAKDOWN.categories[1].count)}</p>
                <p className="text-xs text-green-600">{((CLUB_MEMBER_BREAKDOWN.categories[0].count + CLUB_MEMBER_BREAKDOWN.categories[1].count) / CLUB_MEMBER_BREAKDOWN.total * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">NOT in P&L Analysis</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.total - CLUB_MEMBER_BREAKDOWN.categories[0].count - CLUB_MEMBER_BREAKDOWN.categories[1].count)}</p>
                <p className="text-xs text-red-600">{((CLUB_MEMBER_BREAKDOWN.total - CLUB_MEMBER_BREAKDOWN.categories[0].count - CLUB_MEMBER_BREAKDOWN.categories[1].count) / CLUB_MEMBER_BREAKDOWN.total * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Compact Table */}
            <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-lg p-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800">
                    <th className="p-2 text-left font-medium">Category</th>
                    <th className="p-2 text-right font-medium">Members</th>
                    <th className="p-2 text-right font-medium">%</th>
                    <th className="p-2 text-right font-medium">Club Orders</th>
                    <th className="p-2 text-right font-medium">Non-Club</th>
                    <th className="p-2 text-left font-medium">Order Flow (Before → After)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Best */}
                  <tr className="border-b border-green-200 bg-green-50/50 dark:bg-green-900/10">
                    <td className="p-2">
                      <span className="font-medium text-green-700">Best</span>
                      <Badge className="ml-1 bg-green-600 text-white text-[8px] px-1">P&L</Badge>
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-green-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].count)}</td>
                    <td className="p-2 text-right text-green-600">{CLUB_MEMBER_BREAKDOWN.categories[0].pct}%</td>
                    <td className="p-2 text-right font-mono">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].clubOrders)}</td>
                    <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].nonClubOrders)}</td>
                    <td className="p-2 text-[10px]">
                      <span className="text-zinc-500">2+ non-Club</span> → <span className="text-green-600">2+ Club (60d+)</span>
                    </td>
                  </tr>
                  {/* Medium */}
                  <tr className="border-b border-teal-200 bg-teal-50/50 dark:bg-teal-900/10">
                    <td className="p-2">
                      <span className="font-medium text-teal-700">Medium</span>
                      <Badge className="ml-1 bg-teal-600 text-white text-[8px] px-1">P&L</Badge>
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-teal-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[1].count)}</td>
                    <td className="p-2 text-right text-teal-600">{CLUB_MEMBER_BREAKDOWN.categories[1].pct}%</td>
                    <td className="p-2 text-right font-mono">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[1].clubOrders)}</td>
                    <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[1].nonClubOrders)}</td>
                    <td className="p-2 text-[10px]">
                      <span className="text-zinc-500">1+ non-Club</span> → <span className="text-teal-600">2+ Club (60d+)</span>
                    </td>
                  </tr>
                  {/* New Active */}
                  <tr className="border-b bg-blue-50/30 dark:bg-blue-900/5">
                    <td className="p-2"><span className="font-medium text-blue-700">New Active</span></td>
                    <td className="p-2 text-right font-mono text-blue-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[2].count)}</td>
                    <td className="p-2 text-right text-blue-600">{CLUB_MEMBER_BREAKDOWN.categories[2].pct}%</td>
                    <td className="p-2 text-right font-mono">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[2].clubOrders)}</td>
                    <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[2].nonClubOrders)}</td>
                    <td className="p-2 text-[10px]">
                      <span className="text-zinc-400">No orders</span> → <span className="text-blue-600">2+ Club (60d+)</span>
                    </td>
                  </tr>
                  {/* New Single - HIGHLIGHT */}
                  <tr className="border-b-2 border-red-400 bg-red-100/70 dark:bg-red-900/20">
                    <td className="p-2">
                      <span className="font-bold text-red-700">New Single-Order</span>
                      <Badge className="ml-1 bg-red-600 text-white text-[8px] px-1">!</Badge>
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-red-600 text-sm">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].count)}</td>
                    <td className="p-2 text-right font-bold text-red-600">{CLUB_MEMBER_BREAKDOWN.categories[3].pct}%</td>
                    <td className="p-2 text-right font-mono text-red-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].clubOrders)}</td>
                    <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].nonClubOrders)}</td>
                    <td className="p-2 text-[10px]">
                      <span className="text-zinc-400">No orders</span> → <span className="text-red-600 font-bold">1 Club only (never returned)</span>
                    </td>
                  </tr>
                  {/* Lapsed */}
                  <tr className="border-b bg-amber-50/30 dark:bg-amber-900/5">
                    <td className="p-2"><span className="font-medium text-amber-700">Lapsed Returned</span></td>
                    <td className="p-2 text-right font-mono text-amber-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[4].count)}</td>
                    <td className="p-2 text-right text-amber-600">{CLUB_MEMBER_BREAKDOWN.categories[4].pct}%</td>
                    <td className="p-2 text-right font-mono">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[4].clubOrders)}</td>
                    <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[4].nonClubOrders)}</td>
                    <td className="p-2 text-[10px]">
                      <span className="text-zinc-500">1+ non-Club</span> → <span className="text-amber-600">1 Club only</span>
                    </td>
                  </tr>
                  {/* Inactive */}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                    <td className="p-2"><span className="font-medium text-zinc-600">Inactive/Short</span></td>
                    <td className="p-2 text-right font-mono text-zinc-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[5].count)}</td>
                    <td className="p-2 text-right text-zinc-600">{CLUB_MEMBER_BREAKDOWN.categories[5].pct}%</td>
                    <td className="p-2 text-right font-mono">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[5].clubOrders)}</td>
                    <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[5].nonClubOrders)}</td>
                    <td className="p-2 text-[10px] text-muted-foreground">Mixed → 2+ Club (&lt;60d span)</td>
                  </tr>
                  {/* Total */}
                  <tr className="bg-zinc-200 dark:bg-zinc-700 font-medium">
                    <td className="p-2">TOTAL</td>
                    <td className="p-2 text-right font-mono font-bold">{formatNumber(CLUB_MEMBER_BREAKDOWN.total)}</td>
                    <td className="p-2 text-right">100%</td>
                    <td className="p-2 text-right font-mono">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories.reduce((sum, c) => sum + c.clubOrders, 0))}</td>
                    <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories.reduce((sum, c) => sum + c.nonClubOrders, 0))}</td>
                    <td className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Insight */}
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded border-2 border-red-400 text-sm">
              <p className="text-red-700">
                <strong>Key Issue:</strong> {CLUB_MEMBER_BREAKDOWN.categories[3].pct}% of Club members ({formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].count)}) placed ONE Club order and never returned.
                They got Club benefits (free shipping at 199 DKK) but generated no repeat business.
              </p>
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
