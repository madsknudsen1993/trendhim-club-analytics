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

interface BreakEvenData {
  totalDeficit: number;
  monthlyNetLoss: number;
  extraProfitPerOrder: number;
  currentClubFrequency: number;
  nonClubFrequency: number;
  clubOrders: number;
  clubCustomers: number;
  totalProgramCosts: number;
  incrementalProfit: number;
  analysisMonths: number;
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
  const data: BreakEvenData = {
    totalDeficit: Math.abs(CORE_METRICS.value.netValue),
    monthlyNetLoss: CORE_METRICS.value.monthlyNetLoss,
    extraProfitPerOrder: CORE_METRICS.profit.differenceDKK,
    currentClubFrequency: CORE_METRICS.frequency.club,
    nonClubFrequency: CORE_METRICS.frequency.nonClub,
    clubOrders: CORE_METRICS.orders.club,
    clubCustomers: CORE_METRICS.customers.totalClub,
    totalProgramCosts: CORE_METRICS.costs.totalProgramCosts,
    incrementalProfit: CORE_METRICS.value.incrementalProfit,
    analysisMonths: CORE_METRICS.analysisPeriod.months,
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

  // Calculate break-even scenarios
  // Option 1: Increase Purchase Frequency
  const costPerOrder = data.totalProgramCosts / data.clubOrders; // Cost per club order
  const requiredExtraProfit = costPerOrder; // Extra profit needed per order to break even
  const currentExtraProfit = data.extraProfitPerOrder;
  const profitGapPerOrder = requiredExtraProfit - currentExtraProfit;

  // Orders needed at current extra profit to cover costs
  const ordersNeededForBreakEven = data.totalProgramCosts / data.extraProfitPerOrder;
  const additionalOrdersNeeded = ordersNeededForBreakEven - data.clubOrders;
  const frequencyMultiplier = ordersNeededForBreakEven / data.clubOrders;
  const requiredFrequency = data.currentClubFrequency * frequencyMultiplier;

  // Option 2: Enroll More Members
  // At current behavior, how many total members needed?
  const profitPerCustomer = data.incrementalProfit / data.clubCustomers;
  const costPerCustomer = data.totalProgramCosts / data.clubCustomers;
  const netCostPerCustomer = costPerCustomer - profitPerCustomer;
  const membersNeededBreakEven = data.totalProgramCosts / profitPerCustomer;
  const additionalMembersNeeded = membersNeededBreakEven - data.clubCustomers;

  // Trajectory data for chart
  const trajectoryData = [
    { month: "Apr 25", actual: 1.30, required: requiredFrequency },
    { month: "May 25", actual: 1.30, required: requiredFrequency },
    { month: "Jun 25", actual: 1.30, required: requiredFrequency },
    { month: "Jul 25", actual: 1.30, required: requiredFrequency },
    { month: "Aug 25", actual: 1.31, required: requiredFrequency },
    { month: "Sep 25", actual: 1.30, required: requiredFrequency },
    { month: "Oct 25", actual: 1.30, required: requiredFrequency },
    { month: "Nov 25", actual: 1.31, required: requiredFrequency },
    { month: "Dec 25", actual: 1.31, required: requiredFrequency },
    { month: "Jan 26", actual: 1.30, required: requiredFrequency },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#06402b]" />
            <CardTitle className="text-xl">Break-Even Analysis</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            What would it take for the Trendhim Club to become profitable?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis calculates the scenarios under which the Club program would generate
            enough incremental value to cover its costs (cashback + shipping subsidies).
          </p>
        </CardContent>
      </Card>

      {/* Current Situation */}
      <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700 dark:text-red-400">Current Situation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-sm text-muted-foreground">Total Deficit</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.totalDeficit)}
              </p>
              <p className="text-xs text-muted-foreground">Costs - Incremental Profit</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-sm text-muted-foreground">Monthly Net Loss</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.monthlyNetLoss)}
              </p>
              <p className="text-xs text-muted-foreground">Over {data.analysisMonths} months</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm text-muted-foreground">Extra Profit/Order</p>
              <p className="text-2xl font-bold text-green-600">
                +{data.extraProfitPerOrder.toFixed(2)} DKK
              </p>
              <p className="text-xs text-muted-foreground">Club vs Non-Club</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
              <p className="text-sm text-muted-foreground">Current Club Frequency</p>
              <p className="text-2xl font-bold">
                {data.currentClubFrequency.toFixed(2)} orders
              </p>
              <p className="text-xs text-muted-foreground">per customer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Option 1: Increase Purchase Frequency */}
      <Card className="border-blue-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-blue-700 dark:text-blue-400">
              Option 1: Increase Purchase Frequency
            </CardTitle>
          </div>
          <CardDescription>
            If we keep the same number of members, how much more must each customer purchase?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-700 dark:text-blue-400">Required Frequency</p>
              <p className="text-3xl font-bold text-blue-600">
                {requiredFrequency.toFixed(2)} orders
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                per customer (currently {data.currentClubFrequency})
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-700 dark:text-blue-400">Increase Needed</p>
              <p className="text-3xl font-bold text-blue-600">
                +{((frequencyMultiplier - 1) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {frequencyMultiplier.toFixed(1)}x current frequency
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-700 dark:text-blue-400">Additional Orders</p>
              <p className="text-3xl font-bold text-blue-600">
                +{formatNumber(additionalOrdersNeeded)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                beyond current {formatNumber(data.clubOrders)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">Calculation Logic</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Extra profit per order: <strong>{data.extraProfitPerOrder.toFixed(2)} DKK</strong></p>
              <p>• Total costs to cover: <strong>{formatCurrency(data.totalProgramCosts)}</strong></p>
              <p>• Orders needed: {formatCurrency(data.totalProgramCosts)} ÷ {data.extraProfitPerOrder.toFixed(2)} DKK = <strong>{formatNumber(ordersNeededForBreakEven)} orders</strong></p>
              <p>• With {formatNumber(data.clubCustomers)} members: <strong>{requiredFrequency.toFixed(2)} orders each</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Option 2: Enroll More Members */}
      <Card className="border-purple-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-purple-700 dark:text-purple-400">
              Option 2: Enroll More Members
            </CardTitle>
          </div>
          <CardDescription>
            If purchase frequency stays the same, how many more members do we need?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
              <p className="text-sm text-purple-700 dark:text-purple-400">Required Members</p>
              <p className="text-3xl font-bold text-purple-600">
                {formatNumber(membersNeededBreakEven)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                total Club members
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
              <p className="text-sm text-purple-700 dark:text-purple-400">Additional Members</p>
              <p className="text-3xl font-bold text-purple-600">
                +{formatNumber(additionalMembersNeeded)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                beyond current {formatNumber(data.clubCustomers)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
              <p className="text-sm text-purple-700 dark:text-purple-400">Multiplier</p>
              <p className="text-3xl font-bold text-purple-600">
                {(membersNeededBreakEven / data.clubCustomers).toFixed(1)}x
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                current member base
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">Calculation Logic</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Incremental profit per customer: <strong>{formatCurrency(profitPerCustomer)}</strong></p>
              <p>• Total costs to cover: <strong>{formatCurrency(data.totalProgramCosts)}</strong></p>
              <p>• Members needed: {formatCurrency(data.totalProgramCosts)} ÷ {formatCurrency(profitPerCustomer)} = <strong>{formatNumber(membersNeededBreakEven)} members</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reality Check */}
      <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-700 dark:text-yellow-400">Reality Check</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                Option 1 Challenge: Frequency
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Increasing purchase frequency from <strong>1.30</strong> to <strong>{requiredFrequency.toFixed(2)}</strong> orders
                per customer represents a <strong>{((frequencyMultiplier - 1) * 100).toFixed(0)}% increase</strong>.
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                This is unrealistic for a fashion accessory retailer with typical repurchase cycles.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                Option 2 Challenge: Member Growth
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Growing from <strong>{formatNumber(data.clubCustomers)}</strong> to <strong>{formatNumber(membersNeededBreakEven)}</strong> members
                requires a <strong>{((membersNeededBreakEven / data.clubCustomers - 1) * 100).toFixed(0)}x</strong> increase.
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                This assumes member acquisition cost is zero and all new members behave identically.
              </p>
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">The Core Problem</h4>
            <p className="text-sm text-red-700 dark:text-red-400">
              The <strong>extra profit per order (+{data.extraProfitPerOrder.toFixed(2)} DKK)</strong> is
              too small relative to program costs. Even significant increases in frequency or membership
              would struggle to overcome the fundamental economics.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Frequency Trajectory Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Purchase Frequency Trajectory</CardTitle>
          </div>
          <CardDescription>
            Actual Club frequency vs required frequency for break-even
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[1.0, Math.ceil(requiredFrequency * 1.1)]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                formatter={(value, name) => [
                  value !== undefined ? Number(value).toFixed(2) : '',
                  name === "actual" ? "Actual Frequency" : "Required for Break-Even"
                ]}
              />
              <Legend />
              <ReferenceLine
                y={requiredFrequency}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: "Break-Even", fill: "#ef4444", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Frequency"
                stroke="#06402b"
                strokeWidth={3}
                dot={{ fill: "#06402b", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alternative Paths */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Alternative Paths to Profitability</CardTitle>
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
                  <h4 className="font-semibold mb-2">Reduce Cashback Rate</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Lowering the cashback percentage would reduce costs while maintaining member benefits.
                  </p>
                  <p className="text-sm">
                    Current: ~3% cashback → Need: &lt;0.5% to break even
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Increase Free Shipping Threshold</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Raising the Club free shipping threshold would reduce shipping subsidy costs.
                  </p>
                  <p className="text-sm">
                    Impact: ~{formatCurrency(data.totalProgramCosts * 0.24)} saved if aligned with non-Club
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Add Membership Fee</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    A paid membership tier would create direct revenue.
                  </p>
                  <p className="text-sm">
                    Break-even fee: {formatCurrency(data.totalDeficit / data.clubCustomers)} per member
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Target Higher-Value Customers</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Focus enrollment on customers with proven purchase history.
                  </p>
                  <p className="text-sm">
                    Higher AOV members generate more profit to offset costs
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
