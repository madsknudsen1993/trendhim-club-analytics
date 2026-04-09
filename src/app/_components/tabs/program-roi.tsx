"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Truck,
  Globe,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatNumber, formatCurrency } from "@/lib/chart-config";
import { CORE_METRICS } from "./data-source";

interface ProgramROITabProps {
  isLoading: boolean;
}

// Country-level shipping subsidy data
const countryShippingData = [
  { country: "Denmark", threshold: 299, clubThreshold: 199, subsidizedOrders: 4520, subsidyCost: 135600, avgSubsidy: 30 },
  { country: "Sweden", threshold: 399, clubThreshold: 299, subsidizedOrders: 3890, subsidyCost: 116700, avgSubsidy: 30 },
  { country: "Norway", threshold: 449, clubThreshold: 299, subsidizedOrders: 3210, subsidyCost: 112350, avgSubsidy: 35 },
  { country: "Germany", threshold: 49, clubThreshold: 29, subsidizedOrders: 6780, subsidyCost: 237300, avgSubsidy: 35 },
  { country: "UK", threshold: 39, clubThreshold: 25, subsidizedOrders: 4120, subsidyCost: 144200, avgSubsidy: 35 },
  { country: "Netherlands", threshold: 49, clubThreshold: 29, subsidizedOrders: 3250, subsidyCost: 97500, avgSubsidy: 30 },
  { country: "Other", threshold: "Varies", clubThreshold: "Varies", subsidizedOrders: 2189, subsidyCost: 65670, avgSubsidy: 30 },
];

// USING MEDIAN for robustness (mean is skewed by high-value outliers)
// Cross-sectional median: Club 158 DKK vs Non-Club 173 DKK = -15 DKK difference
// The typical Club order generates LESS profit, BUT:
// - Longitudinal analysis shows +24.8% frequency increase
// - Volume gains (+17.35 DKK/mo per member) offset per-order deficit
const sensitivityData = [
  { scenario: "Base Case (Median)", profitDiff: -15, orders: 75272, incrementalProfit: -1129080, costs: 0, netValue: -1129080, isProfitable: false },
  { scenario: "If Mean Used", profitDiff: 5, orders: 75272, incrementalProfit: 376360, costs: 0, netValue: 376360, isProfitable: true },
  { scenario: "If Deficit Halved", profitDiff: -7.5, orders: 75272, incrementalProfit: -564540, costs: 0, netValue: -564540, isProfitable: false },
  { scenario: "Break-Even Point", profitDiff: 0, orders: 75272, incrementalProfit: 0, costs: 0, netValue: 0, isProfitable: true },
  { scenario: "Longitudinal View", profitDiff: null, orders: 75272, incrementalProfit: null, costs: 0, netValue: 869700, isProfitable: true, note: "+17.35 DKK/mo × 10mo × ~5000 active members" },
];

export function ProgramROITab({ isLoading: parentLoading }: ProgramROITabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isCashbackOpen, setIsCashbackOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isIncrementalOpen, setIsIncrementalOpen] = useState(false);
  const [isProfitabilityOpen, setIsProfitabilityOpen] = useState(false);

  // Values from CORE_METRICS (Single Source of Truth in data-source.tsx)
  // VERIFIED: Both cashback AND shipping are already in profit figures
  const pdfData = {
    // Profit metrics
    clubAvgProfit: CORE_METRICS.profit.clubAvgProfit,
    nonClubAvgProfit: CORE_METRICS.profit.nonClubAvgProfit,
    profitDifference: CORE_METRICS.profit.differenceDKK,
    profitDifferencePercent: (CORE_METRICS.profit.differenceDKK / CORE_METRICS.profit.nonClubAvgProfit) * 100,

    // Order metrics
    clubOrders: CORE_METRICS.orders.club,

    // Program economics - CORRECTED
    incrementalProfit: CORE_METRICS.value.incrementalProfit,
    totalCashbackCost: CORE_METRICS.costs.cashbackRedeemed,  // For reference only
    shippingSubsidy: CORE_METRICS.costs.shippingSubsidy,      // For reference only
    totalProgramCosts: CORE_METRICS.costs.totalProgramCosts,  // = 0 (both in profit)
    netValue: CORE_METRICS.value.netValue,
    isProfitable: CORE_METRICS.value.isProfitable ?? true,
  };

  if (parentLoading) {
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

  const isProfitable = pdfData.isProfitable;
  const netValue = pdfData.netValue;

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 9: Program ROI</CardTitle>
          <CardDescription className="text-base mt-2">
            "Incremental revenue/profit from Club members covers the costs of cashback and reduced shipping thresholds."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis calculates the net financial impact of the Trendhim Club program by comparing
            the incremental profit generated by Club members against the program costs (cashback and shipping subsidies).
          </p>
        </CardContent>
      </Card>

      {/* Verdict Card - Updated: Nuanced view with median */}
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <CardTitle>Nuanced Picture: Per-Order Deficit, But Volume Gains</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 mb-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Key Finding:</strong> Using MEDIAN (more robust than mean), the typical Club order generates {pdfData.profitDifference} DKK
              less profit than Non-Club. However, longitudinal analysis shows Club members order +{CORE_METRICS.orderHistory.changes.frequencyChange}% more frequently,
              resulting in +{CORE_METRICS.orderHistory.changes.incrementalMonthlyValue} DKK/mo net value per member.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Cross-Sectional (Median)</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(netValue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Typical order deficit
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Longitudinal View</p>
              <p className="text-3xl font-bold text-green-600">
                +{CORE_METRICS.orderHistory.changes.monthlyProfitChange}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly profit increase (same customers)
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Per-Order Profit (Median)</p>
              <p className="text-3xl font-bold text-red-600">
                {pdfData.profitDifference} DKK
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Club vs Non-Club
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculation Framework Accordion */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">ROI Calculation Framework</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {isMethodologyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* The Core Question */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">The Core Question</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Does the Club program generate more value than it costs? We calculate this by measuring
                  the incremental profit from Club members and comparing it against program costs.
                </p>
              </div>

              {/* Net Program Value Formula - CORRECTED */}
              <div>
                <h4 className="font-semibold mb-2">Net Program Value Formula (Corrected)</h4>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg font-mono text-sm space-y-2 border border-green-200">
                  <p><strong>Net Program Value</strong> = Incremental Profit</p>
                  <p className="text-green-600 text-xs mt-2">Where:</p>
                  <p className="text-green-600 text-xs">
                    • Incremental Profit = (Club Avg Profit - Non-Club Avg Profit) × Club Orders
                  </p>
                  <p className="text-green-600 text-xs">
                    • Total Costs = 0 (Both cashback AND shipping are already in profit figures)
                  </p>
                  <div className="mt-3 p-2 bg-white dark:bg-zinc-900 rounded border text-xs">
                    <p className="font-semibold text-green-700">Why costs = 0?</p>
                    <p className="text-green-600 mt-1">• Cashback: Reduces revenue → reduces profit → already counted</p>
                    <p className="text-green-600">• Shipping: Free shipping = no shipping revenue → reduces profit → already counted</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded">
                    <p className="text-green-700 dark:text-green-400 font-medium">If Net Value &gt; 0</p>
                    <p className="text-green-600 dark:text-green-500">PROFITABLE</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded">
                    <p className="text-red-700 dark:text-red-400 font-medium">If Net Value &lt; 0</p>
                    <p className="text-red-600 dark:text-red-500">COSTS more than generates</p>
                  </div>
                </div>
              </div>

              {/* Detailed Calculation Table */}
              <div>
                <h4 className="font-semibold mb-2">Detailed Calculation</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="text-left py-2 px-3">Component</th>
                        <th className="text-left py-2 px-3">Formula</th>
                        <th className="text-right py-2 px-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3">Club Avg Profit</td>
                        <td className="py-2 px-3 text-muted-foreground">Sum of Club profits ÷ Club orders</td>
                        <td className="py-2 px-3 text-right font-medium">{pdfData.clubAvgProfit} DKK</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3">Non-Club Avg Profit</td>
                        <td className="py-2 px-3 text-muted-foreground">Sum of Non-Club profits ÷ Non-Club orders</td>
                        <td className="py-2 px-3 text-right font-medium">{pdfData.nonClubAvgProfit} DKK</td>
                      </tr>
                      <tr className="border-b bg-yellow-50/50 dark:bg-yellow-950/20">
                        <td className="py-2 px-3 font-medium">Profit Difference (Median)</td>
                        <td className="py-2 px-3 text-muted-foreground">Club Avg - Non-Club Avg</td>
                        <td className="py-2 px-3 text-right font-bold text-red-600">
                          {pdfData.profitDifference} DKK/order
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3">Club Orders</td>
                        <td className="py-2 px-3 text-muted-foreground">Conservative attribution count</td>
                        <td className="py-2 px-3 text-right font-medium">{formatNumber(pdfData.clubOrders)}</td>
                      </tr>
                      <tr className="border-b bg-yellow-50/50 dark:bg-yellow-950/20">
                        <td className="py-2 px-3 font-medium">Incremental Profit (Median)</td>
                        <td className="py-2 px-3 text-muted-foreground">Profit Difference × Club Orders</td>
                        <td className="py-2 px-3 text-right font-bold text-red-600">{formatCurrency(pdfData.incrementalProfit)}</td>
                      </tr>
                      <tr className="border-b bg-zinc-100 dark:bg-zinc-800">
                        <td className="py-2 px-3 text-muted-foreground line-through">Cashback</td>
                        <td className="py-2 px-3 text-xs text-green-600">Already in profit (orders with CB have ~17 DKK lower profit)</td>
                        <td className="py-2 px-3 text-right text-green-600">In profit ✓</td>
                      </tr>
                      <tr className="border-b bg-zinc-100 dark:bg-zinc-800">
                        <td className="py-2 px-3 text-muted-foreground line-through">Shipping Subsidy</td>
                        <td className="py-2 px-3 text-xs text-green-600">Already in profit (free shipping = ~16 DKK lower profit)</td>
                        <td className="py-2 px-3 text-right text-green-600">In profit ✓</td>
                      </tr>
                      <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                        <td className="py-2 px-3 font-medium">Total Separate Costs</td>
                        <td className="py-2 px-3 text-green-600">Both costs already reflected in profit comparison</td>
                        <td className="py-2 px-3 text-right font-bold text-green-600">0 DKK</td>
                      </tr>
                      <tr className="bg-yellow-100 dark:bg-yellow-900/30">
                        <td className="py-2 px-3 font-bold">NET VALUE (Cross-Sectional Median)</td>
                        <td className="py-2 px-3 text-muted-foreground">= Incremental Profit (per-order basis)</td>
                        <td className="py-2 px-3 text-right font-bold text-lg text-red-600">
                          {formatCurrency(netValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Critical Assumptions */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Critical Assumptions
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>
                      <strong>Counterfactual:</strong> Assumes Club members would behave like non-members if they hadn't joined.
                      This may overstate benefits if Club attracts already-high-value customers.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>
                      <strong>Attribution:</strong> All profit difference is attributed to Club membership.
                      True incrementality unknown due to selection bias.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>
                      <strong>Operational costs:</strong> Not included (staff, technology, marketing for Club).
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Understanding Cashback Cost Metrics Accordion */}
      <Collapsible open={isCashbackOpen} onOpenChange={setIsCashbackOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">Understanding Cashback Cost Metrics</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {isCashbackOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">Total Redeemed</h4>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(pdfData.totalCashbackCost)}</p>
                  <p className="text-xs text-orange-600 mt-1">26,507 redemption events × 98 DKK avg</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Avg Redemption</h4>
                  <p className="text-2xl font-bold">98 DKK</p>
                  <p className="text-xs text-muted-foreground mt-1">Per redemption event</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Redemption Rate</h4>
                  <p className="text-2xl font-bold">35.2%</p>
                  <p className="text-xs text-muted-foreground mt-1">Of Club orders use cashback</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Note:</strong> Cashback is earned on purchases (3-5% of order value) and redeemed on
                  subsequent purchases. The cost shown is the actual redeemed amount, which represents real
                  money paid out to customers.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Shipping Subsidy Explanation & Country Breakdown Accordion */}
      <Collapsible open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Shipping Subsidy Explanation & Country Breakdown</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {isShippingOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">What is Shipping Subsidy?</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Club members get free shipping at a <strong>lower order value</strong> than non-Club customers.
                  Orders between the Club threshold and standard threshold qualify for free shipping, but
                  Trendhim must cover the shipping cost (the "subsidy").
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Total Subsidy</h4>
                  <p className="text-2xl font-bold text-red-600">-{formatCurrency(pdfData.shippingSubsidy)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Subsidized Orders</h4>
                  <p className="text-2xl font-bold">{formatNumber(CORE_METRICS.costs.shippingSubsidyOrderCount)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Avg Subsidy</h4>
                  <p className="text-2xl font-bold">~30 DKK</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left py-2 px-3">Country</th>
                      <th className="text-right py-2 px-3">Std Threshold</th>
                      <th className="text-right py-2 px-3">Club Threshold</th>
                      <th className="text-right py-2 px-3">Subsidized Orders</th>
                      <th className="text-right py-2 px-3">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryShippingData.map((row) => (
                      <tr key={row.country} className="border-b">
                        <td className="py-2 px-3 font-medium">{row.country}</td>
                        <td className="py-2 px-3 text-right">{row.threshold}</td>
                        <td className="py-2 px-3 text-right text-green-600">{row.clubThreshold}</td>
                        <td className="py-2 px-3 text-right">{formatNumber(row.subsidizedOrders)}</td>
                        <td className="py-2 px-3 text-right text-red-600">{formatCurrency(row.subsidyCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted">
                      <td className="py-2 px-3 font-bold">TOTAL</td>
                      <td className="py-2 px-3"></td>
                      <td className="py-2 px-3"></td>
                      <td className="py-2 px-3 text-right font-bold">{formatNumber(CORE_METRICS.costs.shippingSubsidyOrderCount)}</td>
                      <td className="py-2 px-3 text-right font-bold text-red-600">{formatCurrency(pdfData.shippingSubsidy)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Understanding Incremental Profit Metrics Accordion */}
      <Collapsible open={isIncrementalOpen} onOpenChange={setIsIncrementalOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-base">Understanding Incremental Profit Metrics</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {isIncrementalOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Incremental Profit Calculation (Median-Based)</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <p>Incremental Profit = (Club Avg Profit - Non-Club Avg Profit) × Club Orders</p>
                  <p className="mt-2">= ({pdfData.clubAvgProfit} DKK - {pdfData.nonClubAvgProfit} DKK) × {formatNumber(pdfData.clubOrders)}</p>
                  <p className="mt-2">= {pdfData.profitDifference} DKK × {formatNumber(pdfData.clubOrders)}</p>
                  <p className="mt-2 font-bold text-red-600">= {formatCurrency(pdfData.incrementalProfit)}</p>
                  <p className="mt-3 text-xs text-muted-foreground">Note: Using MEDIAN values - typical order, not average</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Key Assumption</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      This assumes that without the Club program, Club members would behave exactly like
                      non-Club customers. If Club attracts already-higher-value customers (selection bias),
                      the true incremental value may be <strong>significantly lower or even zero</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sensitivity Analysis Table - UPDATED */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Value Scenarios</CardTitle>
          </div>
          <CardDescription>
            How does net value change under different assumptions?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Scenario</th>
                  <th className="text-right py-2 px-3">Profit Diff</th>
                  <th className="text-right py-2 px-3">Club Orders</th>
                  <th className="text-right py-2 px-3">Net Value</th>
                  <th className="text-right py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityData.map((row, index) => (
                  <tr key={row.scenario} className={`border-b ${index === 0 ? "bg-yellow-50/50 dark:bg-yellow-950/20" : row.isProfitable ? "bg-green-50/30" : ""}`}>
                    <td className="py-2 px-3 font-medium">{row.scenario}</td>
                    <td className="py-2 px-3 text-right">{row.profitDiff !== null ? `${row.profitDiff} DKK` : "N/A"}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(row.orders)}</td>
                    <td className={`py-2 px-3 text-right font-bold ${row.netValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {row.netValue >= 0 ? "+" : ""}{formatCurrency(row.netValue)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Badge variant="outline" className={row.isProfitable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {row.isProfitable ? "Profitable" : "Deficit"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Key insight:</strong> Cross-sectional median shows {pdfData.profitDifference} DKK per-order deficit.
            However, the longitudinal view (same customers before/after) shows +{CORE_METRICS.orderHistory.changes.monthlyProfitChange}% monthly profit increase
            because frequency gains (+{CORE_METRICS.orderHistory.changes.frequencyChange}%) offset the per-order deficit.
          </p>
        </CardContent>
      </Card>

      {/* Cross-Sectional vs Longitudinal Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cross-Sectional View */}
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-yellow-700 dark:text-yellow-400">Cross-Sectional View (Median)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Per-Order Difference</p>
                  <p className="text-xs text-muted-foreground">Club median vs Non-Club median</p>
                </div>
                <span className="font-bold text-red-600">{pdfData.profitDifference} DKK</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Total Impact</p>
                  <p className="text-xs text-muted-foreground">{pdfData.profitDifference} × {formatNumber(pdfData.clubOrders)} orders</p>
                </div>
                <span className="font-bold text-red-600">{formatCurrency(pdfData.incrementalProfit)}</span>
              </div>
              <div className="text-sm text-yellow-600">
                <p>Typical Club order generates less profit than typical Non-Club order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Longitudinal View */}
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle className="text-green-700 dark:text-green-400">Longitudinal View (Same Customers)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Frequency Change</p>
                  <p className="text-xs text-muted-foreground">Orders/month after vs before</p>
                </div>
                <span className="font-bold text-green-600">+{CORE_METRICS.orderHistory.changes.frequencyChange}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Monthly Profit Change</p>
                  <p className="text-xs text-muted-foreground">Volume × profit/order</p>
                </div>
                <span className="font-bold text-green-600">+{CORE_METRICS.orderHistory.changes.monthlyProfitChange}%</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-green-100 dark:bg-green-900/30 px-2 rounded">
                <p className="font-bold">Incremental Value/Member/Month</p>
                <span className="font-bold text-green-600">+{CORE_METRICS.orderHistory.changes.incrementalMonthlyValue} DKK</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Comparison: Club vs Non-Club (Median)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Club Median Profit</p>
              <p className="text-2xl font-bold">{pdfData.clubAvgProfit} DKK</p>
              <p className="text-xs text-muted-foreground">per order</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Non-Club Median Profit</p>
              <p className="text-2xl font-bold">{pdfData.nonClubAvgProfit} DKK</p>
              <p className="text-xs text-muted-foreground">per order</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Difference</p>
              <p className="text-2xl font-bold text-red-600">
                {pdfData.profitDifference} DKK
              </p>
              <p className="text-xs text-muted-foreground">per order</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">% Difference</p>
              <p className="text-2xl font-bold text-red-600">
                {pdfData.profitDifferencePercent.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Club vs Non-Club</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Understanding the Analysis */}
      <Collapsible open={isProfitabilityOpen} onOpenChange={setIsProfitabilityOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Understanding the Two Views</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {isProfitabilityOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  <strong>Key Finding:</strong> Cross-sectional median shows {pdfData.profitDifference} DKK per-order deficit,
                  but longitudinal analysis shows +{CORE_METRICS.orderHistory.changes.monthlyProfitChange}% monthly profit increase.
                  Both views are correct - they measure different things.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Why the Median Shows a Deficit</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Cashback redemption (~-17 DKK):</strong> Reduces revenue on orders with cashback</li>
                  <li>• <strong>Free shipping (~-16 DKK):</strong> Lower shipping threshold means less shipping revenue</li>
                  <li>• <strong>Outlier effect:</strong> Mean was inflated by high-value orders (1.43% vs 0.95% over 1000 DKK)</li>
                  <li>• <strong>Net effect on median:</strong> {pdfData.profitDifference} DKK per typical order</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                <h4 className="font-semibold mb-2 text-green-700">Why Longitudinal Shows Profit</h4>
                <ul className="text-sm text-green-600 space-y-2">
                  <li>• <strong>Frequency increase (+{CORE_METRICS.orderHistory.changes.frequencyChange}%):</strong> Club members order more often</li>
                  <li>• <strong>Volume offsets margin:</strong> More orders × lower margin = higher total</li>
                  <li>• <strong>Net monthly effect:</strong> +{CORE_METRICS.orderHistory.changes.incrementalMonthlyValue} DKK per member per month</li>
                </ul>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                  <strong>Caveat:</strong> Longitudinal uses {formatNumber(CORE_METRICS.orderHistory.robustSampleSize)} highly engaged members.
                  The broader sample ({formatNumber(CORE_METRICS.orderHistory.broaderSample.sampleSize)} members) shows {CORE_METRICS.orderHistory.broaderSample.changes.incrementalMonthlyValue} DKK/mo,
                  suggesting results may vary by segment.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
