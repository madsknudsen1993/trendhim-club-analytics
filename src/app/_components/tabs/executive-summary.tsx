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
};

// Program constants
const PROGRAM = {
  analysisPeriod: "April 2025 - January 2026",
  monthsAnalyzed: 10,
  totalClubMembers: CORE_METRICS.customers.totalClub,
  membersWithCashback: CORE_METRICS.cashbackSegments.hasBalance.count,
  membersWithCashbackPercent: CORE_METRICS.cashbackSegments.hasBalance.percentage,
};

// Per-member costs
const MONTHLY_COST_PER_MEMBER = COSTS.totalProgramCosts / PROGRAM.monthsAnalyzed / PROGRAM.totalClubMembers;
const ANNUAL_PROGRAM_COSTS = COSTS.totalProgramCosts * 1.2; // Annualized

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
              Three customer segments analyzed with complete cost breakdown
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Three Segments Analysis */}
      <Card className="border-2 border-amber-500">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <CardTitle>Three Customer Segments Compared</CardTitle>
          </div>
          <CardDescription>
            Complete breakdown of metrics, costs, and ROI for each segment
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ============================================================ */}
            {/* SEGMENT 1: Club Program ROI (Cross-sectional) */}
            {/* ============================================================ */}
            <div className="border-2 border-red-400 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-red-500 text-white p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Club Program ROI</h3>
                </div>
                <p className="text-red-100 text-sm mt-1">Cross-sectional comparison</p>
              </div>

              <div className="p-4 space-y-4 bg-red-50/30 dark:bg-red-950/10">
                {/* Sample Definition */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-sm">Sample Definition</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{CLUB_PROGRAM.sampleDescription}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Club Orders</span>
                      <p className="font-mono font-bold">{formatNumber(CLUB_PROGRAM.clubOrders)}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Club Members</span>
                      <p className="font-mono font-bold">{formatNumber(CLUB_PROGRAM.totalClubMembers)}</p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-sm">Key Metrics</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5 text-muted-foreground">AOV (Club)</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.clubAOV} DKK</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 text-muted-foreground">AOV (Non-Club)</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.nonClubAOV} DKK</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 text-muted-foreground">Purchase Frequency</td>
                        <td className="py-1.5 text-right font-mono text-green-600">+{CLUB_PROGRAM.frequencyDifferencePercent}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 text-muted-foreground">Profit/Order (Club)</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.clubProfitPerOrder} DKK</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-muted-foreground">Profit/Order (Non-Club)</td>
                        <td className="py-1.5 text-right font-mono">{CLUB_PROGRAM.nonClubProfitPerOrder} DKK</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ROI Calculation */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-sm">ROI Calculation</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Profit Difference</span>
                          <p className="text-[10px] text-muted-foreground">Club - Non-Club profit/order</p>
                        </td>
                        <td className={`py-1.5 text-right font-mono ${CLUB_PROGRAM.profitDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {CLUB_PROGRAM.profitDifference >= 0 ? '+' : ''}{CLUB_PROGRAM.profitDifference} DKK
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Incremental Profit</span>
                          <p className="text-[10px] text-muted-foreground">{CLUB_PROGRAM.profitDifference} DKK × {formatNumber(CLUB_PROGRAM.clubOrders)} orders</p>
                        </td>
                        <td className={`py-1.5 text-right font-mono ${CLUB_PROGRAM.incrementalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {CLUB_PROGRAM.incrementalProfit >= 0 ? '+' : ''}{formatNumber(CLUB_PROGRAM.incrementalProfit)} DKK
                        </td>
                      </tr>
                      <tr className="border-b bg-zinc-100 dark:bg-zinc-800">
                        <td className="py-1.5">
                          <span className="text-muted-foreground line-through">Cashback</span>
                          <p className="text-[10px] text-green-600">Already in profit</p>
                        </td>
                        <td className="py-1.5 text-right font-mono text-zinc-400">N/A</td>
                      </tr>
                      <tr className="border-b bg-red-50 dark:bg-red-950/30">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Shipping Subsidy</span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-600">-{formatCurrency(COSTS.shippingSubsidy)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Result */}
                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 text-center">
                  <p className="text-sm text-amber-700 dark:text-amber-400">Net Program Value</p>
                  <p className="text-3xl font-bold text-amber-600">{formatCurrency(CLUB_PROGRAM.netValue)}</p>
                  <p className="text-lg font-bold text-amber-600">ROI: {CLUB_PROGRAM.roi}%</p>
                </div>

                {/* Limitation */}
                <div className="p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded text-xs flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Limitation:</strong> Ignores frequency increase. Only measures profit/order difference.
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 2: Best Customers (Robust Sample) */}
            {/* ============================================================ */}
            <div className="border-2 border-green-400 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-green-500 text-white p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Best Customers</h3>
                </div>
                <p className="text-green-100 text-sm mt-1">Highly engaged repeat buyers</p>
              </div>

              <div className="p-4 space-y-4 bg-green-50/30 dark:bg-green-950/10">
                {/* Sample Definition */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-sm">Sample Definition</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{BEST_CUSTOMERS.sampleDescription}</p>
                  <p className="text-xs text-muted-foreground mt-1">{BEST_CUSTOMERS.criteria}</p>
                  <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <span className="text-xs text-green-700 dark:text-green-400">Sample Size</span>
                    <p className="font-mono font-bold text-green-700">{formatNumber(BEST_CUSTOMERS.sampleSize)} members</p>
                  </div>
                </div>

                {/* Before/After Metrics */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-sm">Before vs After Club</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1.5 text-left text-muted-foreground">Metric</th>
                        <th className="py-1.5 text-right text-muted-foreground">Before</th>
                        <th className="py-1.5 text-right text-muted-foreground">After</th>
                        <th className="py-1.5 text-right text-muted-foreground">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5">Frequency</td>
                        <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeFrequency.toFixed(3)}</td>
                        <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterFrequency.toFixed(3)}</td>
                        <td className="py-1.5 text-right font-mono text-green-600">+{BEST_CUSTOMERS.frequencyChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">AOV</td>
                        <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeAOV.toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterAOV.toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono text-red-600">{BEST_CUSTOMERS.aovChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">Profit/Order</td>
                        <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.beforeProfitPerOrder.toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono">{BEST_CUSTOMERS.afterProfitPerOrder.toFixed(0)}</td>
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
                </div>

                {/* Value Calculation */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-sm">Value Calculation</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Uplift per Member</span>
                          <p className="text-[10px] text-muted-foreground">{BEST_CUSTOMERS.afterMonthlyProfit.toFixed(2)} - {BEST_CUSTOMERS.beforeMonthlyProfit.toFixed(2)}</p>
                        </td>
                        <td className="py-1.5 text-right font-mono text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Program Cost per Member</span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-600">-{MONTHLY_COST_PER_MEMBER.toFixed(2)} DKK/mo</td>
                      </tr>
                      <tr className="border-b bg-green-50 dark:bg-green-950/30">
                        <td className="py-1.5 font-medium">Net per Member</td>
                        <td className="py-1.5 text-right font-mono font-bold text-green-600">+{(BEST_CUSTOMERS.incrementalMonthlyValue - MONTHLY_COST_PER_MEMBER).toFixed(2)} DKK/mo</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Annual Value (engaged)</span>
                          <p className="text-[10px] text-muted-foreground">{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(0)} × {formatNumber(PROGRAM.membersWithCashback)} × 12</p>
                        </td>
                        <td className="py-1.5 text-right font-mono text-green-600">+{formatCurrency(BEST_CUSTOMERS.incrementalMonthlyValue * PROGRAM.membersWithCashback * 12)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Annual Costs</span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-600">-{formatCurrency(ANNUAL_PROGRAM_COSTS)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Result */}
                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 text-center">
                  <p className="text-sm text-amber-700 dark:text-amber-400">Est. Annual Net (engaged only)</p>
                  <p className="text-3xl font-bold text-amber-600">{formatCurrency(BEST_CUSTOMERS.incrementalMonthlyValue * PROGRAM.membersWithCashback * 12 - ANNUAL_PROGRAM_COSTS)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Assumes {formatNumber(PROGRAM.membersWithCashback)} engaged members</p>
                </div>

                {/* Note */}
                <div className="p-2 bg-green-100/50 dark:bg-green-900/20 rounded text-xs flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Strength:</strong> Longitudinal analysis proves causal behavior change. Same customers tracked before/after.
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEGMENT 3: Medium Customers (Broader Sample) */}
            {/* ============================================================ */}
            <div className="border-2 border-orange-400 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-orange-500 text-white p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Medium Customers</h3>
                </div>
                <p className="text-orange-100 text-sm mt-1">Includes activated one-time buyers</p>
              </div>

              <div className="p-4 space-y-4 bg-orange-50/30 dark:bg-orange-950/10">
                {/* Sample Definition */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-sm">Sample Definition</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{MEDIUM_CUSTOMERS.sampleDescription}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Sample Size</span>
                      <p className="font-mono font-bold">{formatNumber(MEDIUM_CUSTOMERS.sampleSize)}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">1-order before</span>
                      <p className="font-mono font-bold">{formatNumber(MEDIUM_CUSTOMERS.singleOrderBefore)} ({((MEDIUM_CUSTOMERS.singleOrderBefore / MEDIUM_CUSTOMERS.sampleSize) * 100).toFixed(0)}%)</p>
                    </div>
                  </div>
                </div>

                {/* Before/After Metrics */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-sm">Before vs After Club</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1.5 text-left text-muted-foreground">Metric</th>
                        <th className="py-1.5 text-right text-muted-foreground">Before</th>
                        <th className="py-1.5 text-right text-muted-foreground">After</th>
                        <th className="py-1.5 text-right text-muted-foreground">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5">Frequency</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeFrequency.toFixed(3)}</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterFrequency.toFixed(3)}</td>
                        <td className="py-1.5 text-right font-mono text-green-600">+{MEDIUM_CUSTOMERS.frequencyChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">AOV</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeAOV.toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterAOV.toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.aovChange}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">Profit/Order</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeProfitPerOrder.toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterProfitPerOrder.toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.profitPerOrderChange}%</td>
                      </tr>
                      <tr className="bg-red-50 dark:bg-red-950/30">
                        <td className="py-1.5 font-medium">Monthly Profit</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.beforeMonthlyProfit.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-mono">{MEDIUM_CUSTOMERS.afterMonthlyProfit.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-red-600">{MEDIUM_CUSTOMERS.monthlyProfitChange}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Value Calculation */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-sm">Value Calculation</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Change per Member</span>
                          <p className="text-[10px] text-muted-foreground">{MEDIUM_CUSTOMERS.afterMonthlyProfit.toFixed(2)} - {MEDIUM_CUSTOMERS.beforeMonthlyProfit.toFixed(2)}</p>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/mo</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Program Cost per Member</span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-600">-{MONTHLY_COST_PER_MEMBER.toFixed(2)} DKK/mo</td>
                      </tr>
                      <tr className="border-b bg-red-50 dark:bg-red-950/30">
                        <td className="py-1.5 font-medium">Net per Member</td>
                        <td className="py-1.5 text-right font-mono font-bold text-red-600">{(MEDIUM_CUSTOMERS.incrementalMonthlyValue - MONTHLY_COST_PER_MEMBER).toFixed(2)} DKK/mo</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Annual Value (all)</span>
                          <p className="text-[10px] text-muted-foreground">{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} × {formatNumber(PROGRAM.totalClubMembers)} × 12</p>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-600">{formatCurrency(MEDIUM_CUSTOMERS.incrementalMonthlyValue * PROGRAM.totalClubMembers * 12)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5">
                          <span className="text-muted-foreground">Annual Costs</span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-600">-{formatCurrency(ANNUAL_PROGRAM_COSTS)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Result */}
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 text-center">
                  <p className="text-sm text-red-700 dark:text-red-400">Est. Annual Net (all members)</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(MEDIUM_CUSTOMERS.incrementalMonthlyValue * PROGRAM.totalClubMembers * 12 - ANNUAL_PROGRAM_COSTS)}</p>
                  <p className="text-xs text-muted-foreground mt-1">If this uplift applies to all {formatNumber(PROGRAM.totalClubMembers)} members</p>
                </div>

                {/* Note */}
                <div className="p-2 bg-orange-100/50 dark:bg-orange-900/20 rounded text-xs flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Includes:</strong> High-freq customers regressing to mean (-24.5%) + one-time buyers activated (+174.8%). Most realistic scenario.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Comparison */}
          <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Summary: Which Scenario to Trust?
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="py-2 text-left">Segment</th>
                    <th className="py-2 text-right">Sample</th>
                    <th className="py-2 text-right">Frequency Change</th>
                    <th className="py-2 text-right">Net per Member</th>
                    <th className="py-2 text-right">Annual Net</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium text-red-600">Club Program ROI</td>
                    <td className="py-2 text-right font-mono">{formatNumber(CLUB_PROGRAM.clubOrders)} orders</td>
                    <td className="py-2 text-right font-mono">+{CLUB_PROGRAM.frequencyDifferencePercent}%</td>
                    <td className="py-2 text-right font-mono">N/A</td>
                    <td className="py-2 text-right font-mono font-bold text-red-600">{formatCurrency(CLUB_PROGRAM.netValue)}</td>
                  </tr>
                  <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                    <td className="py-2 font-medium text-green-600">Best Customers</td>
                    <td className="py-2 text-right font-mono">{formatNumber(BEST_CUSTOMERS.sampleSize)} members</td>
                    <td className="py-2 text-right font-mono text-green-600">+{BEST_CUSTOMERS.frequencyChange}%</td>
                    <td className="py-2 text-right font-mono text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK</td>
                    <td className="py-2 text-right font-mono font-bold text-amber-600">{formatCurrency(BEST_CUSTOMERS.incrementalMonthlyValue * PROGRAM.membersWithCashback * 12 - ANNUAL_PROGRAM_COSTS)}</td>
                  </tr>
                  <tr className="bg-orange-50/50 dark:bg-orange-950/20">
                    <td className="py-2 font-medium text-orange-600">Medium Customers</td>
                    <td className="py-2 text-right font-mono">{formatNumber(MEDIUM_CUSTOMERS.sampleSize)} members</td>
                    <td className="py-2 text-right font-mono text-green-600">+{MEDIUM_CUSTOMERS.frequencyChange}%</td>
                    <td className="py-2 text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK</td>
                    <td className="py-2 text-right font-mono font-bold text-red-600">{formatCurrency(MEDIUM_CUSTOMERS.incrementalMonthlyValue * PROGRAM.totalClubMembers * 12 - ANNUAL_PROGRAM_COSTS)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Recommendation:</strong> The true value likely lies between Best Customers and Medium Customers.
                  Best Customers shows the potential; Medium Customers shows the realistic outcome including regression effects.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* PROGRAM COSTS OVERVIEW */}
      {/* ================================================================ */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/30 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Program Costs Overview ({PROGRAM.monthsAnalyzed} months)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Important Note about Cashback */}
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong className="text-amber-700">Cashback is NOT a separate cost.</strong>
                <span className="text-amber-600"> Cashback redemption already reduces order revenue before profit is calculated.
                The {formatCurrency(COSTS.cashbackRedeemed)} redeemed is already reflected in the profit figures.</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium">Cashback Redeemed</span>
              </div>
              <p className="text-xl font-bold text-zinc-500 line-through">{formatCurrency(COSTS.cashbackRedeemed)}</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                Already in profit calculation
              </p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Shipping Subsidy</span>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(COSTS.shippingSubsidy)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(COSTS.shippingSubsidyOrderCount)} orders x ~{COSTS.avgShippingPerOrder.toFixed(0)} DKK avg
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Incremental Program Costs</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(COSTS.shippingSubsidy)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Shipping subsidy only
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
                  <tr className="bg-orange-50/50 dark:bg-orange-950/20">
                    <td className="p-2 border-b font-medium text-orange-700">Medium Customers</td>
                    <td className="p-2 border-b text-right font-mono">{formatNumber(MEDIUM_CUSTOMERS.sampleSize)}</td>
                    <td className="p-2 border-b text-xs">{MEDIUM_CUSTOMERS.sampleDescription}</td>
                    <td className="p-2 border-b text-right font-mono text-green-600">+{MEDIUM_CUSTOMERS.frequencyChange}%</td>
                    <td className="p-2 border-b text-right font-mono text-red-600">{MEDIUM_CUSTOMERS.monthlyProfitChange}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid gap-2 md:grid-cols-2 text-xs">
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200">
                <strong className="text-green-700">Best Customers:</strong> <span className="text-green-600">+{BEST_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/member/month</span>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded border border-orange-200">
                <strong className="text-orange-700">Medium Customers:</strong> <span className="text-red-600">{MEDIUM_CUSTOMERS.incrementalMonthlyValue.toFixed(2)} DKK/member/month</span>
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
                  <tr><td className="p-2 border-b font-medium">Frequency</td><td className="p-2 border-b text-muted-foreground">Orders per customer per month = Total Orders / Customer-Months</td></tr>
                  <tr><td className="p-2 font-medium">Monthly Profit</td><td className="p-2 text-muted-foreground">Frequency x Profit per Order = profit per member per month</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
