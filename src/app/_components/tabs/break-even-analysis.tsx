"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Calculator,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CORE_METRICS } from "./data-source";

interface ProgramData {
  netValue: number;             // Negative with median (typical order less profitable)
  monthlyNetLoss: number;       // Monthly loss (positive number representing loss)
  extraProfitPerOrder: number;  // -15 DKK with median
  currentClubFrequency: number;
  nonClubFrequency: number;
  clubOrders: number;
  clubCustomers: number;
  totalProgramCosts: number;    // = 0 (both costs in profit)
  incrementalProfit: number;
  analysisMonths: number;
  isProfitable: boolean;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("da-DK").format(Math.round(num));
}

function formatCurrency(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M DKK`;
  }
  return `${formatNumber(num)} DKK`;
}

export function BreakEvenAnalysisTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Values from CORE_METRICS (Single Source of Truth in data-source.tsx)
  // NOTE: Using MEDIAN values - typical Club order has LOWER profit than typical Non-Club
  // Cross-sectional median: Club 158 DKK vs Non-Club 173 DKK = -15 DKK difference
  // However, longitudinal analysis shows volume gains (+48.8% frequency, UNBIASED) offset this
  const data: ProgramData = {
    netValue: CORE_METRICS.value.netValue,                   // Negative with median
    monthlyNetLoss: CORE_METRICS.value.monthlyNetLoss,       // Monthly loss
    extraProfitPerOrder: CORE_METRICS.profit.differenceDKK,  // -15 DKK (median)
    currentClubFrequency: CORE_METRICS.frequency.club,
    nonClubFrequency: CORE_METRICS.frequency.nonClub,
    clubOrders: CORE_METRICS.orders.club,
    clubCustomers: CORE_METRICS.customers.totalClub,
    totalProgramCosts: CORE_METRICS.costs.totalProgramCosts, // = 0 (in profit)
    incrementalProfit: CORE_METRICS.value.incrementalProfit,
    analysisMonths: CORE_METRICS.analysisPeriod.months,
    isProfitable: CORE_METRICS.value.isProfitable ?? false,
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Cross-sectional MEDIAN shows deficit - typical Club order less profitable
  // However, longitudinal data shows different story (volume gains)
  const deficitPerOrder = Math.abs(data.extraProfitPerOrder); // 15 DKK
  const ordersPerMember = data.clubOrders / data.clubCustomers; // ~1.3 orders
  const deficitPerMember = deficitPerOrder * ordersPerMember; // ~19.5 DKK per member
  const totalDeficit = Math.abs(data.netValue); // ~1.13M DKK

  // Break-even scenarios: what would make the program profitable?
  // Option 1: Higher AOV could offset the deficit
  const aovLiftNeeded = deficitPerOrder; // Need +15 DKK more profit to break even

  // Option 2: Frequency gains (from longitudinal analysis - UNBIASED method)
  // Longitudinal shows +48.8% frequency lift → more orders → offsets lower profit/order
  const frequencyLift = CORE_METRICS.orderHistory.changes.frequencyChange; // 48.8% (UNBIASED)
  const longitudinalIncrementalValue = CORE_METRICS.orderHistory.changes.incrementalMonthlyValue; // +19.29 DKK/mo

  return (
    <div className="space-y-6">
      {/* Header - Cross-sectional Median shows deficit */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-xl">Break-Even Analysis (Median-Based)</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            Cross-sectional median shows per-order deficit, but longitudinal analysis tells a different story
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Using MEDIAN profit (more robust than mean), the typical Club order generates {data.extraProfitPerOrder} DKK
            less profit than the typical Non-Club order. However, the longitudinal analysis shows Club members
            order +{frequencyLift}% more frequently, which may offset the per-order deficit.
          </p>
        </CardContent>
      </Card>

      {/* Cross-Sectional View - Shows Deficit */}
      <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-yellow-700 dark:text-yellow-400">Cross-Sectional View (Median)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-sm text-muted-foreground">Net Value</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.netValue)}
              </p>
              <p className="text-xs text-muted-foreground">Typical order deficit</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-sm text-muted-foreground">Monthly Deficit</p>
              <p className="text-2xl font-bold text-red-600">
                -{formatCurrency(data.monthlyNetLoss)}
              </p>
              <p className="text-xs text-muted-foreground">Over {data.analysisMonths} months</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-sm text-muted-foreground">Profit/Order (Median)</p>
              <p className="text-2xl font-bold text-red-600">
                {data.extraProfitPerOrder} DKK
              </p>
              <p className="text-xs text-muted-foreground">Club vs Non-Club</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
              <p className="text-sm text-muted-foreground">Deficit/Member</p>
              <p className="text-2xl font-bold">
                ~{deficitPerMember.toFixed(1)} DKK
              </p>
              <p className="text-xs text-muted-foreground">per 10-month period</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Longitudinal View - Shows Different Story */}
      <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle className="text-green-700 dark:text-green-400">
              Longitudinal View (Same Customers Before/After)
            </CardTitle>
          </div>
          <CardDescription>
            Tracking the same {formatNumber(CORE_METRICS.orderHistory.robustSampleSize)} customers before and after joining Club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-700 dark:text-green-400">Frequency Change</p>
              <p className="text-3xl font-bold text-green-600">
                +{frequencyLift}%
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                More orders after joining
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-400">Profit/Order Change</p>
              <p className="text-3xl font-bold text-red-600">
                {CORE_METRICS.orderHistory.changes.profitPerOrderChange}%
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Lower profit per order
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-700 dark:text-green-400">Net Monthly Value</p>
              <p className="text-3xl font-bold text-green-600">
                +{longitudinalIncrementalValue} DKK
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Per member per month
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">Why Longitudinal Shows Profit</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Frequency before: <strong>{CORE_METRICS.orderHistory.before.frequency.toFixed(3)} orders/mo</strong></p>
              <p>• Frequency after: <strong>{CORE_METRICS.orderHistory.after.frequency.toFixed(3)} orders/mo</strong> (+{frequencyLift}%)</p>
              <p>• Monthly profit before: <strong>{CORE_METRICS.orderHistory.before.monthlyProfit.toFixed(2)} DKK</strong></p>
              <p>• Monthly profit after: <strong>{CORE_METRICS.orderHistory.after.monthlyProfit.toFixed(2)} DKK</strong></p>
              <p className="font-medium text-green-600">• Volume gains offset lower profit per order</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation */}
      <Card className="border-blue-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-blue-700 dark:text-blue-400">
              Reconciling the Two Views
            </CardTitle>
          </div>
          <CardDescription>
            Why cross-sectional and longitudinal analyses differ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Cross-Sectional (Median)</p>
              <p className="text-xl font-bold text-red-600">{data.extraProfitPerOrder} DKK/order</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Compares Club vs Non-Club at a point in time.
                Shows typical Club order is less profitable.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Longitudinal (Same Customers)</p>
              <p className="text-xl font-bold text-green-600">+{longitudinalIncrementalValue} DKK/mo</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Tracks same customers before/after joining.
                Shows net positive from volume increase.
              </p>
            </div>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Key Insight:</strong> Both analyses are correct. The typical Club order generates less profit,
              but Club members order more frequently. The +{frequencyLift}% frequency increase more than offsets
              the {CORE_METRICS.orderHistory.changes.profitPerOrderChange}% profit decline, resulting in +{CORE_METRICS.orderHistory.changes.monthlyProfitChange}% higher monthly profit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Insight */}
      <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-700 dark:text-blue-400">Key Insight</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-blue-200 dark:border-blue-900">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
              Volume Wins: {CORE_METRICS.orderHistory.insight}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Using MEDIAN values, the typical Club order has {data.extraProfitPerOrder} DKK lower profit.
              But Club members order +{frequencyLift}% more frequently, resulting in NET POSITIVE monthly profit.
            </p>
            <div className="text-sm space-y-1">
              <p>• Median profit difference: <strong>{data.extraProfitPerOrder} DKK/order</strong></p>
              <p>• Frequency increase: <strong>+{frequencyLift}%</strong></p>
              <p>• Monthly profit change: <strong>+{CORE_METRICS.orderHistory.changes.monthlyProfitChange}%</strong></p>
              <p>• Net incremental value: <strong>+{longitudinalIncrementalValue} DKK/member/month</strong></p>
            </div>
          </div>

          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300">
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Important Caveat</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              The longitudinal analysis uses a robust sample of {formatNumber(CORE_METRICS.orderHistory.robustSampleSize)} highly engaged members.
              The {formatNumber(CORE_METRICS.customers.totalClub - CORE_METRICS.orderHistory.robustSampleSize)} other members may show different behavior.
              The broader sample including one-time-buyers shows {CORE_METRICS.orderHistory.broaderSample.changes.incrementalMonthlyValue} DKK/mo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Optimization Opportunities</CardTitle>
                </div>
                <Badge variant="outline">
                  {isMethodologyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Increase Per-Order Profit</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Median shows {Math.abs(data.extraProfitPerOrder)} DKK deficit per order. Can we close this gap?
                  </p>
                  <p className="text-sm text-yellow-600">
                    Options: Higher AOV, reduced cashback %, tiered shipping
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Maximize Frequency Lift</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Frequency increase (+{frequencyLift}%) is what makes the program work.
                  </p>
                  <p className="text-sm text-green-600">
                    More engagement → More orders → Offsets per-order deficit
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Target Best Customer Segments</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    &quot;Best customers&quot; segment shows +{longitudinalIncrementalValue.toFixed(2)} DKK/mo incremental value.
                  </p>
                  <p className="text-sm text-green-600">
                    Focus on repeat customers who respond most to Club
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Consider Paid Membership</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    A membership fee could offset the per-order deficit.
                  </p>
                  <p className="text-sm text-green-600">
                    ~{Math.abs(data.extraProfitPerOrder) * ordersPerMember} DKK/year fee would break even
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
