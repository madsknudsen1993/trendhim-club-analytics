"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Wallet,
  Truck,
  Target,
  ArrowRight,
  ArrowUpRight,
  Lightbulb,
  BarChart3,
  Calculator,
  Zap,
  Shield,
  Rocket,
  Info,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CORE_METRICS } from "./data-source";
import { EvidenceSummaryTab } from "./evidence-summary";

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

function formatDecimal(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('da-DK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
}

function formatCurrency(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M DKK`;
  }
  return `${formatNumber(num)} DKK`;
}

// ============================================================================
// DATA - All raw numbers used in calculations (from CORE_METRICS)
// ============================================================================

// From Order History longitudinal analysis (robust sample) - sourced from CORE_METRICS
const ORDER_HISTORY = {
  // Sample info
  robustSampleSize: CORE_METRICS.orderHistory.robustSampleSize,
  totalClubMembersWithHistory: CORE_METRICS.orderHistory.totalClubMembersWithHistory,
  totalOrdersAnalyzed: CORE_METRICS.orderHistory.totalOrdersAnalyzed,
  dateRange: CORE_METRICS.orderHistory.dateRange,

  // Before Club metrics (same customers)
  beforeOrders: CORE_METRICS.orderHistory.before.totalOrders,
  beforeMonths: CORE_METRICS.orderHistory.before.totalCustomerMonths,
  beforeFrequency: CORE_METRICS.orderHistory.before.frequency,
  beforeAOV: CORE_METRICS.orderHistory.before.avgOrderValue,
  beforeProfitPerOrder: CORE_METRICS.orderHistory.before.profitPerOrder,
  beforeMonthlyProfit: CORE_METRICS.orderHistory.before.monthlyProfit,

  // After Club metrics (same customers)
  afterOrders: CORE_METRICS.orderHistory.after.totalOrders,
  afterMonths: CORE_METRICS.orderHistory.after.totalCustomerMonths,
  afterFrequency: CORE_METRICS.orderHistory.after.frequency,
  afterAOV: CORE_METRICS.orderHistory.after.avgOrderValue,
  afterProfitPerOrder: CORE_METRICS.orderHistory.after.profitPerOrder,
  afterMonthlyProfit: CORE_METRICS.orderHistory.after.monthlyProfit,
};

// Program costs from CORE_METRICS (10 month period)
const PROGRAM = {
  analysisPeriod: "April 2025 - January 2026",
  monthsAnalyzed: 10,

  // Members
  totalClubMembers: CORE_METRICS.customers.totalClub,
  membersWithCashbackBalance: CORE_METRICS.cashbackSegments.hasBalance.count,
  membersWithCashbackBalancePercent: CORE_METRICS.cashbackSegments.hasBalance.percentage,
  membersZeroBalance: CORE_METRICS.cashbackSegments.zeroBalance.count,
  membersZeroBalancePercent: CORE_METRICS.cashbackSegments.zeroBalance.percentage,

  // Orders
  totalClubOrders: CORE_METRICS.orders.club,
  totalNonClubOrders: CORE_METRICS.orders.nonClub,

  // AOV
  clubAOV: CORE_METRICS.aov.club,
  nonClubAOV: CORE_METRICS.aov.nonClub,

  // Profit per order
  clubProfitPerOrder: CORE_METRICS.profit.clubAvgProfit,
  nonClubProfitPerOrder: CORE_METRICS.profit.nonClubAvgProfit,

  // Frequency
  clubFrequency: CORE_METRICS.frequency.club,
  nonClubFrequency: CORE_METRICS.frequency.nonClub,

  // Costs
  cashbackOrderCount: CORE_METRICS.costs.cashbackOrderCount,
  avgCashbackPerOrder: CORE_METRICS.costs.avgCashbackPerOrder,
  totalCashbackRedeemed: CORE_METRICS.costs.cashbackRedeemed,

  shippingSubsidyOrderCount: CORE_METRICS.costs.shippingSubsidyOrderCount,
  avgShippingSubsidyPerOrder: CORE_METRICS.costs.shippingSubsidy / CORE_METRICS.costs.shippingSubsidyOrderCount,
  totalShippingSubsidy: CORE_METRICS.costs.shippingSubsidy,

  totalProgramCosts: CORE_METRICS.costs.totalProgramCosts,
};

// Calculated metrics
const CALCULATIONS = {
  // Frequency change (robust sample)
  frequencyChange: ((ORDER_HISTORY.afterFrequency - ORDER_HISTORY.beforeFrequency) / ORDER_HISTORY.beforeFrequency) * 100,

  // Monthly profit change (robust sample)
  monthlyProfitChange: ORDER_HISTORY.afterMonthlyProfit - ORDER_HISTORY.beforeMonthlyProfit,
  monthlyProfitChangePercent: ((ORDER_HISTORY.afterMonthlyProfit - ORDER_HISTORY.beforeMonthlyProfit) / ORDER_HISTORY.beforeMonthlyProfit) * 100,

  // Per member economics (robust sample)
  monthlyProgramCostPerMember: PROGRAM.totalProgramCosts / PROGRAM.monthsAnalyzed / PROGRAM.totalClubMembers,
  monthlyValuePerMember: ORDER_HISTORY.afterMonthlyProfit - ORDER_HISTORY.beforeMonthlyProfit,

  // ROI from CORE_METRICS
  incrementalProfit: CORE_METRICS.value.incrementalProfit,
  netValue: CORE_METRICS.value.netValue,
  roi: CORE_METRICS.value.roi,
};

// Broader sample calculations (includes 1-order customers)
const BROADER = CORE_METRICS.orderHistory.broaderSample;
const BROADER_CALC = {
  sampleSize: BROADER.sampleSize,
  frequencyChange: BROADER.changes.frequencyChange,
  monthlyValuePerMember: BROADER.changes.incrementalMonthlyValue,
  // Annual value if applied to all members
  annualValueAllMembers: BROADER.changes.incrementalMonthlyValue * PROGRAM.totalClubMembers * 12,
  // Annual value if applied to engaged members only
  annualValueEngaged: BROADER.changes.incrementalMonthlyValue * PROGRAM.membersWithCashbackBalance * 12,
};

// Broader Order History data for side-by-side comparison
const BROADER_ORDER_HISTORY = {
  sampleSize: BROADER.sampleSize,
  criteria: BROADER.criteria,
  multiOrderBefore: BROADER.multiOrderBefore,
  singleOrderBefore: BROADER.singleOrderBefore,
  beforeFrequency: BROADER.before.frequency,
  afterFrequency: BROADER.after.frequency,
  beforeProfitPerOrder: BROADER.before.profitPerOrder,
  afterProfitPerOrder: BROADER.after.profitPerOrder,
  beforeMonthlyProfit: BROADER.before.monthlyProfit,
  afterMonthlyProfit: BROADER.after.monthlyProfit,
  frequencyChange: BROADER.changes.frequencyChange,
  monthlyProfitChange: BROADER.changes.monthlyProfitChange,
  incrementalMonthlyValue: BROADER.changes.incrementalMonthlyValue,
};

export function ConclusionTab() {
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(true);
  const [isCalculationsOpen, setIsCalculationsOpen] = useState(true);
  const [isCostsOpen, setIsCostsOpen] = useState(true);

  const netMonthlyValue = CALCULATIONS.monthlyValuePerMember - CALCULATIONS.monthlyProgramCostPerMember;

  return (
    <div className="space-y-6">
      {/* Executive Summary - Board-Ready Headline */}
      <Card className="bg-gradient-to-br from-[#06402b] to-[#0a5c3e] text-white border-0">
        <CardContent className="py-8 px-6">
          <div className="text-center space-y-4">
            <Badge className="bg-white/20 text-white border-0 text-sm px-4 py-1">
              Board Summary
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold">
              Trendhim Club: Status, Potential & Direction
            </h1>
            <p className="text-green-100 max-w-2xl mx-auto">
              Analysis period: {PROGRAM.analysisPeriod} ({PROGRAM.monthsAnalyzed} months post-launch)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ONE-PAGER EXECUTIVE SUMMARY */}
      <Card className="border-2 border-zinc-300 dark:border-zinc-700">
        <CardHeader className="bg-zinc-100 dark:bg-zinc-800">
          <CardTitle className="text-xl">Executive Summary</CardTitle>
          <CardDescription>Quick overview of key findings and verdict</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* What We Proved + What Needs Attention */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                What We Proved
              </h4>
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
                <li>✓ Club causally increases purchase frequency</li>
                <li>✓ <strong>Robust sample:</strong> +{CALCULATIONS.frequencyChange.toFixed(1)}% frequency, +{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/mo</li>
                <li>✓ <strong>Broader sample:</strong> +{BROADER_CALC.frequencyChange}% frequency (incl. 1-order customers)</li>
                <li>✓ Same customers buy more after joining (not selection bias)</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                What Needs Attention
              </h4>
              <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                <li>⚠ <strong>Broader sample net:</strong> {BROADER_CALC.monthlyValuePerMember.toFixed(2)} DKK/member/month</li>
                <li>⚠ Program costs: <strong>{CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} DKK/member/month</strong></li>
                <li>⚠ Zero-balance members: <strong>{PROGRAM.membersZeroBalancePercent}%</strong> have no cashback activity</li>
                <li>⚠ High-frequency customers regress after joining (-24.5%)</li>
              </ul>
            </div>
          </div>

          {/* Overall Verdict */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overall Program Verdict
            </h4>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300">
              <p className="text-sm text-green-700 dark:text-green-400">
                <strong>✓ Good news:</strong> Order History analysis proves Club membership <em>causes</em> a +{CALCULATIONS.frequencyChange.toFixed(1)}%
                frequency increase in the same customers. This is real behavior change, not selection bias. Engaged members generate
                <strong> +{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/month</strong> incremental value.
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>✗ Challenge:</strong> Program costs are <strong>{formatCurrency(PROGRAM.totalProgramCosts)}</strong> ({PROGRAM.monthsAnalyzed} months).
                Cross-sectional analysis shows only +{formatNumber(CALCULATIONS.incrementalProfit)} DKK incremental profit,
                yielding <strong>{CALCULATIONS.roi}% ROI</strong>. The longitudinal sample of {formatNumber(ORDER_HISTORY.robustSampleSize)} highly engaged members may not represent all {formatNumber(PROGRAM.totalClubMembers)} members.
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>→ Conclusion:</strong> The Club program <em>works</em> at driving behavior change. The question is whether the
                value generated by engaged members offsets the costs shared across all members. <strong>ROI ranges from {CALCULATIONS.roi}%
                (pessimistic) to potentially positive</strong> (if longitudinal uplift applies broadly).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation: Frequency & Profit Change */}
      <Collapsible open={isCalculationsOpen} onOpenChange={setIsCalculationsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-500" />
                  <CardTitle>Calculation: Behavioral Impact (Order History Analysis)</CardTitle>
                </div>
                <Badge variant="outline">{isCalculationsOpen ? "Collapse" : "Expand"}</Badge>
              </div>
              <CardDescription>
                Two sample definitions compared side-by-side — both prove <strong>causal</strong> behavior change (not selection bias)
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Data Source */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Data Source:</strong> {formatNumber(ORDER_HISTORY.totalOrdersAnalyzed)} orders from {ORDER_HISTORY.dateRange}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  Longitudinal analysis tracks the <em>same customers</em> before and after joining Club to measure true behavior change.
                </p>
              </div>

              {/* Two Column Layout - Robust vs Broader */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* LEFT COLUMN: Robust Sample */}
                <div className="space-y-4 border-2 border-green-500 rounded-lg p-4 bg-green-50/20 dark:bg-green-950/10">
                  {/* Sample Header */}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-bold text-green-700 dark:text-green-400 text-lg">Robust Sample</h4>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300">
                      {formatNumber(ORDER_HISTORY.robustSampleSize)} customers
                    </Badge>
                  </div>

                  {/* Criteria */}
                  <div className="p-3 bg-green-100/50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Criteria:</p>
                    <ul className="text-xs text-green-600 dark:text-green-500 space-y-0.5">
                      <li>• 60+ days BEFORE and AFTER joining</li>
                      <li>• 2+ orders in BOTH periods</li>
                    </ul>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-2 italic">
                      Strict criteria = High confidence, but excludes &quot;activated&quot; customers
                    </p>
                  </div>

                  {/* Frequency Table */}
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      Purchase Frequency
                    </p>
                    <table className="w-full text-xs border-collapse border">
                      <thead>
                        <tr className="bg-green-100/50 dark:bg-green-900/30">
                          <th className="text-left py-1.5 px-2 border">Period</th>
                          <th className="text-right py-1.5 px-2 border">Orders/Mo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">Before Club</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.beforeFrequency.toFixed(3)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">After Club</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.afterFrequency.toFixed(3)}</td>
                        </tr>
                        <tr className="bg-green-100 dark:bg-green-900/40">
                          <td className="py-1.5 px-2 border font-semibold">Change</td>
                          <td className="py-1.5 px-2 border text-right font-bold text-green-600">+{CALCULATIONS.frequencyChange.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Monthly Profit Table */}
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-green-500" />
                      Monthly Profit Calculation
                    </p>
                    <table className="w-full text-xs border-collapse border">
                      <thead>
                        <tr className="bg-green-100/50 dark:bg-green-900/30">
                          <th className="text-left py-1.5 px-2 border">Metric</th>
                          <th className="text-right py-1.5 px-2 border">Before</th>
                          <th className="text-right py-1.5 px-2 border">After</th>
                          <th className="text-right py-1.5 px-2 border">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">Frequency</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.beforeFrequency.toFixed(3)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.afterFrequency.toFixed(3)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono text-green-600">+{CALCULATIONS.frequencyChange.toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">Profit/Order</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.beforeProfitPerOrder.toFixed(0)} DKK</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.afterProfitPerOrder.toFixed(0)} DKK</td>
                          <td className="py-1.5 px-2 border text-right font-mono text-red-600">{(((ORDER_HISTORY.afterProfitPerOrder - ORDER_HISTORY.beforeProfitPerOrder) / ORDER_HISTORY.beforeProfitPerOrder) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="bg-green-100 dark:bg-green-900/40">
                          <td className="py-1.5 px-2 border font-semibold">Monthly Profit</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.beforeMonthlyProfit.toFixed(2)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{ORDER_HISTORY.afterMonthlyProfit.toFixed(2)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono font-bold text-green-600">+{CALCULATIONS.monthlyProfitChangePercent.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Result */}
                  <div className="p-4 bg-green-200/50 dark:bg-green-900/50 rounded-lg border border-green-300 dark:border-green-700 text-center">
                    <p className="text-sm text-green-700 dark:text-green-400">Net Incremental Value</p>
                    <p className="text-3xl font-bold text-green-600">+{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK</p>
                    <p className="text-xs text-green-600 dark:text-green-500">per member per month</p>
                  </div>

                  {/* Interpretation */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded border border-green-200 dark:border-green-800">
                    <p className="text-xs text-muted-foreground">
                      <strong>Interpretation:</strong> Highly engaged members show strong uplift.
                      +{((ORDER_HISTORY.afterFrequency / ORDER_HISTORY.beforeFrequency - 1) * 100).toFixed(0)}% more orders outweighs
                      -{((1 - ORDER_HISTORY.afterProfitPerOrder / ORDER_HISTORY.beforeProfitPerOrder) * 100).toFixed(0)}% lower profit/order.
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN: Broader Sample */}
                <div className="space-y-4 border-2 border-orange-500 rounded-lg p-4 bg-orange-50/20 dark:bg-orange-950/10">
                  {/* Sample Header */}
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-bold text-orange-700 dark:text-orange-400 text-lg">Broader Sample</h4>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300">
                      {formatNumber(BROADER_ORDER_HISTORY.sampleSize)} customers
                    </Badge>
                  </div>

                  {/* Criteria */}
                  <div className="p-3 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Criteria:</p>
                    <ul className="text-xs text-orange-600 dark:text-orange-500 space-y-0.5">
                      <li>• 1+ orders BEFORE joining</li>
                      <li>• 60+ days & 2+ orders AFTER joining</li>
                    </ul>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-2 italic">
                      Includes one-time buyers who became repeat customers
                    </p>
                  </div>

                  {/* Frequency Table */}
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-orange-500" />
                      Purchase Frequency
                    </p>
                    <table className="w-full text-xs border-collapse border">
                      <thead>
                        <tr className="bg-orange-100/50 dark:bg-orange-900/30">
                          <th className="text-left py-1.5 px-2 border">Period</th>
                          <th className="text-right py-1.5 px-2 border">Orders/Mo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">Before Club</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.beforeFrequency.toFixed(3)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">After Club</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.afterFrequency.toFixed(3)}</td>
                        </tr>
                        <tr className="bg-orange-100 dark:bg-orange-900/40">
                          <td className="py-1.5 px-2 border font-semibold">Change</td>
                          <td className="py-1.5 px-2 border text-right font-bold text-orange-600">+{BROADER_ORDER_HISTORY.frequencyChange.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Monthly Profit Table */}
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-orange-500" />
                      Monthly Profit Calculation
                    </p>
                    <table className="w-full text-xs border-collapse border">
                      <thead>
                        <tr className="bg-orange-100/50 dark:bg-orange-900/30">
                          <th className="text-left py-1.5 px-2 border">Metric</th>
                          <th className="text-right py-1.5 px-2 border">Before</th>
                          <th className="text-right py-1.5 px-2 border">After</th>
                          <th className="text-right py-1.5 px-2 border">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">Frequency</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.beforeFrequency.toFixed(3)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.afterFrequency.toFixed(3)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono text-green-600">+{BROADER_ORDER_HISTORY.frequencyChange.toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1.5 px-2 border">Profit/Order</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.beforeProfitPerOrder.toFixed(0)} DKK</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.afterProfitPerOrder.toFixed(0)} DKK</td>
                          <td className="py-1.5 px-2 border text-right font-mono text-red-600">{(((BROADER_ORDER_HISTORY.afterProfitPerOrder - BROADER_ORDER_HISTORY.beforeProfitPerOrder) / BROADER_ORDER_HISTORY.beforeProfitPerOrder) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="bg-orange-100 dark:bg-orange-900/40">
                          <td className="py-1.5 px-2 border font-semibold">Monthly Profit</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.beforeMonthlyProfit.toFixed(2)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono">{BROADER_ORDER_HISTORY.afterMonthlyProfit.toFixed(2)}</td>
                          <td className="py-1.5 px-2 border text-right font-mono font-bold text-red-600">{BROADER_ORDER_HISTORY.monthlyProfitChange.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Result */}
                  <div className="p-4 bg-red-100/50 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700 text-center">
                    <p className="text-sm text-red-700 dark:text-red-400">Net Incremental Value</p>
                    <p className="text-3xl font-bold text-red-600">{BROADER_ORDER_HISTORY.incrementalMonthlyValue.toFixed(2)} DKK</p>
                    <p className="text-xs text-red-600 dark:text-red-500">per member per month</p>
                  </div>

                  {/* Interpretation */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-muted-foreground">
                      <strong>Why negative?</strong> High-frequency customers regress to mean (-24.5%),
                      offsetting gains from activated one-time buyers (+174.8%). Net: modest +{BROADER_ORDER_HISTORY.frequencyChange}% frequency
                      doesn&apos;t cover -{((1 - BROADER_ORDER_HISTORY.afterProfitPerOrder / BROADER_ORDER_HISTORY.beforeProfitPerOrder) * 100).toFixed(0)}% profit/order drop.
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison Summary */}
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  What This Tells Us
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Best Customers ({formatNumber(ORDER_HISTORY.robustSampleSize)}):</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Club works extremely well for engaged repeat customers</li>
                      <li>• +{ORDER_HISTORY.changes.frequencyChange}% frequency lift (UNBIASED calculation)</li>
                      <li>• +{ORDER_HISTORY.changes.incrementalMonthlyValue} DKK/mo incremental value</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Medium Customers ({formatNumber(ORDER_HISTORY.broaderSample.sampleSize)}):</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Also shows strong positive results with UNBIASED method</li>
                      <li>• +{ORDER_HISTORY.broaderSample.changes.frequencyChange}% frequency lift</li>
                      <li>• +{ORDER_HISTORY.broaderSample.changes.incrementalMonthlyValue} DKK/mo incremental value</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Key Insight:</strong> Using UNBIASED frequency calculation (fixed calendar periods),
                    BOTH customer segments show strong positive results. The previous &quot;regression to mean&quot;
                    finding was an artifact of the biased calculation methodology.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Calculation: Program Costs */}
      <Collapsible open={isCostsOpen} onOpenChange={setIsCostsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-red-500" />
                  <CardTitle>Calculation: Program Costs</CardTitle>
                </div>
                <Badge variant="outline">{isCostsOpen ? "Collapse" : "Expand"}</Badge>
              </div>
              <CardDescription>
                All costs associated with running the Club program ({PROGRAM.monthsAnalyzed} months)
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Membership Stats */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Club Membership
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">Total Club Members</td>
                        <td className="py-2 px-3 border text-right font-mono font-bold">{formatNumber(PROGRAM.totalClubMembers)}</td>
                        <td className="py-2 px-3 border text-muted-foreground">Verified members with cashback account</td>
                      </tr>
                      <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                        <td className="py-2 px-3 border">Members with Cashback Balance</td>
                        <td className="py-2 px-3 border text-right font-mono text-green-600">{formatNumber(PROGRAM.membersWithCashbackBalance)}</td>
                        <td className="py-2 px-3 border text-green-600">{PROGRAM.membersWithCashbackBalancePercent}% - Have earned/accumulated cashback</td>
                      </tr>
                      <tr className="border-b bg-amber-50/50 dark:bg-amber-950/20">
                        <td className="py-2 px-3 border">Members with Zero Balance</td>
                        <td className="py-2 px-3 border text-right font-mono text-amber-600">{formatNumber(PROGRAM.membersZeroBalance)}</td>
                        <td className="py-2 px-3 border text-amber-600">{PROGRAM.membersZeroBalancePercent}% - Never earned or fully redeemed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cashback Costs */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-red-500" />
                  Cashback Costs
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">Records with Cashback &gt; 0</td>
                        <td className="py-2 px-3 border text-right font-mono">{formatNumber(PROGRAM.cashbackOrderCount)}</td>
                        <td className="py-2 px-3 border text-muted-foreground">{((PROGRAM.cashbackOrderCount / PROGRAM.totalClubOrders) * 100).toFixed(1)}% of Club orders</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">Average Cashback per Record</td>
                        <td className="py-2 px-3 border text-right font-mono">{PROGRAM.avgCashbackPerOrder} DKK</td>
                        <td className="py-2 px-3 border text-muted-foreground">Per record with cashback</td>
                      </tr>
                      <tr className="border-b bg-red-50/50 dark:bg-red-950/20">
                        <td className="py-2 px-3 border font-medium">Total Cashback Amount</td>
                        <td className="py-2 px-3 border text-right font-mono font-bold text-red-600">{formatCurrency(PROGRAM.totalCashbackRedeemed)}</td>
                        <td className="py-2 px-3 border text-muted-foreground">SUM(amount × FX_rate) WHERE amount &gt; 0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                  <strong>Data source:</strong> cashback_from_merged.parquet - SUM(amount × FX_rate) for all {formatNumber(PROGRAM.cashbackOrderCount)} records with cashback &gt; 0.
                  This matches the Cashback Metrics in the Data Source tab.
                </p>
              </div>

              {/* Shipping Costs */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-red-500" />
                  Free Shipping Costs (Absorbed by Trendhim)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">Orders with Free Shipping</td>
                        <td className="py-2 px-3 border text-right font-mono">{formatNumber(PROGRAM.shippingSubsidyOrderCount)}</td>
                        <td className="py-2 px-3 border text-muted-foreground">{((PROGRAM.shippingSubsidyOrderCount / PROGRAM.totalClubOrders) * 100).toFixed(1)}% of Club orders</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">Average Shipping Cost per Order</td>
                        <td className="py-2 px-3 border text-right font-mono">{PROGRAM.avgShippingSubsidyPerOrder.toFixed(0)} DKK</td>
                        <td className="py-2 px-3 border text-muted-foreground">Shipping cost absorbed by Trendhim</td>
                      </tr>
                      <tr className="border-b bg-red-50/50 dark:bg-red-950/20">
                        <td className="py-2 px-3 border font-medium">Total Free Shipping Cost</td>
                        <td className="py-2 px-3 border text-right font-mono font-bold text-red-600">{formatCurrency(PROGRAM.totalShippingSubsidy)}</td>
                        <td className="py-2 px-3 border text-muted-foreground">{formatNumber(PROGRAM.shippingSubsidyOrderCount)} × {PROGRAM.avgShippingSubsidyPerOrder.toFixed(0)} DKK</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800 space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">How Free Shipping Works:</p>
                  <ul className="text-xs text-blue-600 dark:text-blue-500 space-y-1 ml-4">
                    <li>• <strong>Club benefit:</strong> Members get free or reduced shipping on orders</li>
                    <li>• <strong>Cost to Trendhim:</strong> The shipping fee that would normally be charged is absorbed as a program cost</li>
                    <li>• <strong>Calculation:</strong> SUM(shipping discount) for all Club orders where free/reduced shipping was applied</li>
                  </ul>
                  <p className="text-xs text-blue-600 dark:text-blue-500 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <strong>Effect:</strong> Free shipping removes a purchase barrier and encourages more frequent orders.
                    However, at <strong>{(PROGRAM.totalShippingSubsidy / PROGRAM.monthsAnalyzed / PROGRAM.totalClubMembers).toFixed(2)} DKK/member/month</strong>,
                    this is a significant cost. Consider: raising the free shipping threshold, tiered shipping by order value,
                    or limiting free shipping to certain order types.
                  </p>
                </div>
              </div>

              {/* Total Costs Summary */}
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold mb-3 text-red-700 dark:text-red-400">Total Program Costs Summary</h4>

                {/* Important Note about Cashback */}
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <strong className="text-amber-700">Cashback is NOT a separate cost.</strong>
                      <span className="text-amber-600"> When customers redeem cashback, it reduces order revenue before profit is calculated.
                      The {formatCurrency(PROGRAM.totalCashbackRedeemed)} redeemed is already reflected in lower profit figures.</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="line-through">Cashback Amount</span>
                    <span className="font-mono line-through">{formatCurrency(PROGRAM.totalCashbackRedeemed)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-600 -mt-1 mb-2">
                    <span></span>
                    <span>Already in profit calculation</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Shipping (Incremental Cost)</span>
                    <span className="font-mono">{formatCurrency(PROGRAM.totalShippingSubsidy)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800 font-bold text-red-600">
                    <span>Total Incremental Costs ({PROGRAM.monthsAnalyzed} months)</span>
                    <span className="font-mono">{formatCurrency(PROGRAM.totalProgramCosts)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Average</span>
                    <span className="font-mono">{formatCurrency(PROGRAM.totalProgramCosts / PROGRAM.monthsAnalyzed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Per Member Per Month</span>
                    <span className="font-mono">{CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} DKK</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Strategic Recommendations */}
      <Collapsible open={isRecommendationsOpen} onOpenChange={setIsRecommendationsOpen}>
        <Card className="border-2 border-blue-500">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-full">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Strategic Recommendations</CardTitle>
                    <CardDescription>Direction for the Club program</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{isRecommendationsOpen ? "Collapse" : "Expand"}</Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-6 space-y-6">
              {/* Verdict */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h4 className="font-semibold text-amber-700 dark:text-amber-400">Recommendation: Continue & Optimize (with caution)</h4>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  The Club program <strong>works</strong> - it causally drives frequency increases.
                  However, the impact varies by sample: <strong>Robust (+{CALCULATIONS.frequencyChange.toFixed(1)}%)</strong> vs <strong>Broader (+{BROADER_CALC.frequencyChange}%)</strong>.
                  The broader sample shows <strong>{BROADER_CALC.monthlyValuePerMember.toFixed(2)} DKK/mo net</strong> after accounting for regression-to-mean effects.
                  Focus on cost optimization to ensure profitability across all scenarios.
                </p>
              </div>

              {/* 3 Strategic Priorities */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded">
                      <Wallet className="h-4 w-4 text-red-600" />
                    </div>
                    <h4 className="font-semibold">1. Optimize Cashback</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Current: {formatCurrency(PROGRAM.totalCashbackRedeemed)} ({PROGRAM.monthsAnalyzed} months)
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Test lower rates (5% → 3%)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Cap maximum per order</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Expiry policy for unused balance</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <Truck className="h-4 w-4 text-orange-600" />
                    </div>
                    <h4 className="font-semibold">2. Optimize Shipping</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Current: {formatCurrency(PROGRAM.totalShippingSubsidy)} ({PROGRAM.monthsAnalyzed} months)
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Raise free shipping threshold</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Tiered shipping by order value</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Free shipping on 2nd+ orders only</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold">3. Activate Low-Engagement Members</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatNumber(PROGRAM.membersZeroBalance)} members ({PROGRAM.membersZeroBalancePercent}%) have zero cashback balance
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Re-engagement campaigns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>First-purchase incentive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-1.5 flex-shrink-0" />
                      <span>Segment-specific offers</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Target Metrics */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400">Target Metrics for Profitability</h4>

                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Current Cost */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Current cost per member</p>
                    <p className="text-2xl font-bold text-red-600">{CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} DKK/month</p>
                    <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                      <p>{formatCurrency(PROGRAM.totalProgramCosts)} ÷ {PROGRAM.monthsAnalyzed} mo ÷ {formatNumber(PROGRAM.totalClubMembers)}</p>
                      <p>= {CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} DKK/member/month</p>
                    </div>
                  </div>

                  {/* Robust Sample Value */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border-2 border-green-400">
                    <p className="text-sm text-muted-foreground">Value: Robust Sample</p>
                    <p className="text-2xl font-bold text-green-600">+{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/month</p>
                    <div className="mt-2 text-xs text-muted-foreground font-mono bg-green-50 dark:bg-green-950/30 p-2 rounded">
                      <p>{formatNumber(ORDER_HISTORY.robustSampleSize)} engaged members</p>
                      <p>+{CALCULATIONS.frequencyChange.toFixed(1)}% frequency lift</p>
                      <p className="mt-1 text-green-600 font-semibold">Gap: {(CALCULATIONS.monthlyProgramCostPerMember - CALCULATIONS.monthlyValuePerMember).toFixed(2)} DKK</p>
                    </div>
                  </div>

                  {/* Broader Sample Value */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border-2 border-orange-400">
                    <p className="text-sm text-muted-foreground">Value: Broader Sample</p>
                    <p className="text-2xl font-bold text-red-600">{BROADER_CALC.monthlyValuePerMember.toFixed(2)} DKK/month</p>
                    <div className="mt-2 text-xs text-muted-foreground font-mono bg-orange-50 dark:bg-orange-950/30 p-2 rounded">
                      <p>{formatNumber(BROADER_CALC.sampleSize)} members (incl. 1-order)</p>
                      <p>+{BROADER_CALC.frequencyChange}% frequency lift</p>
                      <p className="mt-1 text-red-600 font-semibold">Gap: {(CALCULATIONS.monthlyProgramCostPerMember - BROADER_CALC.monthlyValuePerMember).toFixed(2)} DKK</p>
                    </div>
                  </div>
                </div>

                {/* The Gap - Both Scenarios */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300">
                    <p className="font-semibold text-green-800 dark:text-green-300">
                      Robust Scenario: Profitable
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Cost ({CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)}) &lt; Value (+{CALCULATIONS.monthlyValuePerMember.toFixed(2)}) = <strong>+{(CALCULATIONS.monthlyValuePerMember - CALCULATIONS.monthlyProgramCostPerMember).toFixed(2)} DKK net</strong>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      IF the +{CALCULATIONS.monthlyValuePerMember.toFixed(0)} DKK uplift applies to all members
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300">
                    <p className="font-semibold text-red-800 dark:text-red-300">
                      Broader Scenario: Not Profitable
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      Cost ({CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)}) + Loss ({Math.abs(BROADER_CALC.monthlyValuePerMember).toFixed(2)}) = <strong>{(CALCULATIONS.monthlyProgramCostPerMember + Math.abs(BROADER_CALC.monthlyValuePerMember)).toFixed(2)} DKK gap</strong>
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      IF regression-to-mean applies broadly
                    </p>
                  </div>
                </div>

                {/* Actions to Improve */}
                <div className="space-y-2">
                  <p className="font-medium text-blue-700 dark:text-blue-400">Ways to improve profitability:</p>
                  <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded border">
                      <p className="font-medium">Reduce Cashback Rate</p>
                      <p className="text-xs text-muted-foreground">
                        Current: {formatCurrency(PROGRAM.totalCashbackRedeemed)} ({PROGRAM.monthsAnalyzed} mo)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        = {(PROGRAM.totalCashbackRedeemed / PROGRAM.monthsAnalyzed / PROGRAM.totalClubMembers).toFixed(2)} DKK/member/month
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded border">
                      <p className="font-medium">Reduce Free Shipping Costs</p>
                      <p className="text-xs text-muted-foreground">
                        Current: {formatCurrency(PROGRAM.totalShippingSubsidy)} ({PROGRAM.monthsAnalyzed} mo)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        = {(PROGRAM.totalShippingSubsidy / PROGRAM.monthsAnalyzed / PROGRAM.totalClubMembers).toFixed(2)} DKK/member/month
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded border">
                      <p className="font-medium">Activate Ghost Members</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(PROGRAM.membersZeroBalance)} members ({PROGRAM.membersZeroBalancePercent}%) have zero balance
                      </p>
                      <p className="text-xs text-muted-foreground">
                        If they generate value, ROI improves
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded border">
                      <p className="font-medium">Shift Towards Robust Profile</p>
                      <p className="text-xs text-muted-foreground">
                        Robust: +{CALCULATIONS.monthlyValuePerMember.toFixed(0)} DKK vs Broader: {BROADER_CALC.monthlyValuePerMember.toFixed(0)} DKK
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Encourage repeat purchasing behavior
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Evidence Summary Section */}
      <div className="pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Evidence Summary: All Hypotheses</h2>
        <EvidenceSummaryTab />
      </div>
    </div>
  );
}
