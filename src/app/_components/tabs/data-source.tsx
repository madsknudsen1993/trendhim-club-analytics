"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  Info,
  ShoppingCart,
  Users,
  DollarSign,
  Wallet,
  TrendingUp,
} from "lucide-react";

// ============================================================================
// CORE METRICS - SINGLE SOURCE OF TRUTH
// All values from original Streamlit dashboard PDF (Data Source - Read Me tab)
// Last updated: 2026-02-20
// ============================================================================
export const CORE_METRICS = {
  analysisPeriod: {
    start: "2025-04-01",
    end: "2026-01-31",
    months: 10,
    label: "April 2025 - January 2026",
  },
  orders: {
    total: 646132,
    club: 75272,
    clubSimple: 243498,
    nonClub: 570860,
    clubPercentage: 11.6,
    nonClubPercentage: 88.4,
  },
  customers: {
    totalUnique: 523233,
    totalClub: 57968,
    clubPercentage: 11.1,
    neverClub: 465265,
    neverClubPercentage: 88.9,
    customersWithCashback: 20052,
  },
  cashbackSegments: {
    hasBalance: { count: 20052, percentage: 34.6 },
    zeroBalance: { count: 37916, percentage: 65.4 },
  },
  aov: {
    overall: 440,
    club: 476,
    nonClub: 442,
    differenceDKK: 34,
    differencePercent: 7.7,
  },
  revenue: {
    total: 288060000,
    club: 35810000,
    nonClub: 252200000,
  },
  cashback: {
    totalRecords: 71441,
    recordsWithCashback: 26587,
    recordsWithCashbackPercent: 37.1,
    totalCashbackAmount: 3605323,
    avgCashbackPerRecord: 86,
    engagementRate: 34.6,
  },
  profit: {
    ordersWithProfitData: 1565116,
    avgProfitPerOrder: 220,
    totalProfit: 343810000,
    clubAvgProfit: 224,
    nonClubAvgProfit: 223,
    differenceDKK: 1,
  },
  costs: {
    cashbackRedeemed: 2605323,  // Actual redeemed amount (not total balance)
    cashbackOrderCount: 26507,  // From PDF: 26,507 redemptions
    avgCashbackPerOrder: 98,    // From PDF: avg 98 DKK
    shippingSubsidy: 838770,
    shippingSubsidyOrderCount: 27959,
    avgShippingSubsidy: 30,
    totalProgramCosts: 3444093,  // 2,605,323 + 838,770
  },
  value: {
    incrementalProfit: 102835,   // From PDF Final Conclusion
    netValue: -3341259,          // 102,835 - 3,444,093
    monthlyNetLoss: 334126,      // 3,341,259 / 10 months
    roi: -97.0,                  // From PDF
  },
  frequency: {
    club: 1.30,
    nonClub: 1.23,
    differencePercent: 5.7,
  },
  dataCoverage: {
    ordersFile: 646132,
    cashbackFile: 71441,
    profitFile: 1565116,
  },
};

// FX Rates from PDF
export const FX_RATES: Record<string, { rate: number; ordersCount: number; share: string }> = {
  CHF: { rate: 7.800, ordersCount: 28725, share: "4.4%" },
  CZK: { rate: 0.318, ordersCount: 28369, share: "4.4%" },
  RON: { rate: 1.500, ordersCount: 22430, share: "3.5%" },
  HUF: { rate: 0.019, ordersCount: 21978, share: "3.4%" },
  USD: { rate: 7.000, ordersCount: 18605, share: "2.9%" },
  BGN: { rate: 3.800, ordersCount: 14941, share: "2.3%" },
  AUD: { rate: 4.100, ordersCount: 14331, share: "2.2%" },
  CAD: { rate: 5.200, ordersCount: 10028, share: "1.6%" },
  NZD: { rate: 4.200, ordersCount: 5730, share: "0.9%" },
  SGD: { rate: 5.200, ordersCount: 3430, share: "0.5%" },
};

export const FX_RATE_VALUES: Record<string, number> = Object.fromEntries(
  Object.entries(FX_RATES).map(([k, v]) => [k, v.rate])
);

export const SHIPPING_THRESHOLDS = {
  DK: { club: 249, nonClub: 399, currency: "DKK" },
  SE: { club: 349, nonClub: 549, currency: "SEK" },
  NO: { club: 349, nonClub: 549, currency: "NOK" },
  DE: { club: 39, nonClub: 59, currency: "EUR" },
  GB: { club: 29, nonClub: 49, currency: "GBP" },
  NL: { club: 39, nonClub: 59, currency: "EUR" },
  AT: { club: 39, nonClub: 59, currency: "EUR" },
  CH: { club: 49, nonClub: 79, currency: "CHF" },
  PL: { club: 149, nonClub: 249, currency: "PLN" },
};

function formatNumber(num: number): string {
  return new Intl.NumberFormat("da-DK").format(Math.round(num));
}

function formatCurrency(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M DKK`;
  }
  return `${formatNumber(num)} DKK`;
}

export function DataSourceTab() {
  const [isFile1Open, setIsFile1Open] = useState(false);
  const [isFile2Open, setIsFile2Open] = useState(false);
  const [isFile3Open, setIsFile3Open] = useState(false);
  const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#06402b]" />
            <CardTitle className="text-xl">Data Source - Read Me</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            Core metrics, data files, and column definitions used across all analyses
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Single Source of Truth Box */}
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-700 dark:text-green-400">Single Source of Truth - Pre-computed for Performance</h4>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                All metrics on this page are pre-computed in <code className="bg-green-100 dark:bg-green-900 px-1 rounded">load_all_data()</code> at startup and cached for 1 hour.
              </p>
              <div className="mt-3 text-sm text-green-600 dark:text-green-500">
                <p><strong>When adding new metrics:</strong></p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Add the calculation to <code className="bg-green-100 dark:bg-green-900 px-1 rounded">load_all_data()</code> in the core_metrics section</li>
                  <li>Add the metric to this documentation page</li>
                  <li>Reference via <code className="bg-green-100 dark:bg-green-900 px-1 rounded">all_data["core_metrics"]["metric_name"]</code></li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Tabs Use These Numbers Box */}
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-700 dark:text-green-400">All Tabs Use These Numbers (Conservative Approach)</h4>
              <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                Final Conclusion, H9 (ROI), and all analyses use the metrics shown on this page:
              </p>
              <ul className="mt-2 text-sm text-green-600 dark:text-green-500 space-y-1">
                <li>• Club Orders: <strong>{formatNumber(CORE_METRICS.orders.club)}</strong> ({CORE_METRICS.orders.clubPercentage}%)</li>
                <li>• Club Avg Profit: <strong>{CORE_METRICS.profit.clubAvgProfit} DKK</strong> | Non-Club: <strong>{CORE_METRICS.profit.nonClubAvgProfit} DKK</strong> | Difference: <strong>+{CORE_METRICS.profit.differenceDKK} DKK</strong></li>
                <li>• Club AOV: <strong>{CORE_METRICS.aov.club} DKK</strong> | Non-Club: <strong>{CORE_METRICS.aov.nonClub} DKK</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Box */}
      <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="w-full">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">Methodology: Conservative Club Order Definition</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2">
                We use a conservative definition of "Club Order" to measure the TRUE impact of the Club program:
              </p>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow className="bg-yellow-100 dark:bg-yellow-900/50">
                    <TableHead className="text-yellow-800 dark:text-yellow-300">Approach</TableHead>
                    <TableHead className="text-yellow-800 dark:text-yellow-300">Definition</TableHead>
                    <TableHead className="text-right text-yellow-800 dark:text-yellow-300">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-green-100/50 dark:bg-green-900/30">
                    <TableCell className="font-medium text-green-700 dark:text-green-400">Conservative (Used)</TableCell>
                    <TableCell className="text-green-700 dark:text-green-400">Orders from verified cashback file customers placed AFTER their club join date</TableCell>
                    <TableCell className="text-right font-bold text-green-700 dark:text-green-400">{formatNumber(CORE_METRICS.orders.club)} orders</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground">Simple (Not Used)</TableCell>
                    <TableCell className="text-muted-foreground">All orders where <code className="bg-muted px-1 rounded">customerGroup.key = 'club'</code></TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatNumber(CORE_METRICS.orders.clubSimple)} orders</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-3">
                <strong>Why Conservative?</strong> The simple approach includes orders placed before joining the club and customers tagged as "club" who never engaged with cashback. This inflates the numbers and doesn't measure behavioral change. The conservative approach isolates the actual impact of club membership on customer behavior.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                <strong>Analysis Period:</strong> April 1, 2025 - January 31, 2026 (10 months post-launch)
              </p>
              <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-500">
                <strong>Limitations & Assumptions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Club join date = First cashback record date (may not be exact signup date)</li>
                  <li>Customers not in cashback file are excluded from "Club" even if tagged as club</li>
                  <li>Orders placed on the same day as joining are included as "Club orders"</li>
                  <li>Orders must be tagged with <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">customerGroup.key = 'club'</code></li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Core Metrics Reference */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">1. Core Metrics Reference</h2>
        <p className="text-sm text-muted-foreground">
          These are the standardized metrics pre-computed at startup and used consistently across all hypothesis analyses.
        </p>
      </div>

      {/* Order Metrics Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Order Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Data Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Orders</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.orders.total)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">COUNT(*) from orders file</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet</TableCell>
              </TableRow>
              <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                <TableCell className="font-medium text-green-700 dark:text-green-400">Club Orders (Conservative)</TableCell>
                <TableCell className="text-right font-bold text-green-600">{formatNumber(CORE_METRICS.orders.club)} ({CORE_METRICS.orders.clubPercentage}%)</TableCell>
                <TableCell className="text-green-600 text-sm">Orders from verified cashback customers, placed AFTER join date</TableCell>
                <TableCell className="text-sm text-green-600">orders + cashback_from_merged.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Non-Club Orders</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.orders.nonClub)} ({CORE_METRICS.orders.nonClubPercentage}%)</TableCell>
                <TableCell className="text-muted-foreground text-sm">All orders NOT meeting conservative Club criteria</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Simple Club Orders (Reference)</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatNumber(CORE_METRICS.orders.clubSimple)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">COUNT(*) WHERE customerGroup.key = 'club' (NOT USED)</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Date Range</TableCell>
                <TableCell className="text-right font-bold">{CORE_METRICS.analysisPeriod.start} to {CORE_METRICS.analysisPeriod.end}</TableCell>
                <TableCell className="text-muted-foreground text-sm">MIN(createdAt) to MAX(createdAt)</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Metrics Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Customer Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Data Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Unique Customers</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.customers.totalUnique)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">COUNT(DISTINCT customerId)</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet</TableCell>
              </TableRow>
              <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                <TableCell className="font-medium text-green-700 dark:text-green-400">Verified Club Members</TableCell>
                <TableCell className="text-right font-bold text-green-600">{formatNumber(CORE_METRICS.customers.totalClub)} ({CORE_METRICS.customers.clubPercentage}%)</TableCell>
                <TableCell className="text-green-600 text-sm">COUNT(DISTINCT customerId) from cashback file</TableCell>
                <TableCell className="text-sm text-green-600">cashback_from_merged.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Never-Club Customers</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.customers.neverClub)} ({CORE_METRICS.customers.neverClubPercentage}%)</TableCell>
                <TableCell className="text-muted-foreground text-sm">Customers not in cashback file</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders + cashback_from_merged.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Customers with Cashback Balance &gt; 0</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.customers.customersWithCashback)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">COUNT(DISTINCT customerId) WHERE cashback amount &gt; 0</TableCell>
                <TableCell className="text-sm text-muted-foreground">cashback_from_merged.parquet</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AOV Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">Average Order Value (AOV) - All in DKK</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Data Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Overall AOV</TableCell>
                <TableCell className="text-right font-bold">{CORE_METRICS.aov.overall} DKK</TableCell>
                <TableCell className="text-muted-foreground text-sm">AVG(totalPrice.centAmount / 100 × FX_rate)</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet + FX rates</TableCell>
              </TableRow>
              <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                <TableCell className="font-medium text-green-700 dark:text-green-400">Club Order AOV</TableCell>
                <TableCell className="text-right font-bold text-green-600">{CORE_METRICS.aov.club} DKK</TableCell>
                <TableCell className="text-green-600 text-sm">AVG(revenue_dkk) WHERE customerGroup.key = 'club'</TableCell>
                <TableCell className="text-sm text-green-600">orders_with_customerid.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Non-Club Order AOV</TableCell>
                <TableCell className="text-right font-bold">{CORE_METRICS.aov.nonClub} DKK</TableCell>
                <TableCell className="text-muted-foreground text-sm">AVG(revenue_dkk) WHERE customerGroup.key != 'club'</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet</TableCell>
              </TableRow>
              <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                <TableCell className="font-medium text-green-700 dark:text-green-400">AOV Difference (Club vs Non-Club)</TableCell>
                <TableCell className="text-right font-bold text-green-600">+{CORE_METRICS.aov.differenceDKK} DKK (+{CORE_METRICS.aov.differencePercent}%)</TableCell>
                <TableCell className="text-green-600 text-sm">Club AOV - Non-Club AOV</TableCell>
                <TableCell className="text-sm text-green-600">Calculated</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cashback Metrics Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-base">Cashback Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Data Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Cashback Records</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.cashback.totalRecords)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">COUNT(*) from cashback file</TableCell>
                <TableCell className="text-sm text-muted-foreground">cashback_from_merged.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Records with Cashback &gt; 0</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.cashback.recordsWithCashback)} ({CORE_METRICS.cashback.recordsWithCashbackPercent}%)</TableCell>
                <TableCell className="text-muted-foreground text-sm">COUNT(*) WHERE amount &gt; 0</TableCell>
                <TableCell className="text-sm text-muted-foreground">cashback_from_merged.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Cashback Amount</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(CORE_METRICS.cashback.totalCashbackAmount)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">SUM(amount × FX_rate) WHERE amount &gt; 0</TableCell>
                <TableCell className="text-sm text-muted-foreground">cashback_from_merged.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Average Cashback per Record</TableCell>
                <TableCell className="text-right font-bold">{CORE_METRICS.cashback.avgCashbackPerRecord} DKK</TableCell>
                <TableCell className="text-muted-foreground text-sm">AVG(amount_dkk) WHERE amount &gt; 0</TableCell>
                <TableCell className="text-sm text-muted-foreground">cashback_from_merged.parquet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Cashback Engagement Rate</TableCell>
                <TableCell className="text-right font-bold">{CORE_METRICS.cashback.engagementRate}%</TableCell>
                <TableCell className="text-muted-foreground text-sm">Customers with cashback / Club customers × 100</TableCell>
                <TableCell className="text-sm text-muted-foreground">Calculated</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Club Member Cashback Segments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Club Member Cashback Segments</CardTitle>
          </div>
          <CardDescription>Distribution of Club members by cashback status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead>Definition</TableHead>
                <TableHead>Data Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                <TableCell className="font-medium text-green-700 dark:text-green-400">🟢 Has Cashback Balance &gt; 0</TableCell>
                <TableCell className="text-right font-bold text-green-600">{formatNumber(CORE_METRICS.cashbackSegments.hasBalance.count)}</TableCell>
                <TableCell className="text-right font-bold text-green-600">{CORE_METRICS.cashbackSegments.hasBalance.percentage}%</TableCell>
                <TableCell className="text-green-600 text-sm">Club customers with positive cashback balance in file</TableCell>
                <TableCell className="text-sm text-green-600">cashback WHERE amount &gt; 0</TableCell>
              </TableRow>
              <TableRow className="bg-yellow-50/50 dark:bg-yellow-950/20">
                <TableCell className="font-medium text-yellow-700 dark:text-yellow-400">🟡 Zero Balance</TableCell>
                <TableCell className="text-right font-bold text-yellow-600">{formatNumber(CORE_METRICS.cashbackSegments.zeroBalance.count)}</TableCell>
                <TableCell className="text-right font-bold text-yellow-600">{CORE_METRICS.cashbackSegments.zeroBalance.percentage}%</TableCell>
                <TableCell className="text-yellow-600 text-sm">In cashback file but amount = 0 (may be redeemed OR never earned)</TableCell>
                <TableCell className="text-sm text-yellow-600">cashback WHERE amount = 0</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">TOTAL Club Members</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.customers.totalClub)}</TableCell>
                <TableCell className="text-right font-bold">100.0%</TableCell>
                <TableCell className="text-sm">All customers with at least one order where customerGroup.key = 'club'</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders_with_customerid.parquet</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Segment Distribution Bar */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Segment Distribution</p>
            <div className="h-8 flex rounded-lg overflow-hidden">
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${CORE_METRICS.cashbackSegments.hasBalance.percentage}%` }}
              >
                {CORE_METRICS.cashbackSegments.hasBalance.percentage}%
              </div>
              <div
                className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${CORE_METRICS.cashbackSegments.zeroBalance.percentage}%` }}
              >
                {CORE_METRICS.cashbackSegments.zeroBalance.percentage}%
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>🟢 Has Balance ({formatNumber(CORE_METRICS.cashbackSegments.hasBalance.count)})</span>
              <span>🟡 Zero Balance ({formatNumber(CORE_METRICS.cashbackSegments.zeroBalance.count)})</span>
            </div>
          </div>

          {/* Data Interpretation Note */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm">Data Interpretation Note</h4>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                  <strong>Zero Balance</strong> customers are AMBIGUOUS - they could be:
                </p>
                <ul className="list-disc list-inside text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                  <li>Customers who earned and fully redeemed cashback</li>
                  <li>Customers who never earned cashback (enrolled but inactive)</li>
                </ul>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                  We CANNOT distinguish between "redeemed" and "never earned" with this data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Metrics Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">Profit Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Data Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Orders with Profit Data</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(CORE_METRICS.profit.ordersWithProfitData)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">COUNT(DISTINCT Order Number)</TableCell>
                <TableCell className="text-sm text-muted-foreground">profit_data (parquet)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Average Profit per Order</TableCell>
                <TableCell className="text-right font-bold">{CORE_METRICS.profit.avgProfitPerOrder} DKK</TableCell>
                <TableCell className="text-muted-foreground text-sm">AVG(Total Profit)</TableCell>
                <TableCell className="text-sm text-muted-foreground">profit_data (parquet)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Profit</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(CORE_METRICS.profit.totalProfit)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">SUM(Total Profit)</TableCell>
                <TableCell className="text-sm text-muted-foreground">profit_data (parquet)</TableCell>
              </TableRow>
              <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                <TableCell className="font-medium text-green-700 dark:text-green-400">Club Avg Profit per Order</TableCell>
                <TableCell className="text-right font-bold text-green-600">{CORE_METRICS.profit.clubAvgProfit} DKK</TableCell>
                <TableCell className="text-green-600 text-sm">AVG(Total Profit) for Club orders</TableCell>
                <TableCell className="text-sm text-green-600">orders + profit joined</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Non-Club Avg Profit per Order</TableCell>
                <TableCell className="text-right font-bold">{CORE_METRICS.profit.nonClubAvgProfit} DKK</TableCell>
                <TableCell className="text-muted-foreground text-sm">AVG(Total Profit) for Non-Club orders</TableCell>
                <TableCell className="text-sm text-muted-foreground">orders + profit joined</TableCell>
              </TableRow>
              <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                <TableCell className="font-medium text-green-700 dark:text-green-400">Profit Difference (Club vs Non-Club)</TableCell>
                <TableCell className="text-right font-bold text-green-600">+{CORE_METRICS.profit.differenceDKK} DKK</TableCell>
                <TableCell className="text-green-600 text-sm">Club Avg Profit - Non-Club Avg Profit</TableCell>
                <TableCell className="text-sm text-green-600">Calculated</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Currency Conversion Rates Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Currency Conversion Rates to DKK</CardTitle>
          </div>
          <CardDescription>All monetary values are converted to Danish Kroner (DKK) using the following fixed exchange rates:</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Rate to DKK</TableHead>
                <TableHead className="text-right">Orders Count</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(FX_RATES)
                .sort((a, b) => b[1].ordersCount - a[1].ordersCount)
                .map(([currency, data]) => (
                  <TableRow key={currency}>
                    <TableCell className="font-medium">{currency}</TableCell>
                    <TableCell className="text-right">{data.rate.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{formatNumber(data.ordersCount)}</TableCell>
                    <TableCell className="text-right">{data.share}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 2: Data File Structure */}
      <div className="space-y-2 pt-6">
        <h2 className="text-xl font-bold">2. Data File Structure & Column Definitions</h2>
        <p className="text-sm text-muted-foreground">
          Detailed documentation of each data file, its columns, and how they are interpreted in the analyses.
        </p>
      </div>

      {/* File 1: orders_with_customerid.parquet */}
      <Collapsible open={isFile1Open} onOpenChange={setIsFile1Open}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">File 1: orders_with_customerid.parquet</CardTitle>
                </div>
                <Badge variant="outline">{isFile1Open ? "Click to collapse" : "Click to expand"}</Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="mb-4 grid gap-2 md:grid-cols-3 text-sm">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded"><strong>Location:</strong> data/processed/orders_with_customerid.parquet</div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded"><strong>Records:</strong> {formatNumber(CORE_METRICS.dataCoverage.ordersFile)} orders</div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded"><strong>Purpose:</strong> Main order transaction file</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-mono text-xs">orderNumber</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">CZ2528949</TableCell><TableCell className="text-sm">Unique order identifier. Used to join with profit and cashback data.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">createdAt</TableCell><TableCell>datetime</TableCell><TableCell className="font-mono text-xs">2025-09-06 11:02:32</TableCell><TableCell className="text-sm">Order creation timestamp (UTC). Used for time-based analysis and determining Club join date.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">customerId</TableCell><TableCell>UUID string</TableCell><TableCell className="font-mono text-xs">615e976f-40b1-496e-bb3d-5cb3bb7e5121</TableCell><TableCell className="text-sm">Unique customer identifier. PRIMARY KEY for tracking customer behavior across orders.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">customer_key</TableCell><TableCell>UUID string</TableCell><TableCell className="font-mono text-xs">615e976f-40b1-496e-bb3d-5cb3bb7e5121</TableCell><TableCell className="text-sm">Alternative customer key (same as customerId in most cases).</TableCell></TableRow>
                  <TableRow className="bg-green-50/50 dark:bg-green-950/20"><TableCell className="font-mono text-xs text-green-700">customerGroup.key</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs text-green-700">'club' or other</TableCell><TableCell className="text-sm text-green-700">Customer segment at order time. 'club' = Club member order. This determines if an order is a Club order.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">totalPrice.centAmount</TableCell><TableCell>integer</TableCell><TableCell className="font-mono text-xs">95920</TableCell><TableCell className="text-sm">Order total in CENTS (divide by 100 for currency units). Must convert to DKK for comparisons.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">totalPrice.currencyCode</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">CZK</TableCell><TableCell className="text-sm">Currency code (EUR, DKK, SEK, etc.). Used with FX rates to convert to DKK.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">locale</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">cs-CZ</TableCell><TableCell className="text-sm">Locale/country code (e.g., da-DK, de-DE). Indicates customer market.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">orderState</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">Complete</TableCell><TableCell className="text-sm">Order status (Complete, Cancelled, etc.). Analysis includes all states.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">total_items</TableCell><TableCell>integer</TableCell><TableCell className="font-mono text-xs">1</TableCell><TableCell className="text-sm">Number of items in the order.</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* File 2: cashback_from_merged.parquet */}
      <Collapsible open={isFile2Open} onOpenChange={setIsFile2Open}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-base">File 2: cashback_from_merged.parquet</CardTitle>
                </div>
                <Badge variant="outline">{isFile2Open ? "Click to collapse" : "Click to expand"}</Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="mb-4 grid gap-2 md:grid-cols-3 text-sm">
                <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded"><strong>Location:</strong> data/processed/cashback_from_merged.parquet</div>
                <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded"><strong>Records:</strong> {formatNumber(CORE_METRICS.dataCoverage.cashbackFile)} records</div>
                <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded"><strong>Purpose:</strong> Cashback balance records - shows CURRENT BALANCE at time of order</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-mono text-xs">orderNumber</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">SK261751</TableCell><TableCell className="text-sm">Order number. Links to orders file.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">createdAt</TableCell><TableCell>datetime string</TableCell><TableCell className="font-mono text-xs">2026-01-17 13:58:25</TableCell><TableCell className="text-sm">Order creation timestamp.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">customerId</TableCell><TableCell>UUID string</TableCell><TableCell className="font-mono text-xs">9c13d10a-8965-459b-a218-35d29cfb38a</TableCell><TableCell className="text-sm">Customer identifier. Links to orders file.</TableCell></TableRow>
                  <TableRow className="bg-green-50/50 dark:bg-green-950/20"><TableCell className="font-mono text-xs text-green-700">customerGroup.key</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs text-green-700">'club'</TableCell><TableCell className="text-sm text-green-700">Always 'club' in this file - only Club orders have cashback records.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">customLineItems.custom.fields.amount.centAmount</TableCell><TableCell>integer</TableCell><TableCell className="font-mono text-xs">0</TableCell><TableCell className="text-sm">Cashback amount in CENTS. Divide by 100 for currency units. NOTE: This is CURRENT BALANCE, not transaction history.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">customLineItems.custom.fields.amount.currencyCode</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">EUR</TableCell><TableCell className="text-sm">Currency of cashback amount.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">customLineItems.custom.type.key</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">'custom-line-item-cashback'</TableCell><TableCell className="text-sm">Line item type identifier. Always cashback-related.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">customLineItems.money.centAmount</TableCell><TableCell>integer</TableCell><TableCell className="font-mono text-xs">0</TableCell><TableCell className="text-sm">Alternative amount field (usually 0).</TableCell></TableRow>
                </TableBody>
              </Table>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm">Important Data Limitation</h4>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      The amount field shows <strong>CURRENT BALANCE</strong>, not transaction history.
                    </p>
                    <ul className="list-disc list-inside text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      <li><strong>amount &gt; 0:</strong> Customer HAS cashback balance (definitely earned cashback)</li>
                      <li><strong>amount = 0:</strong> AMBIGUOUS - could be "never earned" OR "fully redeemed"</li>
                    </ul>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                      We CANNOT distinguish between "redeemed" and "never earned" with this data.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* File 3: profit_complete.parquet */}
      <Collapsible open={isFile3Open} onOpenChange={setIsFile3Open}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">File 3: profit_complete.parquet</CardTitle>
                </div>
                <Badge variant="outline">{isFile3Open ? "Click to collapse" : "Click to expand"}</Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="mb-4 grid gap-2 md:grid-cols-3 text-sm">
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded"><strong>Location:</strong> th_club_data/processed/profit_complete.parquet</div>
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded"><strong>Records:</strong> {formatNumber(CORE_METRICS.dataCoverage.profitFile)} order records</div>
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded"><strong>Purpose:</strong> Order profitability data from Power BI</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-mono text-xs">Order Number</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">2800153451</TableCell><TableCell className="text-sm">Order number. Links to orders file via orderNumber.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">Date</TableCell><TableCell>datetime</TableCell><TableCell className="font-mono text-xs">2024-04-07</TableCell><TableCell className="text-sm">Order date.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">Country Billing</TableCell><TableCell>string</TableCell><TableCell className="font-mono text-xs">AU</TableCell><TableCell className="text-sm">Billing country code (AU, DE, DK, etc.).</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">Revenue</TableCell><TableCell>float</TableCell><TableCell className="font-mono text-xs">2587.88</TableCell><TableCell className="text-sm">Order revenue in DKK.</TableCell></TableRow>
                  <TableRow className="bg-green-50/50 dark:bg-green-950/20"><TableCell className="font-mono text-xs text-green-700">Total Profit</TableCell><TableCell>float</TableCell><TableCell className="font-mono text-xs text-green-700">740.88</TableCell><TableCell className="text-sm text-green-700">Total profit for this order in DKK (revenue minus all costs).</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">Product</TableCell><TableCell>float</TableCell><TableCell className="font-mono text-xs">723.48</TableCell><TableCell className="text-sm">Product/COGS cost in DKK.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">Freight</TableCell><TableCell>float</TableCell><TableCell className="font-mono text-xs">948.16</TableCell><TableCell className="text-sm">Shipping/freight cost in DKK.</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">Payment</TableCell><TableCell>float</TableCell><TableCell className="font-mono text-xs">74.15</TableCell><TableCell className="text-sm">Payment processing cost in DKK.</TableCell></TableRow>
                </TableBody>
              </Table>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 mt-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 text-sm">How We Use Profit Data</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      The profit file contains one row per order with pre-calculated Total Profit.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-2 font-mono">
                      JOIN: orders.orderNumber = profit."Order Number"
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      This allows comparing Club vs Non-Club order profitability.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 4: Key Definitions */}
      <div className="space-y-2 pt-6">
        <h2 className="text-xl font-bold">4. Key Definitions Used in Analysis</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Definition</TableHead>
                <TableHead>Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Club Order</TableCell>
                <TableCell>An order where customerGroup.key = 'club'</TableCell>
                <TableCell className="text-sm text-muted-foreground">Identifies orders placed by Club members at time of purchase</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Club Customer</TableCell>
                <TableCell>A customer who has at least ONE Club order</TableCell>
                <TableCell className="text-sm text-muted-foreground">Allows tracking same customer behavior before/after joining Club</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Club Join Date</TableCell>
                <TableCell>MIN(createdAt) of orders WHERE customerGroup.key = 'club' per customerId</TableCell>
                <TableCell className="text-sm text-muted-foreground">Determines when customer became Club member for before/after analysis</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Never-Club Customer</TableCell>
                <TableCell>A customer with zero Club orders</TableCell>
                <TableCell className="text-sm text-muted-foreground">Control group for comparison (but may have selection bias)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Before Club Orders</TableCell>
                <TableCell>Orders from Club customers placed BEFORE their Club join date</TableCell>
                <TableCell className="text-sm text-muted-foreground">Baseline behavior for before/after comparison</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">After Club Orders</TableCell>
                <TableCell>Orders from Club customers placed ON OR AFTER their Club join date</TableCell>
                <TableCell className="text-sm text-muted-foreground">Post-treatment behavior for comparison</TableCell>
              </TableRow>
              <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                <TableCell className="font-medium text-red-700 dark:text-red-400">Selection Bias</TableCell>
                <TableCell className="text-red-600">When better customers self-select into Club, inflating apparent lift</TableCell>
                <TableCell className="text-sm text-red-600">CANNOT ANALYZE - requires pre-Club customer data (customerId not available before March 2025)</TableCell>
              </TableRow>
              <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                <TableCell className="font-medium text-red-700 dark:text-red-400">Incrementality</TableCell>
                <TableCell className="text-red-600">Orders that would NOT have occurred without Club membership</TableCell>
                <TableCell className="text-sm text-red-600">CANNOT ANALYZE - requires pre-Club customer data (customerId not available before March 2025)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
