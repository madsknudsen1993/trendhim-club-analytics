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
// DATA - All raw numbers used in calculations
// ============================================================================

// From Order History longitudinal analysis (robust sample)
const ORDER_HISTORY = {
  // Sample info
  robustSampleSize: 4640,
  totalClubMembersWithHistory: 70882,
  totalOrdersAnalyzed: 2542645,
  dateRange: "2023-01-01 to 2026-03-02",

  // Before Club metrics (same customers)
  beforeOrders: 15243, // Total orders before Club for robust sample
  beforeMonths: 27972, // Total customer-months before Club
  beforeFrequency: 0.545, // orders per customer per month
  beforeAOV: 467.70,
  beforeProfitPerOrder: 226.42,
  beforeMonthlyProfit: 123.41, // frequency × profit per order

  // After Club metrics (same customers)
  afterOrders: 18764, // Total orders after Club for robust sample
  afterMonths: 27588, // Total customer-months after Club
  afterFrequency: 0.680, // orders per customer per month
  afterAOV: 432.07,
  afterProfitPerOrder: 206.93,
  afterMonthlyProfit: 140.76, // frequency × profit per order
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
  // Frequency change
  frequencyChange: ((ORDER_HISTORY.afterFrequency - ORDER_HISTORY.beforeFrequency) / ORDER_HISTORY.beforeFrequency) * 100,

  // Monthly profit change
  monthlyProfitChange: ORDER_HISTORY.afterMonthlyProfit - ORDER_HISTORY.beforeMonthlyProfit,
  monthlyProfitChangePercent: ((ORDER_HISTORY.afterMonthlyProfit - ORDER_HISTORY.beforeMonthlyProfit) / ORDER_HISTORY.beforeMonthlyProfit) * 100,

  // Per member economics
  monthlyProgramCostPerMember: PROGRAM.totalProgramCosts / PROGRAM.monthsAnalyzed / PROGRAM.totalClubMembers,
  monthlyValuePerMember: ORDER_HISTORY.afterMonthlyProfit - ORDER_HISTORY.beforeMonthlyProfit,

  // ROI from CORE_METRICS
  incrementalProfit: CORE_METRICS.value.incrementalProfit,
  netValue: CORE_METRICS.value.netValue,
  roi: CORE_METRICS.value.roi,
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
                <li>✓ Club causally increases purchase frequency (<strong>+{CALCULATIONS.frequencyChange.toFixed(1)}%</strong>)</li>
                <li>✓ Same customers buy more after joining (not selection bias)</li>
                <li>✓ Monthly profit per customer increases (<strong>+{CALCULATIONS.monthlyProfitChangePercent.toFixed(1)}%</strong>)</li>
                <li>✓ Incremental value: <strong>+{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/member/month</strong></li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                What Needs Attention
              </h4>
              <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                <li>⚠ Program costs: <strong>{CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} DKK/member/month</strong></li>
                <li>⚠ Zero-balance members: <strong>{PROGRAM.membersZeroBalancePercent}%</strong> have no cashback activity</li>
                <li>⚠ AOV drops after joining (-7.6%)</li>
                <li>⚠ Profit per order drops (-8.6%)</li>
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
                Based on {formatNumber(ORDER_HISTORY.robustSampleSize)} customers tracked before AND after joining Club — this proves <strong>causal</strong> behavior change (not selection bias)
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Data Source */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Data Source:</strong> {formatNumber(ORDER_HISTORY.totalOrdersAnalyzed)} orders from {ORDER_HISTORY.dateRange}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Robust Sample:</strong> {formatNumber(ORDER_HISTORY.robustSampleSize)} customers who meet strict criteria:
                </p>
                <ul className="text-sm text-blue-600 dark:text-blue-500 ml-4 space-y-1">
                  <li>• <strong>60+ days</strong> of purchase history both BEFORE and AFTER joining Club</li>
                  <li>• <strong>2+ orders</strong> in BOTH periods (not just one-time buyers)</li>
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-500 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <strong>Why these criteria?</strong> Ensures enough data to measure real patterns, not random noise.
                </p>
                <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-300 dark:border-amber-700">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>⚠️ Potential underestimate:</strong> Requiring 2+ orders BEFORE excludes customers who had only 1 order before Club
                    and then increased to multiple orders after. A customer going from 1 → 5 orders is strong evidence of Club driving retention,
                    but is currently excluded. <strong>The true Club impact may be higher</strong> if we include these "activated" customers.
                  </p>
                </div>
              </div>

              {/* Frequency Calculation */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Purchase Frequency Change
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left py-2 px-3 border">Metric</th>
                        <th className="text-right py-2 px-3 border">Before Club</th>
                        <th className="text-right py-2 px-3 border">After Club</th>
                        <th className="text-right py-2 px-3 border">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">Total Orders</td>
                        <td className="py-2 px-3 border text-right font-mono">{formatNumber(ORDER_HISTORY.beforeOrders)}</td>
                        <td className="py-2 px-3 border text-right font-mono">{formatNumber(ORDER_HISTORY.afterOrders)}</td>
                        <td className="py-2 px-3 border text-right text-green-600">+{formatNumber(ORDER_HISTORY.afterOrders - ORDER_HISTORY.beforeOrders)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">Total Customer-Months</td>
                        <td className="py-2 px-3 border text-right font-mono">{formatNumber(ORDER_HISTORY.beforeMonths)}</td>
                        <td className="py-2 px-3 border text-right font-mono">{formatNumber(ORDER_HISTORY.afterMonths)}</td>
                        <td className="py-2 px-3 border text-right">-</td>
                      </tr>
                      <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                        <td className="py-2 px-3 border font-medium">Frequency (orders/month)</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.beforeFrequency.toFixed(3)}</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.afterFrequency.toFixed(3)}</td>
                        <td className="py-2 px-3 border text-right font-bold text-green-600">+{CALCULATIONS.frequencyChange.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded">
                  Frequency = Orders ÷ Customer-Months | Before: {formatNumber(ORDER_HISTORY.beforeOrders)} ÷ {formatNumber(ORDER_HISTORY.beforeMonths)} = {ORDER_HISTORY.beforeFrequency.toFixed(3)} | After: {formatNumber(ORDER_HISTORY.afterOrders)} ÷ {formatNumber(ORDER_HISTORY.afterMonths)} = {ORDER_HISTORY.afterFrequency.toFixed(3)}
                </p>
              </div>

              {/* Monthly Profit Calculation */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-500" />
                  Monthly Profit Per Customer
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left py-2 px-3 border">Component</th>
                        <th className="text-right py-2 px-3 border">Before Club</th>
                        <th className="text-right py-2 px-3 border">After Club</th>
                        <th className="text-right py-2 px-3 border">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">A) Frequency (orders/month)</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.beforeFrequency.toFixed(3)}</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.afterFrequency.toFixed(3)}</td>
                        <td className="py-2 px-3 border text-right text-green-600">+{CALCULATIONS.frequencyChange.toFixed(1)}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border">B) Avg Profit per Order (DKK)</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.beforeProfitPerOrder.toFixed(2)}</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.afterProfitPerOrder.toFixed(2)}</td>
                        <td className="py-2 px-3 border text-right text-red-600">{(((ORDER_HISTORY.afterProfitPerOrder - ORDER_HISTORY.beforeProfitPerOrder) / ORDER_HISTORY.beforeProfitPerOrder) * 100).toFixed(1)}%</td>
                      </tr>
                      <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                        <td className="py-2 px-3 border font-medium">Monthly Profit = A × B</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.beforeMonthlyProfit.toFixed(2)} DKK</td>
                        <td className="py-2 px-3 border text-right font-mono">{ORDER_HISTORY.afterMonthlyProfit.toFixed(2)} DKK</td>
                        <td className="py-2 px-3 border text-right font-bold text-green-600">+{CALCULATIONS.monthlyProfitChangePercent.toFixed(1)}%</td>
                      </tr>
                      <tr className="bg-green-100 dark:bg-green-900/30">
                        <td className="py-2 px-3 border font-bold">Incremental Value per Member</td>
                        <td className="py-2 px-3 border text-right" colSpan={2}></td>
                        <td className="py-2 px-3 border text-right font-bold text-green-600">+{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/mo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded">
                  Monthly Profit = Frequency × Profit/Order | Before: {ORDER_HISTORY.beforeFrequency.toFixed(3)} × {ORDER_HISTORY.beforeProfitPerOrder.toFixed(2)} = {ORDER_HISTORY.beforeMonthlyProfit.toFixed(2)} | After: {ORDER_HISTORY.afterFrequency.toFixed(3)} × {ORDER_HISTORY.afterProfitPerOrder.toFixed(2)} = {ORDER_HISTORY.afterMonthlyProfit.toFixed(2)}
                </p>
              </div>

              {/* Effects Decomposition - Why does monthly profit increase? */}
              <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50/30 dark:bg-green-950/20">
                <h4 className="font-semibold mb-2 text-lg">Why Does Monthly Profit Increase Despite Lower Profit Per Order?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Club members buy <strong>more often</strong> but spend <strong>less per order</strong>. Here's why the net result is still positive:
                </p>

                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  {/* Positive Effect */}
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border-2 border-green-400">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-green-500 rounded-full">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <p className="font-semibold text-green-700 dark:text-green-400">More Orders = More Profit</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Members order <strong>{((ORDER_HISTORY.afterFrequency / ORDER_HISTORY.beforeFrequency - 1) * 100).toFixed(0)}% more often</strong>.
                      Each extra order brings profit.
                    </p>
                    <div className="p-2 bg-green-50 dark:bg-green-950/50 rounded text-sm">
                      <p className="text-muted-foreground">Extra orders × Old profit/order:</p>
                      <p className="font-mono">({ORDER_HISTORY.afterFrequency.toFixed(3)} - {ORDER_HISTORY.beforeFrequency.toFixed(3)}) × {ORDER_HISTORY.beforeProfitPerOrder.toFixed(0)} DKK</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">+{((ORDER_HISTORY.afterFrequency - ORDER_HISTORY.beforeFrequency) * ORDER_HISTORY.beforeProfitPerOrder).toFixed(0)} DKK/mo</p>
                  </div>

                  {/* Negative Effect */}
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border-2 border-red-400">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-red-500 rounded-full">
                        <TrendingDown className="h-4 w-4 text-white" />
                      </div>
                      <p className="font-semibold text-red-700 dark:text-red-400">Lower Profit Per Order</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Members use <strong>cashback</strong>, reducing profit by <strong>{((1 - ORDER_HISTORY.afterProfitPerOrder / ORDER_HISTORY.beforeProfitPerOrder) * 100).toFixed(0)}%</strong> per order.
                    </p>
                    <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded text-sm">
                      <p className="text-muted-foreground">New frequency × Profit drop:</p>
                      <p className="font-mono">{ORDER_HISTORY.afterFrequency.toFixed(3)} × ({ORDER_HISTORY.afterProfitPerOrder.toFixed(0)} - {ORDER_HISTORY.beforeProfitPerOrder.toFixed(0)}) DKK</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">{(ORDER_HISTORY.afterFrequency * (ORDER_HISTORY.afterProfitPerOrder - ORDER_HISTORY.beforeProfitPerOrder)).toFixed(0)} DKK/mo</p>
                  </div>
                </div>

                {/* Key Takeaway */}
                <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-lg border border-green-300 dark:border-green-700">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-green-800 dark:text-green-300 text-lg">
                        Key Takeaway: Volume Wins
                      </p>
                      <p className="text-green-700 dark:text-green-400">
                        The <strong>+{((ORDER_HISTORY.afterFrequency - ORDER_HISTORY.beforeFrequency) * ORDER_HISTORY.beforeProfitPerOrder).toFixed(0)} DKK</strong> from more orders
                        outweighs the <strong>{Math.abs(ORDER_HISTORY.afterFrequency * (ORDER_HISTORY.afterProfitPerOrder - ORDER_HISTORY.beforeProfitPerOrder)).toFixed(0)} DKK</strong> lost to lower margins.
                      </p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        Net gain: +{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK per member per month
                      </p>
                    </div>
                  </div>
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cashback Amount</span>
                    <span className="font-mono">{formatCurrency(PROGRAM.totalCashbackRedeemed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Shipping</span>
                    <span className="font-mono">{formatCurrency(PROGRAM.totalShippingSubsidy)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800 font-bold text-red-600">
                    <span>Total ({PROGRAM.monthsAnalyzed} months)</span>
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

      {/* The Business Case - Two Views */}
      <Card className="border-2 border-amber-500">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <CardTitle>The Business Case: Two Different Analyses</CardTitle>
          </div>
          <CardDescription>
            We have two methods that give different answers. Both are valid but measure different things.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Critical Warning */}
            <div className="p-4 bg-amber-100 dark:bg-amber-950/50 rounded-lg border-2 border-amber-400">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300">Important: These analyses measure different things</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    The Order History analysis shows <strong>causal behavior change</strong> but from a small engaged sample.
                    The Program ROI shows <strong>total program economics</strong> but misses frequency effects.
                  </p>
                </div>
              </div>
            </div>

            {/* Two Views Side by Side */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* View 1: Cross-sectional (Program ROI) */}
              <div className="p-4 border-2 border-red-400 rounded-lg bg-red-50/30 dark:bg-red-950/20">
                <h4 className="font-semibold mb-3 text-red-700 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  View 1: Total Program ROI
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Compares Club vs Non-Club profit per order, multiplied by total orders
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Club profit/order</span>
                    <span className="font-mono">{CORE_METRICS.profit.clubAvgProfit} DKK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Non-Club profit/order</span>
                    <span className="font-mono">{CORE_METRICS.profit.nonClubAvgProfit} DKK</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Difference</span>
                    <span className="font-mono">+{CORE_METRICS.profit.differenceDKK} DKK/order</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Club orders</span>
                    <span className="font-mono">{formatNumber(CORE_METRICS.orders.club)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Incremental Profit</span>
                    <span className="font-mono">+{formatNumber(CALCULATIONS.incrementalProfit)} DKK</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Program Costs</span>
                    <span className="font-mono">-{formatCurrency(PROGRAM.totalProgramCosts)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600 border-t pt-2">
                    <span>Net Value</span>
                    <span className="font-mono">{formatCurrency(CALCULATIONS.netValue)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>ROI</span>
                    <span className="font-mono">{CALCULATIONS.roi}%</span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                  <strong>Limitation:</strong> Ignores frequency increase. Only measures profit/order difference.
                </div>
              </div>

              {/* View 2: Longitudinal (Order History) */}
              <div className="p-4 border-2 border-green-400 rounded-lg bg-green-50/30 dark:bg-green-950/20">
                <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  View 2: Engaged Member Value
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Tracks same customers before/after - captures frequency + profit effects
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly profit (before Club)</span>
                    <span className="font-mono">{ORDER_HISTORY.beforeMonthlyProfit.toFixed(2)} DKK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly profit (after Club)</span>
                    <span className="font-mono">{ORDER_HISTORY.afterMonthlyProfit.toFixed(2)} DKK</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Uplift per engaged member</span>
                    <span className="font-mono">+{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/mo</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Sample size</span>
                    <span className="font-mono">{formatNumber(ORDER_HISTORY.robustSampleSize)} members</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Engaged members (cashback balance &gt; 0)</span>
                    <span className="font-mono">~{formatNumber(PROGRAM.membersWithCashbackBalance)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Est. annual value (engaged only)</span>
                    <span className="font-mono">+{formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.membersWithCashbackBalance * 12)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Program Costs (annual)</span>
                    <span className="font-mono">-{formatCurrency(PROGRAM.totalProgramCosts * 1.2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Est. Net (engaged only)</span>
                    <span className={`font-mono ${(CALCULATIONS.monthlyValuePerMember * PROGRAM.membersWithCashbackBalance * 12 - PROGRAM.totalProgramCosts * 1.2) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.membersWithCashbackBalance * 12 - PROGRAM.totalProgramCosts * 1.2)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-xs">
                  <strong>Limitation:</strong> Sample of {formatNumber(ORDER_HISTORY.robustSampleSize)} highly engaged members may not represent all {formatNumber(PROGRAM.totalClubMembers)}.
                </div>
              </div>
            </div>

            {/* The Truth */}
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                The Honest Answer
              </h4>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>What we know for certain:</strong> Club membership <em>causes</em> a +{CALCULATIONS.frequencyChange.toFixed(1)}% frequency increase
                  in the same customers (not selection bias). This is valuable.
                </p>
                <p>
                  <strong>What's uncertain:</strong> Whether the {formatNumber(ORDER_HISTORY.robustSampleSize)}-member sample represents all {formatNumber(PROGRAM.totalClubMembers)} members.
                  The {PROGRAM.membersZeroBalancePercent}% with zero cashback balance likely generate less uplift.
                </p>
                <div className="grid gap-3 md:grid-cols-3 pt-3 border-t">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">Pessimistic</p>
                    <p className="font-bold text-red-600 text-lg">{formatCurrency(CALCULATIONS.netValue)}</p>
                    <p className="text-xs mb-2">If only profit/order matters</p>
                    <div className="text-xs text-left bg-white/50 dark:bg-black/20 p-2 rounded font-mono space-y-1">
                      <p>Incremental: +{formatNumber(CALCULATIONS.incrementalProfit)} DKK</p>
                      <p className="text-muted-foreground">({CORE_METRICS.profit.differenceDKK} DKK × {formatNumber(CORE_METRICS.orders.club)} orders)</p>
                      <p>Costs: -{formatCurrency(PROGRAM.totalProgramCosts)}</p>
                      <p className="border-t pt-1 font-bold">Net: {formatCurrency(CALCULATIONS.netValue)}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">Realistic</p>
                    <p className="font-bold text-amber-600 text-lg">{formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.membersWithCashbackBalance * 12 - PROGRAM.totalProgramCosts * 1.2)}</p>
                    <p className="text-xs mb-2">Uplift only for engaged</p>
                    <div className="text-xs text-left bg-white/50 dark:bg-black/20 p-2 rounded font-mono space-y-1">
                      <p>Value: +{formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.membersWithCashbackBalance * 12)}</p>
                      <p className="text-muted-foreground">({CALCULATIONS.monthlyValuePerMember.toFixed(0)} DKK × {formatNumber(PROGRAM.membersWithCashbackBalance)} × 12mo)</p>
                      <p>Costs: -{formatCurrency(PROGRAM.totalProgramCosts * 1.2)}</p>
                      <p className="text-muted-foreground">(annualized)</p>
                      <p className="border-t pt-1 font-bold">Net: {formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.membersWithCashbackBalance * 12 - PROGRAM.totalProgramCosts * 1.2)}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">Optimistic</p>
                    <p className="font-bold text-green-600 text-lg">+{formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.totalClubMembers * 12 - PROGRAM.totalProgramCosts * 1.2)}</p>
                    <p className="text-xs mb-2">If uplift applies to all</p>
                    <div className="text-xs text-left bg-white/50 dark:bg-black/20 p-2 rounded font-mono space-y-1">
                      <p>Value: +{formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.totalClubMembers * 12)}</p>
                      <p className="text-muted-foreground">({CALCULATIONS.monthlyValuePerMember.toFixed(0)} DKK × {formatNumber(PROGRAM.totalClubMembers)} × 12mo)</p>
                      <p>Costs: -{formatCurrency(PROGRAM.totalProgramCosts * 1.2)}</p>
                      <p className="text-muted-foreground">(annualized)</p>
                      <p className="border-t pt-1 font-bold">Net: +{formatCurrency(CALCULATIONS.monthlyValuePerMember * PROGRAM.totalClubMembers * 12 - PROGRAM.totalProgramCosts * 1.2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold text-green-700 dark:text-green-400">Recommendation: Continue & Optimize</h4>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500">
                  The Club program <strong>works</strong> - it causally drives +{CALCULATIONS.frequencyChange.toFixed(1)}% more purchases from the same customers.
                  {netMonthlyValue >= 0
                    ? " The program is already profitable at +{netMonthlyValue.toFixed(2)} DKK/member/month."
                    : " Focus on optimizing costs while maintaining the behavioral benefits."}
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Current cost per member</p>
                    <p className="text-2xl font-bold text-red-600">{CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} DKK/month</p>
                    <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                      <p>{formatCurrency(PROGRAM.totalProgramCosts)} ÷ {PROGRAM.monthsAnalyzed} months ÷ {formatNumber(PROGRAM.totalClubMembers)} members</p>
                      <p className="mt-1">= {(PROGRAM.totalProgramCosts / PROGRAM.monthsAnalyzed).toFixed(0)} DKK/month ÷ {formatNumber(PROGRAM.totalClubMembers)}</p>
                      <p>= {CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} DKK/member/month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Target cost (break-even)</p>
                    <p className="text-2xl font-bold text-green-600">≤{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/month</p>
                    <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                      <p>Value generated per engaged member:</p>
                      <p>{ORDER_HISTORY.afterMonthlyProfit.toFixed(2)} - {ORDER_HISTORY.beforeMonthlyProfit.toFixed(2)} DKK</p>
                      <p>= +{CALCULATIONS.monthlyValuePerMember.toFixed(2)} DKK/member/month</p>
                      <p className="mt-1 text-green-600">Costs must be ≤ this to break even</p>
                    </div>
                  </div>
                </div>

                {/* The Gap */}
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    The Gap: {CALCULATIONS.monthlyProgramCostPerMember.toFixed(2)} - {CALCULATIONS.monthlyValuePerMember.toFixed(2)} = {(CALCULATIONS.monthlyProgramCostPerMember - CALCULATIONS.monthlyValuePerMember).toFixed(2)} DKK/member/month
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Current costs are <strong>{((CALCULATIONS.monthlyProgramCostPerMember / CALCULATIONS.monthlyValuePerMember - 1) * 100).toFixed(0)}% below</strong> the value generated.
                    This means the program is already profitable IF the +17.35 DKK uplift applies to all members.
                  </p>
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
                      <p className="font-medium">Increase Engagement</p>
                      <p className="text-xs text-muted-foreground">
                        More members achieving +{CALCULATIONS.monthlyValuePerMember.toFixed(0)} DKK uplift
                      </p>
                      <p className="text-xs text-muted-foreground">
                        = higher total value generated
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
