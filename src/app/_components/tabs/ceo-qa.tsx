"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calculator,
  TrendingUp,
  Truck,
  Wallet,
  Users,
  Database,
  FileText,
  ArrowRight,
  Info,
  LineChart as LineChartIcon,
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

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

function formatCurrency(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M DKK`;
  }
  return `${formatNumber(num)} DKK`;
}

// ============================================================================
// NEW SEGMENT-ISOLATED METRICS
// Source: scripts/segment_pnl_isolated.py (run 2026-04-10)
// Methodology: Track ONLY Club members, same customers before/after
// ============================================================================

const ANALYSIS_PERIOD = {
  beforeStart: "2023-01-01",
  beforeEnd: "2025-03-31",
  afterStart: "2025-04-01",
  afterEnd: "2026-03-02",
  monthsBefore: 26.97,
  monthsAfter: 11.01,
};

// NEW: Segment-Isolated Best Customers
// Filter: Club members with 2+ orders AND 60+ days span in BOTH periods
const NEW_BEST = {
  sampleSize: 4589,
  before: {
    orders: 22188,
    frequency: 0.179,
    itemsPerOrder: 2.34,
    aov: 500.54,
    profitPerOrder: 243.83,
    shippingPerOrder: 22.49,
    freeShippingPct: 36.4,
    monthlyProfit: 43.71,
    cbUsageRate: 0,
    medianCbPerOrder: 0,
  },
  after: {
    orders: 14685,
    frequency: 0.291,
    itemsPerOrder: 2.25,
    aov: 452.32,
    profitPerOrder: 218.83,
    shippingPerOrder: 22.25,
    freeShippingPct: 37.4,
    monthlyProfit: 63.63,
    cbUsageRate: 9.0,
    medianCbPerOrder: 73.55,
    totalCbRedeemed: 3071397,
  },
  changes: {
    frequencyPct: 62.2,
    aovPct: -9.6,
    profitPerOrderPct: -10.3,
    monthlyProfitPct: 45.6,
    freeShippingPP: 1.0,
  },
  costs: {
    shippingCostMonthly: 1354,
    subsidyZoneOrdersBefore: 10145,
    subsidyZoneOrdersAfter: 6910,
    subsidyZoneFreeRateBefore: 31.9, // Free shipping % in 199-449 zone BEFORE
    subsidyZoneFreeRateAfter: 37.4,  // Free shipping % in 199-449 zone AFTER
    incrementalFreeRate: 5.5,        // = After - Before
    incrementalFreeOrders: 382,
  },
  value: {
    monthlyProfitLift: 19.92,
    totalMonthlyUplift: 91411,
    netMonthlyValue: 90056,
  },
};

// NEW: Segment-Isolated Medium Customers
// Filter: Club members with 1+ order before, 2+ orders AND 60+ days after
const NEW_MEDIUM = {
  sampleSize: 4664,
  before: {
    orders: 6181,
    frequency: 0.049,
    itemsPerOrder: 2.10,
    aov: 464.78,
    profitPerOrder: 232.38,
    shippingPerOrder: 22.52,
    freeShippingPct: 35.4,
    monthlyProfit: 11.42,
    cbUsageRate: 0,
    medianCbPerOrder: 0,
  },
  after: {
    orders: 12707,
    frequency: 0.248,
    itemsPerOrder: 2.11,
    aov: 443.70,
    profitPerOrder: 217.77,
    shippingPerOrder: 22.19,
    freeShippingPct: 37.2,
    monthlyProfit: 53.91,
    cbUsageRate: 6.3,
    medianCbPerOrder: 68.63,
    totalCbRedeemed: 1249498,
  },
  changes: {
    frequencyPct: 403.8,
    aovPct: -4.5,
    profitPerOrderPct: -6.3,
    monthlyProfitPct: 372.2,
    freeShippingPP: 1.8,
  },
  costs: {
    shippingCostMonthly: 1289,
    subsidyZoneOrdersBefore: 3003,
    subsidyZoneOrdersAfter: 6153,
    subsidyZoneFreeRateBefore: 31.3, // Free shipping % in 199-449 zone BEFORE
    subsidyZoneFreeRateAfter: 37.2,  // Free shipping % in 199-449 zone AFTER
    incrementalFreeRate: 5.9,        // = After - Before
    incrementalFreeOrders: 364,
  },
  value: {
    monthlyProfitLift: 42.49,
    totalMonthlyUplift: 198193,
    netMonthlyValue: 196905,
  },
};

// Fresh Customers (from existing analysis - period comparison)
const FRESH = {
  conversionWindow: 60,

  // Before period (Jan 2023 - Mar 2025)
  beforeLabel: "Jan 2023 - Mar 2025",
  beforeNewCustomers: 782605,
  beforeConverted: 63113,
  beforeRate: 8.06,
  beforeAvgDays: 19.98,
  beforeMedianDays: 14,

  // After period (Apr 2025 - Jan 2026)
  afterLabel: "Apr 2025 - Jan 2026",
  afterNewCustomers: 340259,
  afterConverted: 24533,
  afterRate: 7.21,
  afterAvgDays: 19.98,
  afterMedianDays: 13,

  // Impact
  changePP: -0.85,
  monthlyNewCustomers: 34026,
  extraConversions: -289,
  profitPerConversion: 197,
  monthlyValue: -57005,
};

// ============================================================================
// SHIPPING TRENDLINE DATA (from shipping_trendline_validation.py)
// Source: SHIPPING_GROSS_AMOUNT_DKK from PowerBI (already converted to DKK)
// ============================================================================
const SHIPPING_TRENDLINE_DATA = [
  { month: "2023-01", best: 18.10, medium: 22.36, control: 21.88, bestFree: 41.7, mediumFree: 40.5, controlFree: 41.0 },
  { month: "2023-02", best: 20.19, medium: 22.28, control: 22.27, bestFree: 41.0, mediumFree: 33.7, controlFree: 40.2 },
  { month: "2023-03", best: 18.90, medium: 20.42, control: 19.70, bestFree: 46.8, mediumFree: 40.2, controlFree: 46.1 },
  { month: "2023-04", best: 20.29, medium: 20.56, control: 21.41, bestFree: 42.6, mediumFree: 41.4, controlFree: 39.6 },
  { month: "2023-05", best: 24.09, medium: 23.60, control: 22.57, bestFree: 38.3, mediumFree: 32.7, controlFree: 37.6 },
  { month: "2023-06", best: 22.53, medium: 22.18, control: 21.79, bestFree: 41.0, mediumFree: 40.8, controlFree: 39.9 },
  { month: "2023-07", best: 22.17, medium: 21.63, control: 22.76, bestFree: 38.6, mediumFree: 40.0, controlFree: 38.1 },
  { month: "2023-08", best: 22.38, medium: 18.61, control: 23.14, bestFree: 38.5, mediumFree: 45.4, controlFree: 36.3 },
  { month: "2023-09", best: 22.29, medium: 22.03, control: 22.89, bestFree: 39.1, mediumFree: 36.6, controlFree: 37.9 },
  { month: "2023-10", best: 18.22, medium: 15.83, control: 19.18, bestFree: 44.3, mediumFree: 43.8, controlFree: 42.0 },
  { month: "2023-11", best: 20.15, medium: 19.35, control: 20.51, bestFree: 37.0, mediumFree: 36.9, controlFree: 34.7 },
  { month: "2023-12", best: 23.03, medium: 27.54, control: 22.27, bestFree: 34.2, mediumFree: 30.1, controlFree: 33.9 },
  { month: "2024-01", best: 22.75, medium: 24.13, control: 22.71, bestFree: 31.7, mediumFree: 33.3, controlFree: 33.2 },
  { month: "2024-02", best: 21.05, medium: 23.77, control: 22.71, bestFree: 36.5, mediumFree: 34.3, controlFree: 32.5 },
  { month: "2024-03", best: 21.06, medium: 17.32, control: 21.77, bestFree: 37.6, mediumFree: 39.1, controlFree: 34.3 },
  { month: "2024-04", best: 23.04, medium: 21.80, control: 21.88, bestFree: 36.0, mediumFree: 36.2, controlFree: 36.9 },
  { month: "2024-05", best: 22.68, medium: 21.82, control: 21.92, bestFree: 39.0, mediumFree: 36.2, controlFree: 38.6 },
  { month: "2024-06", best: 22.94, medium: 20.72, control: 23.82, bestFree: 37.2, mediumFree: 42.1, controlFree: 35.0 },
  { month: "2024-07", best: 23.37, medium: 20.67, control: 23.04, bestFree: 34.2, mediumFree: 39.9, controlFree: 35.7 },
  { month: "2024-08", best: 23.40, medium: 25.44, control: 24.24, bestFree: 35.5, mediumFree: 27.0, controlFree: 32.8 },
  { month: "2024-09", best: 22.35, medium: 21.32, control: 23.66, bestFree: 37.3, mediumFree: 36.9, controlFree: 34.4 },
  { month: "2024-10", best: 24.60, medium: 21.51, control: 23.51, bestFree: 32.8, mediumFree: 34.3, controlFree: 34.1 },
  { month: "2024-11", best: 22.28, medium: 23.77, control: 22.53, bestFree: 35.5, mediumFree: 33.5, controlFree: 34.2 },
  { month: "2024-12", best: 23.44, medium: 22.92, control: 23.13, bestFree: 30.6, mediumFree: 32.7, controlFree: 31.5 },
  { month: "2025-01", best: 25.70, medium: 24.66, control: 25.35, bestFree: 26.8, mediumFree: 26.7, controlFree: 28.0 },
  { month: "2025-02", best: 23.30, medium: 21.89, control: 21.95, bestFree: 37.2, mediumFree: 40.8, controlFree: 38.6 },
  { month: "2025-03", best: 25.06, medium: 24.24, control: 25.28, bestFree: 34.8, mediumFree: 33.4, controlFree: 32.6 },
  { month: "2025-04", best: 25.98, medium: 26.43, control: 26.80, bestFree: 29.9, mediumFree: 29.7, controlFree: 29.5 }, // CLUB LAUNCH
  { month: "2025-05", best: 20.71, medium: 22.16, control: 22.97, bestFree: 41.7, mediumFree: 38.2, controlFree: 37.7 },
  { month: "2025-06", best: 23.03, medium: 23.65, control: 24.85, bestFree: 36.5, mediumFree: 34.0, controlFree: 32.5 },
  { month: "2025-07", best: 23.17, medium: 20.34, control: 23.86, bestFree: 35.3, mediumFree: 38.4, controlFree: 34.6 },
  { month: "2025-08", best: 22.38, medium: 23.12, control: 24.04, bestFree: 36.0, mediumFree: 35.4, controlFree: 33.9 },
  { month: "2025-09", best: 22.65, medium: 21.51, control: 24.21, bestFree: 37.5, mediumFree: 38.3, controlFree: 34.1 },
  { month: "2025-10", best: 24.11, medium: 22.59, control: 24.32, bestFree: 35.5, mediumFree: 37.2, controlFree: 34.7 },
  { month: "2025-11", best: 18.86, medium: 19.35, control: 22.09, bestFree: 43.4, mediumFree: 44.0, controlFree: 36.9 },
  { month: "2025-12", best: 21.16, medium: 21.44, control: 23.19, bestFree: 37.5, mediumFree: 37.1, controlFree: 34.3 },
  { month: "2026-01", best: 22.00, medium: 22.07, control: 23.46, bestFree: 38.5, mediumFree: 38.6, controlFree: 36.0 },
  { month: "2026-02", best: 21.38, medium: 20.88, control: 24.03, bestFree: 38.0, mediumFree: 38.9, controlFree: 33.9 },
];

// Summary stats for the trendline
const SHIPPING_SUMMARY = {
  best: {
    beforeAvgShipping: 22.20,
    afterAvgShipping: 22.31,
    shippingChange: 0.11,
    beforeFreeShipPct: 37.3,
    afterFreeShipPct: 37.3,
    freeShipChangePP: 0.0,
  },
  medium: {
    beforeAvgShipping: 21.94,
    afterAvgShipping: 22.14,
    shippingChange: 0.20,
    beforeFreeShipPct: 36.6,
    afterFreeShipPct: 37.2,
    freeShipChangePP: 0.6,
  },
  control: {
    beforeAvgShipping: 22.51,
    afterAvgShipping: 23.98,
    shippingChange: 1.47,
    beforeFreeShipPct: 36.3,
    afterFreeShipPct: 34.4,
    freeShipChangePP: -1.9,
  },
};

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
      avgOrders: 3.20, avgAOV: 446, avgProfit: 218,
      clubOrders: 13343, nonClubOrders: 1342, clubOrdersPct: 90.9,
      cbUsed: 4844, cbRate: 36.3,
      color: "green"
    },
    {
      name: "Medium Customers",
      count: 4664, pct: 2.3,
      description: "1+ before, 2+ orders & 60+ days after",
      avgOrders: 2.73, avgAOV: 436, avgProfit: 216,
      clubOrders: 10925, nonClubOrders: 1782, clubOrdersPct: 86.0,
      cbUsed: 3798, cbRate: 34.8,
      color: "teal"
    },
    {
      name: "New Active",
      count: 12000, pct: 6.0,
      description: "No orders before, 2+ orders & 60+ days after",
      avgOrders: 2.66, avgAOV: 455, avgProfit: 226,
      clubOrders: 24561, nonClubOrders: 7381, clubOrdersPct: 76.9,
      cbUsed: 9573, cbRate: 39.0,
      color: "blue"
    },
    {
      name: "New Single-Order",
      count: 114585, pct: 56.9,
      description: "No orders before, only 1 Club order after",
      avgOrders: 1.00, avgAOV: 513, avgProfit: 260,
      clubOrders: 114585, nonClubOrders: 0, clubOrdersPct: 100.0,
      cbUsed: 28322, cbRate: 24.7,
      color: "red"
    },
    {
      name: "Lapsed Returned",
      count: 36232, pct: 18.0,
      description: "Had orders before, only 1 Club order after",
      avgOrders: 1.00, avgAOV: 453, avgProfit: 229,
      clubOrders: 36232, nonClubOrders: 0, clubOrdersPct: 100.0,
      cbUsed: 8411, cbRate: 23.2,
      color: "amber"
    },
    {
      name: "Inactive/Short Span",
      count: 29407, pct: 14.6,
      description: "2+ orders but < 60 days span",
      avgOrders: 2.18, avgAOV: 463, avgProfit: 229,
      clubOrders: 49631, nonClubOrders: 14487, clubOrdersPct: 77.4,
      cbUsed: 19283, cbRate: 38.9,
      color: "zinc"
    },
  ],
};

// OLD metrics for comparison (from CORE_METRICS / Executive Summary)
const OLD_BEST = {
  sampleSize: 5101,
  beforeFrequency: 0.224,
  afterFrequency: 0.334,
  frequencyChange: 48.8,
  beforeAOV: 466.02,
  afterAOV: 433.47,
  aovChange: -7.0,
  beforeProfitPerOrder: 225.80,
  afterProfitPerOrder: 209.50,
  profitPerOrderChange: -7.2,
  monthlyProfitLift: 19.29,
};

const OLD_MEDIUM = {
  sampleSize: 10732,
  beforeFrequency: 0.135,
  afterFrequency: 0.291,
  frequencyChange: 116.0,
  beforeAOV: 455.86,
  afterAOV: 422.93,
  aovChange: -7.2,
  beforeProfitPerOrder: 223.80,
  afterProfitPerOrder: 205.70,
  profitPerOrderChange: -8.1,
  monthlyProfitLift: 29.68,
};

export function CeoQaTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-amber-600 to-amber-800 text-white border-0">
        <CardContent className="py-6 px-6">
          <div className="text-center space-y-3">
            <Badge className="bg-white/20 text-white border-0 text-sm px-4 py-1">
              UPDATED METHODOLOGY
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold">
              Segment-Isolated P&L Analysis
            </h1>
            <p className="text-amber-100 max-w-2xl mx-auto text-sm">
              New approach: Calculate ALL metrics (shipping, cashback, profit) for each segment in isolation.
              Addresses CEO questions about cost attribution and provides stable, defensible numbers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* METHODOLOGY CHANGES SECTION                                        */}
      {/* ================================================================== */}
      <Card className="border-2 border-red-400">
        <CardHeader className="bg-red-50 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg text-red-700">Key Methodology Changes</CardTitle>
          </div>
          <CardDescription>
            Why numbers differ from the current Executive Summary
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Change 1: Club Members Only */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Sample Filter: Who Are We Actually Measuring?</p>

                {/* Detailed explanation */}
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-2">The Problem with the Old Approach:</p>
                  <p className="text-xs text-amber-700">
                    The Executive Summary defined &quot;Best Customers&quot; as: <em>&quot;Customers with 2+ orders and 60+ days span in BOTH before and after periods&quot;</em>.
                    This found {formatNumber(OLD_BEST.sampleSize)} customers. <strong>But not all of these are Club members!</strong>
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    Some customers simply happened to be active in both periods without ever joining Club.
                    We were mixing Club members with non-Club customers, which makes it impossible to attribute
                    changes specifically to the Club program.
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <p className="text-xs text-muted-foreground mb-1">OLD (Executive Summary)</p>
                    <p className="font-medium">ANY customer with activity</p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>• 2+ orders before April 2025</li>
                      <li>• 2+ orders after April 2025</li>
                      <li>• 60+ days span in both periods</li>
                      <li className="text-red-600">• Club membership NOT required</li>
                    </ul>
                    <p className="text-xs font-mono mt-2">
                      Best: {formatNumber(OLD_BEST.sampleSize)} | Medium: {formatNumber(OLD_MEDIUM.sampleSize)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300">
                    <p className="text-xs text-green-600 mb-1">NEW (Segment-Isolated)</p>
                    <p className="font-medium text-green-700">Only ACTUAL Club members</p>
                    <ul className="text-xs text-green-700 mt-2 space-y-1">
                      <li>• 2+ orders before April 2025</li>
                      <li>• 2+ orders after April 2025</li>
                      <li>• 60+ days span in both periods</li>
                      <li className="font-bold">• MUST have Club order after launch</li>
                    </ul>
                    <p className="text-xs font-mono mt-2 text-green-700">
                      Best: {formatNumber(NEW_BEST.sampleSize)} | Medium: {formatNumber(NEW_MEDIUM.sampleSize)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-xs">
                    <strong>The difference:</strong> {formatNumber(OLD_BEST.sampleSize - NEW_BEST.sampleSize)} customers in the old &quot;Best&quot; sample
                    were active but <em>never joined Club</em>. They were included in the old analysis but shouldn&apos;t have been,
                    because we&apos;re trying to measure the impact of the Club program on Club members.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Change 2: Segment-Specific Costs */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Cost Attribution: Segment-Specific</p>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <p className="text-xs text-muted-foreground mb-1">OLD</p>
                    <p>Total costs (81.5K shipping) allocated broadly</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confused: &quot;Where does 81.5K show up?&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded">
                    <p className="text-xs text-red-600 mb-1">NEW</p>
                    <p>Each segment has its own shipping cost</p>
                    <p className="text-xs text-red-600 mt-1">
                      Best: {formatNumber(NEW_BEST.costs.shippingCostMonthly)} | Medium: {formatNumber(NEW_MEDIUM.costs.shippingCostMonthly)} DKK/mo
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Why:</strong> Best/Medium customers have high AOV (~450 DKK), so most orders are above the 449 DKK threshold.
                  The 81.5K shipping subsidy comes mostly from OTHER Club members with lower order values.
                </p>
              </div>
            </div>
          </div>

          {/* Change 3: Different Sample = Different Metrics */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Why AOV and Profit/Order Numbers Are Different</p>

                {/* Explanation */}
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-2">Understanding the Difference:</p>
                  <p className="text-xs text-amber-700">
                    We&apos;re now looking at a <strong>different group of people</strong>. The OLD sample included
                    {formatNumber(OLD_BEST.sampleSize - NEW_BEST.sampleSize)} non-Club customers who were active but never joined Club.
                    When we remove them and look ONLY at actual Club members, the metrics change because:
                  </p>
                  <ul className="text-xs text-amber-700 mt-2 space-y-1">
                    <li>• <strong>Club members spend more</strong> - People who join Club tend to be higher-value customers to begin with</li>
                    <li>• <strong>Higher AOV = Higher Profit</strong> - Bigger orders generate more profit per order</li>
                    <li>• <strong>Different frequency patterns</strong> - Club members ordered less frequently before joining (0.179 vs 0.224)</li>
                    <li>• <strong>Bigger frequency lift</strong> - Club members responded MORE to the program (+62% vs +49%)</li>
                  </ul>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-zinc-100 dark:bg-zinc-800">
                        <th className="py-2 text-left">Metric (Best Customers)</th>
                        <th className="py-2 text-right">OLD Before<br/><span className="font-normal text-muted-foreground">(mixed sample)</span></th>
                        <th className="py-2 text-right">NEW Before<br/><span className="font-normal text-muted-foreground">(Club only)</span></th>
                        <th className="py-2 text-right">Difference</th>
                        <th className="py-2 text-left pl-3">What This Means</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">AOV (Before)</td>
                        <td className="py-2 text-right font-mono">{OLD_BEST.beforeAOV} DKK</td>
                        <td className="py-2 text-right font-mono">{NEW_BEST.before.aov} DKK</td>
                        <td className="py-2 text-right font-mono text-green-600">+{(NEW_BEST.before.aov - OLD_BEST.beforeAOV).toFixed(0)} DKK</td>
                        <td className="py-2 pl-3 text-xs text-muted-foreground">Club members were already high-value customers before joining</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Profit/Order (Before)</td>
                        <td className="py-2 text-right font-mono">{OLD_BEST.beforeProfitPerOrder} DKK</td>
                        <td className="py-2 text-right font-mono">{NEW_BEST.before.profitPerOrder} DKK</td>
                        <td className="py-2 text-right font-mono text-green-600">+{(NEW_BEST.before.profitPerOrder - OLD_BEST.beforeProfitPerOrder).toFixed(0)} DKK</td>
                        <td className="py-2 pl-3 text-xs text-muted-foreground">Higher AOV = more profit per order</td>
                      </tr>
                      <tr className="border-b bg-blue-50/50 dark:bg-blue-950/20">
                        <td className="py-2 font-medium">Frequency (Before)</td>
                        <td className="py-2 text-right font-mono">{OLD_BEST.beforeFrequency} orders/mo</td>
                        <td className="py-2 text-right font-mono">{NEW_BEST.before.frequency} orders/mo</td>
                        <td className="py-2 text-right font-mono text-red-600">{(NEW_BEST.before.frequency - OLD_BEST.beforeFrequency).toFixed(3)}</td>
                        <td className="py-2 pl-3 text-xs text-muted-foreground">Club members ordered LESS frequently before joining Club</td>
                      </tr>
                      <tr className="bg-green-50/50 dark:bg-green-950/20">
                        <td className="py-2 font-medium">Frequency Change</td>
                        <td className="py-2 text-right font-mono">+{OLD_BEST.frequencyChange}%</td>
                        <td className="py-2 text-right font-mono">+{NEW_BEST.changes.frequencyPct}%</td>
                        <td className="py-2 text-right font-mono text-green-600 font-bold">+{(NEW_BEST.changes.frequencyPct - OLD_BEST.frequencyChange).toFixed(1)}pp</td>
                        <td className="py-2 pl-3 text-xs text-green-700 font-medium">Club members responded MORE to the program!</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                  <p className="text-xs text-green-700">
                    <strong>Key Insight:</strong> By focusing only on actual Club members, we see they had LOWER frequency before joining (0.179 vs 0.224)
                    but showed a BIGGER increase after (+62% vs +49%). This suggests the Club program is more effective at
                    activating these customers than the mixed sample suggested.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* CRITICAL: CLUB MEMBER BREAKDOWN                                    */}
      {/* ================================================================== */}
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-red-50 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg text-red-700">Critical: Where Are the 201K Club Members?</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            The Best + Medium segments only cover 4.6% of Club members. What about the other 95.4%?
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Definition Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 text-xs">
            <p className="font-medium text-blue-700 mb-1">Using Simple Definition (matches P&L segments)</p>
            <p className="text-blue-600">
              Club Members (customerGroupKey = &apos;club&apos;): <strong>{formatNumber(CLUB_MEMBER_BREAKDOWN.total)}</strong> members |
              Includes distinction between <strong>Club Orders</strong> (placed AS Club member) vs <strong>Non-Club Orders</strong> (before joining)
            </p>
          </div>

          {/* Summary Alert */}
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border-2 border-red-400">
            <p className="font-bold text-red-700 mb-2">The Uncomfortable Truth</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded">
                <p className="text-xs text-muted-foreground">Verified Club Members</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.total)}</p>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded">
                <p className="text-xs text-muted-foreground">In Best + Medium P&L</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].count + CLUB_MEMBER_BREAKDOWN.categories[1].count)}</p>
                <p className="text-xs text-green-600">{((CLUB_MEMBER_BREAKDOWN.categories[0].count + CLUB_MEMBER_BREAKDOWN.categories[1].count) / CLUB_MEMBER_BREAKDOWN.total * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded">
                <p className="text-xs text-muted-foreground">NOT in P&L Analysis</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.total - CLUB_MEMBER_BREAKDOWN.categories[0].count - CLUB_MEMBER_BREAKDOWN.categories[1].count)}</p>
                <p className="text-xs text-red-600">{((CLUB_MEMBER_BREAKDOWN.total - CLUB_MEMBER_BREAKDOWN.categories[0].count - CLUB_MEMBER_BREAKDOWN.categories[1].count) / CLUB_MEMBER_BREAKDOWN.total * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Compact Category Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="p-2 text-left font-medium">Category</th>
                  <th className="p-2 text-right font-medium">Members</th>
                  <th className="p-2 text-right font-medium">%</th>
                  <th className="p-2 text-right font-medium">Club Orders</th>
                  <th className="p-2 text-right font-medium">Non-Club</th>
                  <th className="p-2 text-left font-medium">Order Flow (Before → After Club Launch)</th>
                </tr>
              </thead>
              <tbody>
                {/* Best */}
                <tr className="border-b border-green-200 bg-green-50 dark:bg-green-900/20">
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="font-medium text-green-700">Best</span>
                      <Badge className="bg-green-600 text-white text-[8px] px-1">P&L</Badge>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-green-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].count)}</td>
                  <td className="p-2 text-right text-green-600">{CLUB_MEMBER_BREAKDOWN.categories[0].pct}%</td>
                  <td className="p-2 text-right font-mono text-green-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].clubOrders)}</td>
                  <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].nonClubOrders)}</td>
                  <td className="p-2 text-[10px]">
                    <span className="text-zinc-500">2+ non-Club</span> → <span className="text-green-600 font-medium">2+ Club orders (60d+)</span>
                  </td>
                </tr>
                {/* Medium */}
                <tr className="border-b border-teal-200 bg-teal-50 dark:bg-teal-900/20">
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-teal-600" />
                      <span className="font-medium text-teal-700">Medium</span>
                      <Badge className="bg-teal-600 text-white text-[8px] px-1">P&L</Badge>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-teal-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[1].count)}</td>
                  <td className="p-2 text-right text-teal-600">{CLUB_MEMBER_BREAKDOWN.categories[1].pct}%</td>
                  <td className="p-2 text-right font-mono text-teal-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[1].clubOrders)}</td>
                  <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[1].nonClubOrders)}</td>
                  <td className="p-2 text-[10px]">
                    <span className="text-zinc-500">1+ non-Club</span> → <span className="text-teal-600 font-medium">2+ Club orders (60d+)</span>
                  </td>
                </tr>
                {/* New Active */}
                <tr className="border-b border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      <span className="font-medium text-blue-700">New Active</span>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-blue-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[2].count)}</td>
                  <td className="p-2 text-right text-blue-600">{CLUB_MEMBER_BREAKDOWN.categories[2].pct}%</td>
                  <td className="p-2 text-right font-mono text-blue-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[2].clubOrders)}</td>
                  <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[2].nonClubOrders)}</td>
                  <td className="p-2 text-[10px]">
                    <span className="text-zinc-400">No orders</span> → <span className="text-blue-600 font-medium">2+ Club orders (60d+)</span>
                    <span className="text-zinc-400 ml-1">+ some non-Club</span>
                  </td>
                </tr>
                {/* New Single - HIGHLIGHT */}
                <tr className="border-b-2 border-red-400 bg-red-100 dark:bg-red-900/30">
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-600" />
                      <span className="font-bold text-red-700">New Single-Order</span>
                      <Badge className="bg-red-600 text-white text-[8px] px-1">!</Badge>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-red-600 text-sm">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].count)}</td>
                  <td className="p-2 text-right font-bold text-red-600">{CLUB_MEMBER_BREAKDOWN.categories[3].pct}%</td>
                  <td className="p-2 text-right font-mono text-red-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].clubOrders)}</td>
                  <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].nonClubOrders)}</td>
                  <td className="p-2 text-[10px]">
                    <span className="text-zinc-400">No orders</span> → <span className="text-red-600 font-bold">1 Club order only</span>
                    <span className="text-red-500 ml-1">(never returned)</span>
                  </td>
                </tr>
                {/* Lapsed Returned */}
                <tr className="border-b border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span className="font-medium text-amber-700">Lapsed Returned</span>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-amber-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[4].count)}</td>
                  <td className="p-2 text-right text-amber-600">{CLUB_MEMBER_BREAKDOWN.categories[4].pct}%</td>
                  <td className="p-2 text-right font-mono text-amber-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[4].clubOrders)}</td>
                  <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[4].nonClubOrders)}</td>
                  <td className="p-2 text-[10px]">
                    <span className="text-zinc-500">1+ non-Club</span> → <span className="text-amber-600 font-medium">1 Club order only</span>
                    <span className="text-amber-500 ml-1">(didn&apos;t stick)</span>
                  </td>
                </tr>
                {/* Inactive */}
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3 text-zinc-500" />
                      <span className="font-medium text-zinc-600">Inactive/Short</span>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-zinc-600">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[5].count)}</td>
                  <td className="p-2 text-right text-zinc-600">{CLUB_MEMBER_BREAKDOWN.categories[5].pct}%</td>
                  <td className="p-2 text-right font-mono">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[5].clubOrders)}</td>
                  <td className="p-2 text-right font-mono text-zinc-500">{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[5].nonClubOrders)}</td>
                  <td className="p-2 text-[10px] text-muted-foreground">
                    Mixed → <span className="text-zinc-600">2+ Club orders but &lt;60 days span</span>
                  </td>
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

          {/* Key Insight Box */}
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded border-2 border-red-400 text-sm">
            <p className="text-red-700">
              <strong>Key Issue:</strong> {CLUB_MEMBER_BREAKDOWN.categories[3].pct}% of Club members ({formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].count)}) placed ONE Club order and never returned.
              They got Club benefits (free shipping at 199 DKK) but generated no repeat business.
            </p>
          </div>

          {/* Implications */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300">
              <p className="font-medium text-amber-700 mb-2">What This Means for the P&L</p>
              <ul className="text-xs text-amber-600 space-y-1">
                <li>• The +19.62 DKK/mo value from Best applies to only {formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].count)} members ({CLUB_MEMBER_BREAKDOWN.categories[0].pct}%)</li>
                <li>• The +42.21 DKK/mo value from Medium applies to only {formatNumber(CLUB_MEMBER_BREAKDOWN.categories[1].count)} members ({CLUB_MEMBER_BREAKDOWN.categories[1].pct}%)</li>
                <li>• <strong>{formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].count)}</strong> members ({CLUB_MEMBER_BREAKDOWN.categories[3].pct}%) placed ONE Club order and never returned</li>
                <li>• 100% of their orders ARE Club orders - they got Club benefits (free shipping threshold)</li>
                <li>• They earned cashback but <strong>never came back</strong> to use it</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300">
              <p className="font-medium text-blue-700 mb-2">Additional Analysis Needed</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• What&apos;s the P&L for &quot;New Active&quot; ({formatNumber(CLUB_MEMBER_BREAKDOWN.categories[2].count)} members)?</li>
                <li>• What&apos;s the cost of {formatNumber(CLUB_MEMBER_BREAKDOWN.categories[3].count)} single-order members? (shipping + cashback given)</li>
                <li>• Can we convert single-order to repeat buyers?</li>
                <li>• What&apos;s the CAC (acquisition cost) for Club members?</li>
              </ul>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="p-4 bg-gradient-to-r from-red-100 to-amber-100 dark:from-red-900/30 dark:to-amber-900/30 rounded-lg border-2 border-red-400">
            <p className="font-bold text-red-700 mb-2">Bottom Line</p>
            <p className="text-sm text-red-600">
              The current P&L analysis shows positive results for Best/Medium customers, but these represent only <strong>{((CLUB_MEMBER_BREAKDOWN.categories[0].count + CLUB_MEMBER_BREAKDOWN.categories[1].count) / CLUB_MEMBER_BREAKDOWN.total * 100).toFixed(1)}% of verified Club members</strong> ({formatNumber(CLUB_MEMBER_BREAKDOWN.categories[0].count + CLUB_MEMBER_BREAKDOWN.categories[1].count)} of {formatNumber(CLUB_MEMBER_BREAKDOWN.total)}).
              The largest group ({CLUB_MEMBER_BREAKDOWN.categories[3].pct}%) are single-order buyers who received Club benefits without becoming repeat customers.
              A complete ROI assessment must include the cost of acquiring and subsidizing these non-returning members.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* DATA SOURCES SECTION                                               */}
      {/* ================================================================== */}
      <Card className="border-2 border-blue-400">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-700">Data Sources & Calculations</CardTitle>
          </div>
          <CardDescription>
            Exactly where each number comes from
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Order Data */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Order History Data</span>
            </div>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Source</span>
                <code className="text-blue-600">PowerBi - Order_history/*.csv</code>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Total Orders</span>
                <span className="font-mono">2,427,304 valid orders</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Date Range</span>
                <span className="font-mono">{ANALYSIS_PERIOD.beforeStart} to {ANALYSIS_PERIOD.afterEnd}</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Columns Used</span>
                <span className="text-muted-foreground">GROSS_AMOUNT_DKK, PROFIT_TRACKING_TOTAL_PROFIT_DKK, SHIPPING_GROSS_AMOUNT_DKK, PRODUCT_QUANTITY</span>
              </div>
            </div>
          </div>

          {/* Club Identification */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Club Member Identification</span>
            </div>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Source</span>
                <code className="text-blue-600">PostgreSQL: ecom_powers.order</code>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Query</span>
                <code className="text-muted-foreground">WHERE customer_group_key = &apos;club&apos;</code>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Club Orders Found</span>
                <span className="font-mono">250,417 orders</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Club Members</span>
                <span className="font-mono">201,477 unique customers</span>
              </div>
            </div>
          </div>

          {/* Cashback Data */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Cashback Data</span>
            </div>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Source</span>
                <code className="text-blue-600">PostgreSQL: ecom_powers.customer_cashback</code>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Total Records</span>
                <span className="font-mono">74,248 cashback events</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Redemptions Found</span>
                <span className="font-mono">4,770 orders with CB redeemed</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span>Calculation</span>
                <span className="text-muted-foreground">balance_change = current_balance - previous_balance (per customer)</span>
              </div>
              <div className="flex justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                <span>Note</span>
                <span className="text-amber-700">Using MEDIAN (17 DKK typical), not mean (pulled up by outliers to ~2000 DKK)</span>
              </div>
            </div>
          </div>

          {/* Calculation Formulas */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Key Formulas</span>
            </div>
            <div className="grid gap-2 text-xs font-mono">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span className="text-muted-foreground">Frequency =</span> Orders / (Customers × Calendar_Months)
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span className="text-muted-foreground">Monthly_Profit =</span> Frequency × Profit_Per_Order
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span className="text-muted-foreground">Shipping_Cost =</span> Incremental_Free_Orders × 39 DKK
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <span className="text-muted-foreground">Incremental_Free =</span> (After_Free_Rate - Before_Free_Rate) × Subsidy_Zone_Orders
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <span className="text-green-700">Net_Value =</span> Monthly_Profit_Lift × Customers - Shipping_Cost
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* NEW SEGMENT RESULTS                                                */}
      {/* ================================================================== */}
      <Card className="border-2 border-green-400">
        <CardHeader className="bg-green-50 dark:bg-green-950/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg text-green-700">Segment-Isolated Results</CardTitle>
          </div>
          <CardDescription>
            Complete P&L for each segment with all requested metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* BEST CUSTOMERS */}
            <div className="border-2 border-green-400 rounded-lg overflow-hidden">
              <div className="bg-green-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Best Customers</h3>
                    <p className="text-green-100 text-sm">2+ orders, 60+ days in BOTH periods</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatNumber(NEW_BEST.sampleSize)}</p>
                    <p className="text-green-100 text-xs">Club members</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Metrics Table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Metric</th>
                      <th className="py-2 text-right">Before</th>
                      <th className="py-2 text-right">After</th>
                      <th className="py-2 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5">Items/Order (AOQ)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.itemsPerOrder}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.itemsPerOrder}</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">-0.09</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Shipping/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.shippingPerOrder}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.shippingPerOrder}</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">-0.24</td>
                    </tr>
                    <tr className="border-b bg-purple-50/50 dark:bg-purple-950/20">
                      <td className="py-1.5 text-purple-700">Free Shipping %</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.freeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.freeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono text-purple-600">+{NEW_BEST.changes.freeShippingPP}pp</td>
                    </tr>
                    <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                      <td className="py-1.5 text-green-700 font-medium">Frequency</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.frequency}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.frequency}</td>
                      <td className="py-1.5 text-right font-mono text-green-600 font-bold">+{NEW_BEST.changes.frequencyPct}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">CB Usage Rate</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.cbUsageRate}%</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.cbUsageRate}%</td>
                      <td className="py-1.5 text-right font-mono">+9.0pp</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Median CB/Order</td>
                      <td className="py-1.5 text-right font-mono">-</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.medianCbPerOrder} DKK</td>
                      <td className="py-1.5 text-right font-mono">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">AOV (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.aov}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.aov}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{NEW_BEST.changes.aovPct}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Profit/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.profitPerOrder}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.profitPerOrder}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{NEW_BEST.changes.profitPerOrderPct}%</td>
                    </tr>
                    <tr className="bg-green-100 dark:bg-green-900/30">
                      <td className="py-1.5 font-medium">Monthly Profit</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.before.monthlyProfit}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_BEST.after.monthlyProfit}</td>
                      <td className="py-1.5 text-right font-mono text-green-600 font-bold">+{NEW_BEST.changes.monthlyProfitPct}%</td>
                    </tr>
                  </tbody>
                </table>

                {/* Shipping Cost Calculation */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                  <p className="font-medium text-sm text-amber-800 mb-2">Shipping Cost Calculation (Subsidy Zone Only)</p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Note: These rates are for orders in the 199-449 DKK zone only, NOT the overall free shipping rate shown above.
                  </p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orders in subsidy zone (199-449 DKK):</span>
                      <span className="font-mono">{formatNumber(NEW_BEST.costs.subsidyZoneOrdersAfter)} orders</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free shipping rate in zone BEFORE:</span>
                      <span className="font-mono">{NEW_BEST.costs.subsidyZoneFreeRateBefore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free shipping rate in zone AFTER:</span>
                      <span className="font-mono">{NEW_BEST.costs.subsidyZoneFreeRateAfter}%</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Incremental free rate (Club benefit):</span>
                      <span className="font-mono font-medium">+{NEW_BEST.costs.incrementalFreeRate}pp</span>
                    </div>
                    <div className="border-t border-amber-200 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Incremental free orders:</span>
                        <span className="font-mono">{formatNumber(NEW_BEST.costs.subsidyZoneOrdersAfter)} × {NEW_BEST.costs.incrementalFreeRate}% = {NEW_BEST.costs.incrementalFreeOrders} orders</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">× Avg shipping fee:</span>
                        <span className="font-mono">× 39 DKK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">= Total shipping cost ({ANALYSIS_PERIOD.monthsAfter.toFixed(0)} mo):</span>
                        <span className="font-mono">{formatNumber(NEW_BEST.costs.incrementalFreeOrders * 39)} DKK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">÷ {formatNumber(NEW_BEST.sampleSize)} customers:</span>
                        <span className="font-mono font-medium text-amber-700">{((NEW_BEST.costs.incrementalFreeOrders * 39) / NEW_BEST.sampleSize).toFixed(2)} DKK/customer ({ANALYSIS_PERIOD.monthsAfter.toFixed(0)} mo)</span>
                      </div>
                      <div className="flex justify-between font-medium text-amber-800">
                        <span>Monthly shipping cost/customer:</span>
                        <span className="font-mono">{(NEW_BEST.costs.shippingCostMonthly / NEW_BEST.sampleSize).toFixed(2)} DKK/mo</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-Customer Value */}
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="font-medium text-sm text-green-700 mb-3">Monthly Value Per Customer</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Monthly Profit Lift:</span>
                      <span className="font-mono font-bold text-green-600">+{NEW_BEST.value.monthlyProfitLift.toFixed(2)} DKK</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Shipping Cost/Customer:</span>
                      <span className="font-mono text-amber-600">-{(NEW_BEST.costs.shippingCostMonthly / NEW_BEST.sampleSize).toFixed(2)} DKK</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium text-green-700">Net Value/Customer:</span>
                      <span className="font-mono font-bold text-green-600 text-lg">+{(NEW_BEST.value.monthlyProfitLift - NEW_BEST.costs.shippingCostMonthly / NEW_BEST.sampleSize).toFixed(2)} DKK/mo</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Note: Cashback is already reflected in profit figures (reduces revenue at redemption).
                  </p>
                </div>
              </div>
            </div>

            {/* MEDIUM CUSTOMERS */}
            <div className="border-2 border-teal-400 rounded-lg overflow-hidden">
              <div className="bg-teal-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Medium Customers</h3>
                    <p className="text-teal-100 text-sm">1+ before, 2+ orders & 60+ days after</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatNumber(NEW_MEDIUM.sampleSize)}</p>
                    <p className="text-teal-100 text-xs">Club members</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Metrics Table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Metric</th>
                      <th className="py-2 text-right">Before</th>
                      <th className="py-2 text-right">After</th>
                      <th className="py-2 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5">Items/Order (AOQ)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.itemsPerOrder}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.itemsPerOrder}</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">+0.01</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Shipping/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.shippingPerOrder}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.shippingPerOrder}</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">-0.33</td>
                    </tr>
                    <tr className="border-b bg-purple-50/50 dark:bg-purple-950/20">
                      <td className="py-1.5 text-purple-700">Free Shipping %</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.freeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.freeShippingPct}%</td>
                      <td className="py-1.5 text-right font-mono text-purple-600">+{NEW_MEDIUM.changes.freeShippingPP}pp</td>
                    </tr>
                    <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                      <td className="py-1.5 text-green-700 font-medium">Frequency</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.frequency}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.frequency}</td>
                      <td className="py-1.5 text-right font-mono text-green-600 font-bold">+{NEW_MEDIUM.changes.frequencyPct}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">CB Usage Rate</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.cbUsageRate}%</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.cbUsageRate}%</td>
                      <td className="py-1.5 text-right font-mono">+6.3pp</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Median CB/Order</td>
                      <td className="py-1.5 text-right font-mono">-</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.medianCbPerOrder} DKK</td>
                      <td className="py-1.5 text-right font-mono">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">AOV (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.aov}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.aov}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{NEW_MEDIUM.changes.aovPct}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Profit/Order (DKK)</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.profitPerOrder}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.profitPerOrder}</td>
                      <td className="py-1.5 text-right font-mono text-red-600">{NEW_MEDIUM.changes.profitPerOrderPct}%</td>
                    </tr>
                    <tr className="bg-teal-100 dark:bg-teal-900/30">
                      <td className="py-1.5 font-medium">Monthly Profit</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.before.monthlyProfit}</td>
                      <td className="py-1.5 text-right font-mono">{NEW_MEDIUM.after.monthlyProfit}</td>
                      <td className="py-1.5 text-right font-mono text-teal-600 font-bold">+{NEW_MEDIUM.changes.monthlyProfitPct}%</td>
                    </tr>
                  </tbody>
                </table>

                {/* Shipping Cost Calculation */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                  <p className="font-medium text-sm text-amber-800 mb-2">Shipping Cost Calculation (Subsidy Zone Only)</p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Note: These rates are for orders in the 199-449 DKK zone only, NOT the overall free shipping rate shown above.
                  </p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orders in subsidy zone (199-449 DKK):</span>
                      <span className="font-mono">{formatNumber(NEW_MEDIUM.costs.subsidyZoneOrdersAfter)} orders</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free shipping rate in zone BEFORE:</span>
                      <span className="font-mono">{NEW_MEDIUM.costs.subsidyZoneFreeRateBefore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free shipping rate in zone AFTER:</span>
                      <span className="font-mono">{NEW_MEDIUM.costs.subsidyZoneFreeRateAfter}%</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Incremental free rate (Club benefit):</span>
                      <span className="font-mono font-medium">+{NEW_MEDIUM.costs.incrementalFreeRate}pp</span>
                    </div>
                    <div className="border-t border-amber-200 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Incremental free orders:</span>
                        <span className="font-mono">{formatNumber(NEW_MEDIUM.costs.subsidyZoneOrdersAfter)} × {NEW_MEDIUM.costs.incrementalFreeRate}% = {NEW_MEDIUM.costs.incrementalFreeOrders} orders</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">× Avg shipping fee:</span>
                        <span className="font-mono">× 39 DKK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">= Total shipping cost ({ANALYSIS_PERIOD.monthsAfter.toFixed(0)} mo):</span>
                        <span className="font-mono">{formatNumber(NEW_MEDIUM.costs.incrementalFreeOrders * 39)} DKK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">÷ {formatNumber(NEW_MEDIUM.sampleSize)} customers:</span>
                        <span className="font-mono font-medium text-amber-700">{((NEW_MEDIUM.costs.incrementalFreeOrders * 39) / NEW_MEDIUM.sampleSize).toFixed(2)} DKK/customer ({ANALYSIS_PERIOD.monthsAfter.toFixed(0)} mo)</span>
                      </div>
                      <div className="flex justify-between font-medium text-amber-800">
                        <span>Monthly shipping cost/customer:</span>
                        <span className="font-mono">{(NEW_MEDIUM.costs.shippingCostMonthly / NEW_MEDIUM.sampleSize).toFixed(2)} DKK/mo</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-Customer Value */}
                <div className="p-4 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <p className="font-medium text-sm text-teal-700 mb-3">Monthly Value Per Customer</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-teal-700">Monthly Profit Lift:</span>
                      <span className="font-mono font-bold text-teal-600">+{NEW_MEDIUM.value.monthlyProfitLift.toFixed(2)} DKK</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Shipping Cost/Customer:</span>
                      <span className="font-mono text-amber-600">-{(NEW_MEDIUM.costs.shippingCostMonthly / NEW_MEDIUM.sampleSize).toFixed(2)} DKK</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium text-teal-700">Net Value/Customer:</span>
                      <span className="font-mono font-bold text-teal-600 text-lg">+{(NEW_MEDIUM.value.monthlyProfitLift - NEW_MEDIUM.costs.shippingCostMonthly / NEW_MEDIUM.sampleSize).toFixed(2)} DKK/mo</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Note: Cashback is already reflected in profit figures (reduces revenue at redemption).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fresh Customers - Executive Summary Style */}
          <div className="mt-6 border-2 border-amber-400 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-amber-500 text-white p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h3 className="font-bold text-lg">Fresh Customers</h3>
              </div>
              <p className="text-amber-100 text-sm mt-1">1st → 2nd order conversion (period comparison)</p>
            </div>

            <div className="p-4 space-y-4 bg-amber-50/30 dark:bg-amber-950/10">
              {/* ROW 1: Sample Definition */}
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-sm">Sample Definition</span>
                </div>
                <p className="text-sm font-medium">ALL customers placing their first-ever order</p>
                <p className="text-xs text-muted-foreground">Success = 2nd order within {FRESH.conversionWindow} days</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <span className="text-muted-foreground">Before Club</span>
                    <p className="font-mono font-bold text-[10px]">{FRESH.beforeLabel}</p>
                    <p className="text-[10px] text-muted-foreground">{formatNumber(FRESH.beforeNewCustomers)} new customers</p>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                    <span className="text-amber-700">After Club</span>
                    <p className="font-mono font-bold text-amber-700 text-[10px]">{FRESH.afterLabel}</p>
                    <p className="text-[10px] text-amber-600">{formatNumber(FRESH.afterNewCustomers)} new customers</p>
                  </div>
                </div>
              </div>

              {/* ROW 2: Metrics Table */}
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1 text-left font-medium">Metric</th>
                      <th className="py-1 text-right font-medium">Before</th>
                      <th className="py-1 text-right font-medium">After</th>
                      <th className="py-1 text-right font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1">New Customers</td>
                      <td className="py-1 text-right font-mono">{formatNumber(FRESH.beforeNewCustomers)}</td>
                      <td className="py-1 text-right font-mono">{formatNumber(FRESH.afterNewCustomers)}</td>
                      <td className="py-1 text-right font-mono">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1">Converted (60d)</td>
                      <td className="py-1 text-right font-mono">{formatNumber(FRESH.beforeConverted)}</td>
                      <td className="py-1 text-right font-mono">{formatNumber(FRESH.afterConverted)}</td>
                      <td className="py-1 text-right font-mono">-</td>
                    </tr>
                    <tr className="border-b bg-amber-50 dark:bg-amber-950/30">
                      <td className="py-1 font-medium">Conv. Rate</td>
                      <td className="py-1 text-right font-mono">{FRESH.beforeRate}%</td>
                      <td className="py-1 text-right font-mono">{FRESH.afterRate}%</td>
                      <td className="py-1 text-right font-mono font-bold text-amber-600">{FRESH.changePP}pp</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1">Avg Days to 2nd</td>
                      <td className="py-1 text-right font-mono">{FRESH.beforeAvgDays}</td>
                      <td className="py-1 text-right font-mono">{FRESH.afterAvgDays}</td>
                      <td className="py-1 text-right font-mono text-muted-foreground">0.00</td>
                    </tr>
                    <tr>
                      <td className="py-1">Median Days to 2nd</td>
                      <td className="py-1 text-right font-mono">{FRESH.beforeMedianDays}</td>
                      <td className="py-1 text-right font-mono">{FRESH.afterMedianDays}</td>
                      <td className="py-1 text-right font-mono text-green-600">-1</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2 p-1.5 bg-green-50/50 dark:bg-green-950/20 rounded text-[10px] text-green-600">
                  ✓ Speed unchanged: customers who convert still do so in ~14 days (median)
                </div>
              </div>

              {/* ROW 3: Impact Calculation */}
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-sm">Impact Calculation</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">① Rate Change</span>
                      <span className="font-mono text-amber-600">{FRESH.changePP} pp</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{FRESH.afterRate}% − {FRESH.beforeRate}% = {FRESH.changePP}pp</p>
                  </div>
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">② New Customers/mo</span>
                      <span className="font-mono">{formatNumber(FRESH.monthlyNewCustomers)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatNumber(FRESH.afterNewCustomers)} ÷ 10 months</p>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-200">
                    <div className="flex justify-between">
                      <span className="font-medium text-amber-700">③ Lost Conversions</span>
                      <span className="font-mono font-bold text-amber-600">{formatNumber(FRESH.extraConversions)}/mo</span>
                    </div>
                    <p className="text-[10px] text-amber-600 mt-0.5">{FRESH.changePP}% × {formatNumber(FRESH.monthlyNewCustomers)} = {formatNumber(FRESH.extraConversions)} fewer 2nd orders</p>
                  </div>
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">④ Profit per 2nd Order</span>
                      <span className="font-mono">{formatNumber(FRESH.profitPerConversion)} DKK</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Avg profit from 2nd orders (after period, {formatNumber(FRESH.afterConverted)} orders)</p>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-200">
                    <div className="flex justify-between">
                      <span className="font-medium text-amber-700">⑤ Monthly Value</span>
                      <span className="font-mono font-bold text-amber-600">{formatCurrency(FRESH.monthlyValue)}/mo</span>
                    </div>
                    <p className="text-[10px] text-amber-600 mt-0.5">{formatNumber(FRESH.extraConversions)} lost × {formatNumber(FRESH.profitPerConversion)} DKK profit</p>
                  </div>
                </div>
              </div>

              {/* ROW 4: Result + Notes */}
              <div className="space-y-2">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 text-center">
                  <p className="text-xs text-amber-700">Est. Monthly Value</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(FRESH.monthlyValue)}</p>
                </div>
                <div className="p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded text-[10px] text-muted-foreground space-y-1">
                  <p><strong>Finding:</strong> 1st→2nd order rate {FRESH.changePP}pp change. Conversion speed unchanged.</p>
                  <p><strong>Limitation:</strong> Measures ALL customers (Club + Non-Club). May reflect market trends, not Club impact.</p>
                  <p><strong>Action:</strong> Monitor whether Club marketing drives overall repeat behavior. Consider isolating Club-only new customers.</p>
                </div>
              </div>
            </div>
          </div>

          {/* PER-CUSTOMER SUMMARY */}
          <div className="mt-6 p-6 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 rounded-lg border-2 border-green-500">
            <h3 className="font-bold text-lg text-center mb-4">Summary: Net Monthly Value Per Customer</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Best Customers</p>
                <p className="text-xs text-muted-foreground">({formatNumber(NEW_BEST.sampleSize)} members)</p>
                <p className="text-2xl font-bold text-green-600 mt-2">+{(NEW_BEST.value.monthlyProfitLift - NEW_BEST.costs.shippingCostMonthly / NEW_BEST.sampleSize).toFixed(2)} DKK</p>
                <p className="text-xs text-muted-foreground">per customer/month</p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Medium Customers</p>
                <p className="text-xs text-muted-foreground">({formatNumber(NEW_MEDIUM.sampleSize)} members)</p>
                <p className="text-2xl font-bold text-teal-600 mt-2">+{(NEW_MEDIUM.value.monthlyProfitLift - NEW_MEDIUM.costs.shippingCostMonthly / NEW_MEDIUM.sampleSize).toFixed(2)} DKK</p>
                <p className="text-xs text-muted-foreground">per customer/month</p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Fresh Customers</p>
                <p className="text-xs text-muted-foreground">(conversion rate)</p>
                <p className="text-2xl font-bold text-amber-600 mt-2">{FRESH.changePP}pp</p>
                <p className="text-xs text-muted-foreground">rate change</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/50 dark:bg-zinc-900/50 rounded text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Finding:</strong> Best and Medium Club members generate +19.62 to +42.21 DKK net value per customer per month.
                Fresh customer conversion shows a slight decline (-0.85pp) that may reflect market trends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* FINDINGS SUMMARY                                                   */}
      {/* ================================================================== */}
      <Card className="border-2 border-zinc-400">
        <CardHeader className="bg-zinc-100 dark:bg-zinc-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Key Findings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Finding 1 */}
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">Frequency Drives Value</span>
              </div>
              <p className="text-sm">
                Best: +{NEW_BEST.changes.frequencyPct}% frequency, Medium: +{NEW_MEDIUM.changes.frequencyPct}% frequency.
                Volume increase outweighs lower profit per order.
              </p>
            </div>

            {/* Finding 2 */}
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">Shipping Costs Are Minimal</span>
              </div>
              <p className="text-sm">
                Best+Medium: only {formatCurrency(NEW_BEST.costs.shippingCostMonthly + NEW_MEDIUM.costs.shippingCostMonthly)}/month.
                Most of the 81.5K total shipping subsidy comes from other Club members with lower AOV.
              </p>
            </div>

            {/* Finding 3 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700">Cashback Already in Profit</span>
              </div>
              <p className="text-sm">
                CB usage: Best {NEW_BEST.after.cbUsageRate}%, Medium {NEW_MEDIUM.after.cbUsageRate}%.
                Median ~70 DKK per redemption. Already reflected in profit figures.
              </p>
            </div>

            {/* Finding 4 */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-700">Fresh Customers Neutral/Negative</span>
              </div>
              <p className="text-sm">
                Conversion rate dropped {FRESH.changePP}pp. May reflect market trends, not Club impact.
                Consider external factors before attributing to Club program.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SHIPPING TRENDLINE VALIDATION                                      */}
      {/* ================================================================== */}
      <Card className="border-2 border-indigo-400">
        <CardHeader className="bg-indigo-50 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg text-indigo-700">Shipping Metrics Validation (Trendlines)</CardTitle>
          </div>
          <CardDescription>
            Monthly trends from Jan 2023 to Feb 2026 - validating shipping impact claims
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Data Source Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 text-xs">
            <p className="font-medium text-blue-700 mb-1">Data Source</p>
            <p className="text-blue-600">
              Using <code className="bg-blue-100 px-1 rounded">SHIPPING_GROSS_AMOUNT_DKK</code> directly from PowerBI Order History.
              This field is already converted to DKK - no additional currency conversion applied.
            </p>
          </div>

          {/* Chart 1: Shipping Revenue Per Order */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Avg. Shipping Revenue Per Order (DKK)</h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SHIPPING_TRENDLINE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.slice(2, 7)}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    domain={[15, 30]}
                    tickFormatter={(value) => `${value} kr`}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(2)} DKK`, ""]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    x="2025-04"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: "Club Launch", position: "top", fontSize: 10, fill: "#ef4444" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="best"
                    name="Best Customers"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="medium"
                    name="Medium Customers"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="control"
                    name="Control Group"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Free Shipping % */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Free Shipping % Over Time</h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SHIPPING_TRENDLINE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.slice(2, 7)}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    domain={[25, 50]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, ""]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    x="2025-04"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: "Club Launch", position: "top", fontSize: 10, fill: "#ef4444" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bestFree"
                    name="Best Customers"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="mediumFree"
                    name="Medium Customers"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="controlFree"
                    name="Control Group"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Table */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Before vs After Club Launch Summary</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-zinc-100 dark:bg-zinc-800">
                    <th className="py-2 px-3 text-left">Segment</th>
                    <th className="py-2 px-3 text-right">Ship/Order Before</th>
                    <th className="py-2 px-3 text-right">Ship/Order After</th>
                    <th className="py-2 px-3 text-right">Change</th>
                    <th className="py-2 px-3 text-right">Free % Before</th>
                    <th className="py-2 px-3 text-right">Free % After</th>
                    <th className="py-2 px-3 text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium text-green-700">Best Customers</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.best.beforeAvgShipping} DKK</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.best.afterAvgShipping} DKK</td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">+{SHIPPING_SUMMARY.best.shippingChange.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.best.beforeFreeShipPct}%</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.best.afterFreeShipPct}%</td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">{SHIPPING_SUMMARY.best.freeShipChangePP.toFixed(1)}pp</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium text-teal-700">Medium Customers</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.medium.beforeAvgShipping} DKK</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.medium.afterAvgShipping} DKK</td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">+{SHIPPING_SUMMARY.medium.shippingChange.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.medium.beforeFreeShipPct}%</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.medium.afterFreeShipPct}%</td>
                    <td className="py-2 px-3 text-right font-mono text-teal-600">+{SHIPPING_SUMMARY.medium.freeShipChangePP.toFixed(1)}pp</td>
                  </tr>
                  <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                    <td className="py-2 px-3 font-medium text-indigo-700">Control Group</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.control.beforeAvgShipping} DKK</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.control.afterAvgShipping} DKK</td>
                    <td className="py-2 px-3 text-right font-mono text-red-600">+{SHIPPING_SUMMARY.control.shippingChange.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.control.beforeFreeShipPct}%</td>
                    <td className="py-2 px-3 text-right font-mono">{SHIPPING_SUMMARY.control.afterFreeShipPct}%</td>
                    <td className="py-2 px-3 text-right font-mono text-red-600">{SHIPPING_SUMMARY.control.freeShipChangePP.toFixed(1)}pp</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Control Group = All customers with orders both before AND after Club launch (82,728 customers)
            </p>
          </div>

          {/* Findings and Conclusions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Findings &amp; Conclusions
            </h4>

            {/* KEY OBSERVATION: The Shock at Launch */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 mb-4">
              <p className="font-bold text-red-700 text-sm mb-2">Key Observation: Visible Shock at Club Launch</p>
              <p className="text-xs text-red-600 mb-3">
                There IS a clear shock visible in the charts at April 2025:
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded">
                  <p className="font-medium text-red-700">April 2025 (Launch Month)</p>
                  <ul className="text-red-600 mt-1 space-y-0.5">
                    <li>• Shipping: ~27 DKK (peak)</li>
                    <li>• Free %: ~29% (trough)</li>
                  </ul>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-900 rounded">
                  <p className="font-medium text-green-700">May 2025 (Month After)</p>
                  <ul className="text-green-600 mt-1 space-y-0.5">
                    <li>• Shipping: ~21 DKK (drop of 6 DKK)</li>
                    <li>• Free %: ~38-42% (jump of +10pp)</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-red-700 mt-3 font-medium">
                This IS the Club effect showing immediately! But why doesn&apos;t it result in bigger delta when averaged?
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Finding 1 - WHY THE SHOCK DOESN'T PERSIST */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                <p className="font-medium text-amber-700 text-sm mb-2">1. The Shock Reverts to Normal</p>
                <p className="text-xs text-amber-600">
                  After the initial May 2025 shock, metrics <strong>return to historical levels</strong>:
                </p>
                <ul className="text-xs text-amber-600 mt-1 space-y-0.5">
                  <li>• Jun-Feb: Shipping 21-24 DKK (same as 2023-2024)</li>
                  <li>• Jun-Feb: Free % 34-44% (same as 2023-2024)</li>
                </ul>
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  The Club benefit shows in the first month but doesn&apos;t create a permanent shift in these segments.
                </p>
              </div>

              {/* Finding 2 - WHY IT AVERAGES OUT */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-700 text-sm mb-2">2. Why the Average Δ is Small</p>
                <p className="text-xs text-blue-600">
                  The May 2025 shock gets diluted when averaged:
                </p>
                <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                  <li>• 1 month of big change (May 2025)</li>
                  <li>• 10 months of normal variation (Jun 25 - Feb 26)</li>
                  <li>• Average = mostly normal + small shock effect</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2 font-medium">
                  One exceptional month divided by 11 = ~0.1-0.2 DKK average change.
                </p>
              </div>

              {/* Finding 3 - HIGH AOV EXPLANATION */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                <p className="font-medium text-green-700 text-sm mb-2">3. High AOV Customers Are Immune</p>
                <p className="text-xs text-green-600">
                  Best/Medium customers have AOV ~450 DKK, meaning:
                </p>
                <ul className="text-xs text-green-600 mt-1 space-y-0.5">
                  <li>• ~50% of orders are above 449 DKK (free regardless)</li>
                  <li>• Only ~47% fall in subsidy zone (199-449 DKK)</li>
                  <li>• Of those, many already got free shipping before</li>
                </ul>
                <p className="text-xs text-green-700 mt-2 font-medium">
                  The Club threshold drop (449→199) barely affects high-value customers.
                </p>
              </div>

              {/* Finding 4 - CONTROL GROUP */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200">
                <p className="font-medium text-indigo-700 text-sm mb-2">4. Control Group Confirms the Pattern</p>
                <p className="text-xs text-indigo-600">
                  The control group (all customers) shows similar shock + reversion:
                </p>
                <ul className="text-xs text-indigo-600 mt-1 space-y-0.5">
                  <li>• April: 27 DKK / 29% free</li>
                  <li>• May: 23 DKK / 38% free</li>
                  <li>• Then: back to 23-24 DKK / 33-37% free</li>
                </ul>
                <p className="text-xs text-indigo-700 mt-2 font-medium">
                  Even broader population shows shock absorbed quickly.
                </p>
              </div>
            </div>

            {/* Conclusion Box */}
            <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg border-2 border-amber-400">
              <p className="font-bold text-amber-700 mb-2">Conclusion: Club Effect is Real but Temporary</p>
              <p className="text-sm text-amber-700">
                The trendlines show a <strong>clear shock at Club launch</strong> (Apr→May 2025: shipping -6 DKK, free shipping +10pp).
                However, this effect <strong>reverts to historical norms</strong> within 1-2 months.
              </p>
              <div className="mt-3 p-3 bg-white/50 dark:bg-zinc-900/50 rounded text-xs space-y-2">
                <p className="text-amber-700">
                  <strong>Why the delta is small when averaged:</strong>
                </p>
                <ul className="text-amber-600 space-y-1">
                  <li>• The May 2025 shock (1 month) gets diluted across 11 months of data</li>
                  <li>• After initial adoption, shipping behavior returns to pre-Club patterns</li>
                  <li>• High AOV customers (~450 DKK) are mostly above the 449 DKK threshold anyway</li>
                  <li>• Only ~47% of orders fall in the subsidy zone (199-449 DKK)</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The 81.5K DKK/month shipping subsidy comes primarily from <strong>lower-AOV Club members</strong>, not from Best/Medium segments.
                This explains why segment-specific shipping costs are minimal (Best: 1,354 DKK/mo, Medium: 1,289 DKK/mo).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SHIPPING THRESHOLDS REFERENCE                                      */}
      {/* ================================================================== */}
      <Card className="border-2 border-purple-300">
        <CardHeader className="bg-purple-100 dark:bg-purple-950/30">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Shipping Thresholds Reference</CardTitle>
          </div>
          <CardDescription>Free shipping thresholds - subsidy zone is 199-449 DKK for Denmark</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-400">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🇩🇰</span>
                <span className="font-bold text-lg">Denmark (Primary)</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded text-center">
                  <p className="text-muted-foreground text-xs">Club Threshold</p>
                  <p className="font-mono font-bold text-xl text-green-600">199 DKK</p>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-900 rounded text-center">
                  <p className="text-muted-foreground text-xs">Non-Club Threshold</p>
                  <p className="font-mono font-bold text-xl">449 DKK</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-center">
                <p className="text-xs text-green-700">Subsidy Zone: 199-449 DKK (250 DKK benefit)</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
              <p className="font-medium mb-3">Why Shipping Impact is Small for Best/Medium:</p>
              <ul className="text-xs space-y-2">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 text-purple-600" />
                  <span>~33% of orders are above 449 DKK (free regardless of Club)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 text-purple-600" />
                  <span>Only ~47% fall in subsidy zone (199-449 DKK)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 text-purple-600" />
                  <span>High AOV customers (~450 DKK) benefit less from lower threshold</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 text-purple-600" />
                  <span>Most shipping subsidy comes from lower-value orders</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
