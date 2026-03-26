"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Wallet,
  Truck,
  Calculator,
  Calendar,
  Info,
  Target,
  BarChart3,
  ArrowRight,
  Minus,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { CORE_METRICS } from "./data-source";

interface ROIData {
  clubTotalProfit: number;
  nonClubTotalProfit: number;
  clubAvgProfit: number;
  nonClubAvgProfit: number;
  profitDifference: number;
  profitDifferencePercent: number;
  clubOrders: number;
  incrementalProfit: number;
  totalCashbackCost: number;
  shippingSubsidy: number;
  totalProgramCosts: number;
  netValue: number;
  roi: number;
  isProfitable: boolean;
}

interface KPIs {
  totalOrders: number;
  clubOrders: number;
  nonClubOrders: number;
  clubPercentage: number;
  totalRevenue: number;
  clubRevenue: number;
  nonClubRevenue: number;
  clubRevenuePercentage: number;
  avgOrderValue: number;
  clubAOV: number;
  nonClubAOV: number;
  aovDifference: number;
  aovDifferencePercent: number;
  totalCustomers: number;
  clubCustomers: number;
  clubCustomerPercentage: number;
}

interface ConclusionTabProps {
  kpis: KPIs | null;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

function formatCurrency(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M DKK`;
  }
  return `${formatNumber(num)} DKK`;
}

function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`;
}

// Interface for monthly metrics from API
interface MonthlyMetric {
  month: string;
  clubOrders: number;
  cbOrders: number;
  totalCB: number;
  avgCB: number;
  aovAll: number;
  aovCB: number;
  aovNoCB: number;
  profitAll: number;
  profitCB: number;
  shPaid: number;
  shPaidCB: number;
  shFree: number;
}

interface MonthlyMetricsData {
  monthly: MonthlyMetric[];
  totals: MonthlyMetric;
}

// Default empty totals structure
const defaultTotals: MonthlyMetric = {
  month: "TOTAL",
  clubOrders: 0,
  cbOrders: 0,
  totalCB: 0,
  avgCB: 0,
  aovAll: 0,
  aovCB: 0,
  aovNoCB: 0,
  profitAll: 0,
  profitCB: 0,
  shPaid: 0,
  shPaidCB: 0,
  shFree: 0,
};

// Hypothesis Evidence Data
const hypothesisEvidence = [
  { id: "H1", name: "Returning Orders", verdict: "SUPPORTED", finding: "Club customers have 5.7% higher order frequency than non-Club (1.30 vs 1.23)", color: "green" },
  { id: "H2", name: "Purchase Frequency", verdict: "SUPPORTED", finding: "Club members show measurably higher repeat purchase rate after joining", color: "green" },
  { id: "H3", name: "Loyalty Progression", verdict: "INCONCLUSIVE", finding: "Cannot isolate Club effect from natural customer lifecycle without pre-Club data", color: "yellow" },
  { id: "H4", name: "Cashback Impact", verdict: "SUPPORTED", finding: "Customers with cashback balance show 15% higher order frequency", color: "green" },
  { id: "H5", name: "Before/After", verdict: "INCONCLUSIVE", finding: "Before/after comparison limited - most Club members have no pre-Club orders in dataset", color: "yellow" },
  { id: "H6", name: "Seasonal Patterns", verdict: "SUPPORTED", finding: "Club orders show 30% less seasonal variance (more consistent purchasing)", color: "green" },
  { id: "H7", name: "Average Order Value", verdict: "SUPPORTED", finding: "Club AOV is +34 DKK (+7.7%) higher than Non-Club", color: "green" },
  { id: "H8", name: "Order Profit", verdict: "SUPPORTED", finding: "Club profit per order is +1 DKK higher (224 vs 223 DKK)", color: "green" },
  { id: "H9", name: "Program ROI", verdict: "NOT SUPPORTED", finding: "ROI is -97.0% - program costs exceed incremental benefits by 3.3M DKK", color: "red" },
];

// Break-even trajectory data
const trajectoryData = [
  { month: "Current", frequency: 1.30, target: 44.78 },
  { month: "M+3", frequency: 2.5, target: 44.78 },
  { month: "M+6", frequency: 5.0, target: 44.78 },
  { month: "M+12", frequency: 10.0, target: 44.78 },
  { month: "M+18", frequency: 15.0, target: 44.78 },
  { month: "M+24", frequency: 20.0, target: 44.78 },
  { month: "Target", frequency: 44.78, target: 44.78 },
];

export function ConclusionTab({ kpis }: ConclusionTabProps) {
  const [roiData, setRoiData] = useState<ROIData | null>(null);
  const [monthlyMetricsData, setMonthlyMetricsData] = useState<MonthlyMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(false);
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isBreakEvenOpen, setIsBreakEvenOpen] = useState(true);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(true);
  const [isInvestigationsOpen, setIsInvestigationsOpen] = useState(false);

  // Use fetched data or fallback to empty/default
  const monthlyMetrics = monthlyMetricsData?.monthly || [];
  const monthlyTotals = monthlyMetricsData?.totals || defaultTotals;

  // Values from CORE_METRICS (Single Source of Truth in data-source.tsx)
  const pdfData = {
    // Order metrics
    totalOrders: CORE_METRICS.orders.total,
    clubOrders: CORE_METRICS.orders.club,
    nonClubOrders: CORE_METRICS.orders.nonClub,
    clubOrdersPercent: CORE_METRICS.orders.clubPercentage,

    // Customer metrics
    totalCustomers: CORE_METRICS.customers.totalUnique,
    clubCustomers: CORE_METRICS.customers.totalClub,
    neverClubCustomers: CORE_METRICS.customers.neverClub,

    // Frequency
    clubFrequency: CORE_METRICS.frequency.club,
    nonClubFrequency: CORE_METRICS.frequency.nonClub,

    // AOV (DKK)
    clubAOV: CORE_METRICS.aov.club,
    nonClubAOV: CORE_METRICS.aov.nonClub,
    aovDifference: CORE_METRICS.aov.differenceDKK,
    aovDifferencePercent: CORE_METRICS.aov.differencePercent,

    // Profit (DKK)
    clubAvgProfit: CORE_METRICS.profit.clubAvgProfit,
    nonClubAvgProfit: CORE_METRICS.profit.nonClubAvgProfit,
    profitPerOrder: CORE_METRICS.profit.differenceDKK,

    // Cashback metrics
    cashbackRedemptions: CORE_METRICS.costs.cashbackOrderCount,
    avgCashbackRedeemed: CORE_METRICS.costs.avgCashbackPerOrder,
    totalCashbackRedeemed: CORE_METRICS.costs.cashbackRedeemed,

    // Shipping
    subsidizedShipping: CORE_METRICS.costs.shippingSubsidyOrderCount,
    shippingSubsidy: CORE_METRICS.costs.shippingSubsidy,

    // Program economics
    totalProgramCosts: CORE_METRICS.costs.totalProgramCosts,
    incrementalProfit: CORE_METRICS.value.incrementalProfit,
    netValue: CORE_METRICS.value.netValue,
    monthlyNetValue: -CORE_METRICS.value.monthlyNetLoss,
    roi: CORE_METRICS.value.roi,
  };

  // Break-even calculations
  const breakEven = {
    currentDeficit: Math.abs(pdfData.netValue),
    monthlyNetLoss: CORE_METRICS.value.monthlyNetLoss,
    extraProfitPerOrder: pdfData.profitPerOrder,
    currentFrequency: pdfData.clubFrequency,
    // Option 1: Required frequency to break even
    requiredFrequency: pdfData.totalProgramCosts / (pdfData.profitPerOrder * pdfData.clubCustomers),
    frequencyMultiple: (pdfData.totalProgramCosts / (pdfData.profitPerOrder * pdfData.clubCustomers)) / pdfData.clubFrequency,
    // Option 2: Additional members needed
    additionalMembersNeeded: Math.ceil(pdfData.totalProgramCosts / (pdfData.profitPerOrder * pdfData.clubFrequency)),
    membershipGrowth: ((pdfData.totalProgramCosts / (pdfData.profitPerOrder * pdfData.clubFrequency)) / pdfData.clubCustomers) * 100,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch ROI and monthly metrics in parallel
        const [roiResponse, monthlyResponse] = await Promise.all([
          fetch("/api/analytics/roi"),
          fetch("/api/analytics/monthly-metrics"),
        ]);

        if (roiResponse.ok) {
          const data = await roiResponse.json();
          setRoiData(data);
        }

        if (monthlyResponse.ok) {
          const data = await monthlyResponse.json();
          setMonthlyMetricsData(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading || !kpis) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Final Verdict Header */}
      <Card className={pdfData.roi >= 0 ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {pdfData.roi >= 0 ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <CardTitle className="text-2xl">
                Final Verdict: Program Needs Optimization
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Based on conservative Club attribution methodology (April 2025 - January 2026)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Net Value (Profit - Costs)</p>
              <p className={`text-3xl font-bold ${pdfData.netValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(pdfData.netValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Program ROI</p>
              <p className={`text-3xl font-bold ${pdfData.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                {pdfData.roi.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Net Value</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(pdfData.monthlyNetValue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Definitions Accordion */}
      <Collapsible open={isDefinitionsOpen} onOpenChange={setIsDefinitionsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Core Definitions</CardTitle>
                </div>
                <Badge variant="outline">
                  {isDefinitionsOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">Analysis Period</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    April 1, 2025 - January 31, 2026 (10 months post-launch)
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">Club Customer</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer with customerGroup.key = 'club' AND appears in cashback file
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">Club Order (Conservative)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Order tagged with customerGroup.key = 'club' placed AFTER member join date
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Program Benefits & Costs Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Program Benefits */}
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle className="text-green-700 dark:text-green-400">Program Benefits</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">Incremental Profit Generated</p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    ({pdfData.clubAvgProfit} - {pdfData.nonClubAvgProfit}) × {formatNumber(pdfData.clubOrders)} orders
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">+{formatCurrency(pdfData.incrementalProfit)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Profit per Order Advantage</span>
                <span className="font-bold text-green-600">+{pdfData.profitPerOrder} DKK</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">AOV Advantage</span>
                <span className="font-bold text-green-600">+{pdfData.aovDifferencePercent}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Frequency Advantage</span>
                <span className="font-bold text-green-600">+{CORE_METRICS.frequency.differencePercent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program Costs */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700 dark:text-red-400">Program Costs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Cashback Redeemed</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(pdfData.cashbackRedemptions)} redemptions × avg {pdfData.avgCashbackRedeemed} DKK
                    </p>
                  </div>
                </div>
                <span className="font-bold text-red-600">-{formatCurrency(pdfData.totalCashbackRedeemed)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Shipping Subsidy</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(pdfData.subsidizedShipping)} orders below threshold
                    </p>
                  </div>
                </div>
                <span className="font-bold text-red-600">-{formatCurrency(pdfData.shippingSubsidy)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-red-50 dark:bg-red-950/30 px-4 rounded-lg">
                <p className="font-bold text-red-700 dark:text-red-400">Total Program Costs</p>
                <p className="text-xl font-bold text-red-600">
                  -{formatCurrency(pdfData.totalProgramCosts)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Club Orders</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(pdfData.clubOrders)}</p>
            <p className="text-sm text-muted-foreground">
              {pdfData.clubOrdersPercent}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Club Customers</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(pdfData.clubCustomers)}</p>
            <p className="text-sm text-muted-foreground">
              Verified members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Club Frequency</p>
            </div>
            <p className="text-2xl font-bold mt-2">{pdfData.clubFrequency.toFixed(2)}</p>
            <p className="text-sm text-green-600">
              vs {pdfData.nonClubFrequency.toFixed(2)} Non-Club
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Profit per Order</p>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">+{pdfData.profitPerOrder} DKK</p>
            <p className="text-sm text-muted-foreground">
              vs Non-Club orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cashback Redemptions</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(pdfData.cashbackRedemptions)}</p>
            <p className="text-sm text-muted-foreground">
              avg {pdfData.avgCashbackRedeemed} DKK each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Subsidized Shipping</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(pdfData.subsidizedShipping)}</p>
            <p className="text-sm text-muted-foreground">
              orders with free shipping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Monthly Net Value</p>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(pdfData.monthlyNetValue)}</p>
            <p className="text-sm text-muted-foreground">
              per month average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Program ROI</p>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{pdfData.roi.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">
              Net Value / Total Costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Case Calculation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Business Case Calculation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Incremental Profit Table */}
          <div>
            <h4 className="font-semibold mb-3">Incremental Profit Calculation</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-green-50 dark:bg-green-950/30">
                    <th className="text-left py-2 px-3 border">Component</th>
                    <th className="text-right py-2 px-3 border">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 border">Club Avg Profit per Order</td>
                    <td className="py-2 px-3 border text-right font-medium">{pdfData.clubAvgProfit} DKK</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border">Non-Club Avg Profit per Order</td>
                    <td className="py-2 px-3 border text-right font-medium">{pdfData.nonClubAvgProfit} DKK</td>
                  </tr>
                  <tr className="bg-green-50/50 dark:bg-green-950/20">
                    <td className="py-2 px-3 border font-medium">Profit Difference per Order</td>
                    <td className="py-2 px-3 border text-right font-bold text-green-600">+{pdfData.profitPerOrder} DKK</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border">Total Club Orders</td>
                    <td className="py-2 px-3 border text-right font-medium">{formatNumber(pdfData.clubOrders)}</td>
                  </tr>
                  <tr className="bg-green-100 dark:bg-green-900/30">
                    <td className="py-2 px-3 border font-bold">Incremental Profit</td>
                    <td className="py-2 px-3 border text-right font-bold text-green-600">+{formatCurrency(pdfData.incrementalProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Program Costs Table */}
          <div>
            <h4 className="font-semibold mb-3">Program Costs</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-red-50 dark:bg-red-950/30">
                    <th className="text-left py-2 px-3 border">Cost Component</th>
                    <th className="text-right py-2 px-3 border">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 border">Cashback Redeemed ({formatNumber(pdfData.cashbackRedemptions)} × {pdfData.avgCashbackRedeemed} DKK)</td>
                    <td className="py-2 px-3 border text-right font-medium text-red-600">-{formatCurrency(pdfData.totalCashbackRedeemed)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border">Shipping Subsidy ({formatNumber(pdfData.subsidizedShipping)} orders)</td>
                    <td className="py-2 px-3 border text-right font-medium text-red-600">-{formatCurrency(pdfData.shippingSubsidy)}</td>
                  </tr>
                  <tr className="bg-red-100 dark:bg-red-900/30">
                    <td className="py-2 px-3 border font-bold">Total Program Costs</td>
                    <td className="py-2 px-3 border text-right font-bold text-red-600">-{formatCurrency(pdfData.totalProgramCosts)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Value & ROI */}
          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
            <h4 className="font-semibold mb-3">Net Value & ROI</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Net Value = Incremental Profit - Total Costs</span>
                <span className="font-mono">{formatCurrency(pdfData.incrementalProfit)} - {formatCurrency(pdfData.totalProgramCosts)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-red-600">
                <span>Net Value</span>
                <span>{formatCurrency(pdfData.netValue)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span>ROI = (Net Value / Total Costs) × 100</span>
                <span className="font-mono">({formatNumber(Math.abs(pdfData.netValue))} / {formatNumber(pdfData.totalProgramCosts)}) × 100</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-red-600">
                <span>ROI</span>
                <span>{pdfData.roi.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Line & Data Gap Warning */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Bottom Line</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-400">
              The Club program currently loses <strong>{formatCurrency(Math.abs(pdfData.monthlyNetValue))}/month</strong>.
              The behavioral benefits (higher AOV, frequency, profit per order) do not offset the cashback and
              shipping subsidy costs.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-700 dark:text-yellow-400">Data Gap Warning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 dark:text-yellow-400">
              <strong>Cannot measure incrementality:</strong> We don't have pre-Club customer data (customerId tracking
              started March 2025). The observed behavioral differences may be due to selection bias
              (better customers self-select into Club).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Findings Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Key Findings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">Observed Patterns (Positive)</h4>
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Club AOV is <strong>+{pdfData.aovDifferencePercent}%</strong> higher than Non-Club (+{pdfData.aovDifference} DKK)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Club frequency is <strong>+{CORE_METRICS.frequency.differencePercent}%</strong> higher ({pdfData.clubFrequency} vs {pdfData.nonClubFrequency})</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Club profit per order is <strong>+{pdfData.profitPerOrder} DKK</strong> higher</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Club members show <strong>30% less seasonal variance</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Customers with cashback show <strong>15% higher frequency</strong></span>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">Critical Issues</h4>
              <ul className="space-y-2 text-sm text-red-700 dark:text-red-400">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Program ROI is <strong>{pdfData.roi.toFixed(1)}%</strong> (costs exceed benefits)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Monthly net loss of <strong>{formatCurrency(Math.abs(pdfData.monthlyNetValue))}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>70% of Club members</strong> are "ghost members" (no Club orders)</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                  <span>Selection bias cannot be ruled out (may attract already-good customers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                  <span>Incrementality cannot be measured (no pre-Club data)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Break-Even Analysis */}
      <Collapsible open={isBreakEvenOpen} onOpenChange={setIsBreakEvenOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Break-Even Analysis</CardTitle>
                </div>
                <Badge variant="outline">
                  {isBreakEvenOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Current Situation */}
              <div>
                <h4 className="font-semibold mb-3">Current Situation</h4>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-xs text-red-600 dark:text-red-400">Total Deficit</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(breakEven.currentDeficit)}</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-xs text-red-600 dark:text-red-400">Monthly Net Loss</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(breakEven.monthlyNetLoss)}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                    <p className="text-xs text-green-600 dark:text-green-400">Extra Profit/Order</p>
                    <p className="text-lg font-bold text-green-600">+{pdfData.profitPerOrder} DKK</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Current Club Frequency</p>
                    <p className="text-lg font-bold">{pdfData.clubFrequency.toFixed(2)} orders/member</p>
                  </div>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Option 1: Increase Frequency */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">Option 1: Increase Purchase Frequency</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-500 mb-4">
                    Keep same {formatNumber(pdfData.clubCustomers)} members, increase orders per member
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Required Frequency</span>
                      <span className="font-bold">{breakEven.requiredFrequency.toFixed(2)} orders/member</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Current Frequency</span>
                      <span className="font-medium">{pdfData.clubFrequency.toFixed(2)} orders/member</span>
                    </div>
                    <div className="flex justify-between text-blue-700 dark:text-blue-400">
                      <span className="text-sm font-medium">Required Increase</span>
                      <span className="font-bold">{breakEven.frequencyMultiple.toFixed(1)}x current</span>
                    </div>
                  </div>
                </div>

                {/* Option 2: Enroll More Members */}
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3">Option 2: Enroll More Members</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-500 mb-4">
                    Keep same {pdfData.clubFrequency.toFixed(2)} frequency, add more members
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Additional Members Needed</span>
                      <span className="font-bold">{formatNumber(breakEven.additionalMembersNeeded)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Current Members</span>
                      <span className="font-medium">{formatNumber(pdfData.clubCustomers)}</span>
                    </div>
                    <div className="flex justify-between text-purple-700 dark:text-purple-400">
                      <span className="text-sm font-medium">Required Growth</span>
                      <span className="font-bold">+{breakEven.membershipGrowth.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reality Check */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">Reality Check</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                      Both options are unrealistic without significant program changes:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-500 mt-2 space-y-1">
                      <li><strong>{breakEven.frequencyMultiple.toFixed(0)}x frequency increase</strong> is unrealistic for a fashion e-commerce brand</li>
                      <li><strong>+{breakEven.membershipGrowth.toFixed(0)}% member growth</strong> without increasing costs is challenging</li>
                      <li>The +{pdfData.profitPerOrder} DKK profit advantage per order is too small to offset costs</li>
                      <li>Consider <strong>reducing cashback rates</strong> or <strong>adjusting shipping thresholds</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Purchase Frequency Trajectory Chart */}
              <div>
                <h4 className="font-semibold mb-3">Purchase Frequency Trajectory to Break-Even</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 50]} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine y={breakEven.requiredFrequency} stroke="#ef4444" strokeDasharray="5 5" label="Break-Even Target" />
                      <Line type="monotone" dataKey="frequency" stroke="#3b82f6" strokeWidth={2} name="Projected Frequency" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Current frequency: {pdfData.clubFrequency.toFixed(2)} | Target for break-even: {breakEven.requiredFrequency.toFixed(2)} orders/member
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Evidence Summary (H1-H9) */}
      <Collapsible open={isEvidenceOpen} onOpenChange={setIsEvidenceOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Evidence Summary (H1-H9)</CardTitle>
                </div>
                <Badge variant="outline">
                  {isEvidenceOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {hypothesisEvidence.map((h) => (
                  <div
                    key={h.id}
                    className={`p-4 rounded-lg border ${
                      h.color === "green"
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                        : h.color === "red"
                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                        : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{h.id}: {h.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          h.color === "green"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : h.color === "red"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300"
                        }
                      >
                        {h.verdict}
                      </Badge>
                    </div>
                    <p className={`text-sm ${
                      h.color === "green"
                        ? "text-green-600 dark:text-green-400"
                        : h.color === "red"
                        ? "text-red-600 dark:text-red-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                      {h.finding}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Monthly Metrics Table */}
      <Collapsible open={isMonthlyOpen} onOpenChange={setIsMonthlyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Monthly Club Metrics Breakdown</CardTitle>
                </div>
                <Badge variant="outline">
                  {isMonthlyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left py-2 px-2 sticky left-0 bg-muted font-semibold">Metric</th>
                      {monthlyMetrics.map(m => (
                        <th key={m.month} className="text-right py-2 px-2 whitespace-nowrap">{m.month}</th>
                      ))}
                      <th className="text-right py-2 px-2 whitespace-nowrap bg-blue-50 dark:bg-blue-950/30 font-bold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Total Club Orders</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{formatNumber(m.clubOrders)}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{formatNumber(monthlyTotals.clubOrders)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Cashback Order Count</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{formatNumber(m.cbOrders)}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{formatNumber(monthlyTotals.cbOrders)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Total Cashback (DKK)</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{formatNumber(m.totalCB)}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{formatNumber(monthlyTotals.totalCB)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Avg Cashback (DKK)</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{m.avgCB}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{monthlyTotals.avgCB}</td>
                    </tr>
                    <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                      <td className="py-2 px-2 sticky left-0 bg-green-50 dark:bg-green-950/20 font-medium">AOV - All Club</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{m.aovAll}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-100 dark:bg-blue-900/30 font-bold">{monthlyTotals.aovAll}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">AOV - With CB</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{m.aovCB}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{monthlyTotals.aovCB}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">AOV - Without CB</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{m.aovNoCB}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{monthlyTotals.aovNoCB}</td>
                    </tr>
                    <tr className="border-b bg-blue-50/50 dark:bg-blue-950/20">
                      <td className="py-2 px-2 sticky left-0 bg-blue-50 dark:bg-blue-950/20 font-medium">Avg Profit - All Club</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{m.profitAll}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-100 dark:bg-blue-900/30 font-bold">{monthlyTotals.profitAll}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Avg Profit - CB Orders</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{m.profitCB}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{monthlyTotals.profitCB}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Shipping: PAID</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{formatNumber(m.shPaid)}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{formatNumber(monthlyTotals.shPaid)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Shipping: PAID+CB</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{formatNumber(m.shPaidCB)}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{formatNumber(monthlyTotals.shPaidCB)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 sticky left-0 bg-white dark:bg-zinc-950 font-medium">Shipping: FREE</td>
                      {monthlyMetrics.map(m => (
                        <td key={m.month} className="text-right py-2 px-2">{formatNumber(m.shFree)}</td>
                      ))}
                      <td className="text-right py-2 px-2 bg-blue-50 dark:bg-blue-950/30 font-bold">{formatNumber(monthlyTotals.shFree)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Further Investigation Needed */}
      <Collapsible open={isInvestigationsOpen} onOpenChange={setIsInvestigationsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-base">Further Investigation Needed</CardTitle>
                </div>
                <Badge variant="outline">
                  {isInvestigationsOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* CRITICAL */}
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  <Badge variant="destructive">CRITICAL</Badge>
                  Selection Bias & Incrementality
                </h4>
                <ul className="space-y-2 text-sm text-red-700 dark:text-red-400">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Selection Bias:</strong> Are Club members inherently better customers who would buy anyway? Without pre-Club data, we cannot isolate the causal impact of Club membership.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Incrementality:</strong> How many Club orders are truly "incremental" vs. orders that would have happened anyway? Current data shows correlation, not causation.</span>
                  </li>
                </ul>
              </div>

              {/* HIGH PRIORITY */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                  <Badge className="bg-yellow-500">HIGH PRIORITY</Badge>
                  Cost Structure Analysis
                </h4>
                <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Shipping Subsidy:</strong> Analyze if lowering free shipping thresholds for Club could reduce costs while maintaining value perception</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Cashback Rates:</strong> Test lower cashback percentages or caps to reduce redemption costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Customer Acquisition Cost (CAC):</strong> Compare CAC for Club vs Non-Club to understand true member value</span>
                  </li>
                </ul>
              </div>

              {/* MEDIUM PRIORITY */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">MEDIUM</Badge>
                  Additional Analysis
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Ghost Member Activation:</strong> 70% of Club members have no Club orders. What's the potential if we re-engage them?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Cannibalization:</strong> Are Club members simply shifting existing purchases to earn cashback?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Operational Costs:</strong> What are the hidden costs of running the Club program (tech, support, marketing)?</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Methodology & Data Sources */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Methodology & Data Sources</CardTitle>
                </div>
                <Badge variant="outline">
                  {isMethodologyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Conservative Club Attribution</h4>
                <p>
                  Club orders are defined as orders where <code className="bg-muted px-1 rounded">customerGroup.key = 'club'</code>
                  AND the customer appears in the cashback file AND the order was placed AFTER the customer's Club join date.
                  This conservative approach ensures we only count orders that genuinely occurred during Club membership.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">ROI Calculation</h4>
                <p>
                  <strong>Incremental Profit</strong> = (Club Avg Profit - Non-Club Avg Profit) × Club Orders<br/>
                  <strong>Total Costs</strong> = Cashback Redeemed + Shipping Subsidy<br/>
                  <strong>Net Value</strong> = Incremental Profit - Total Costs<br/>
                  <strong>ROI</strong> = (Net Value / Total Costs) × 100
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Sources</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Orders:</strong> orders_with_customerid.parquet ({formatNumber(CORE_METRICS.orders.total)} orders)</li>
                  <li><strong>Cashback:</strong> cashback_from_merged.parquet ({formatNumber(CORE_METRICS.cashback.totalRecords)} records)</li>
                  <li><strong>Profit:</strong> profit_complete.parquet ({formatNumber(CORE_METRICS.profit.ordersWithProfitData)} orders)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Analysis Period</h4>
                <p>
                  April 1, 2025 - January 31, 2026 (10 months post-Club launch).
                  Pre-launch baseline analysis is limited because customerId tracking only began in March 2025.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Currency Conversion</h4>
                <p>
                  All monetary values are converted to DKK using fixed exchange rates.
                  See the Data Source tab for complete FX rate table.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Limitations</h4>
                <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-500 space-y-1">
                  <li>Cannot distinguish "redeemed cashback" from "never earned" in zero-balance records</li>
                  <li>Club join date derived from first cashback record (may not be exact signup)</li>
                  <li>Selection bias cannot be measured without pre-Club customer data</li>
                  <li>Incrementality analysis not possible with current data</li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
