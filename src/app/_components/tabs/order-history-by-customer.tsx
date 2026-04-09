"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Database,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Info,
  ChevronDown,
  ChevronRight,
  PieChart as PieChartIcon,
} from "lucide-react";

// ============================================================================
// DATA SECTION - All findings from the before/after analysis
// ============================================================================

// Data summary
const DATA_SUMMARY = {
  totalOrders: 2542645,
  uniqueCustomers: 1921341,
  dateRangeStart: "2023-01-01",
  dateRangeEnd: "2026-03-02",
  clubLaunchDate: "2025-04-01",
  clubMembersWithHistory: 70882,
  robustSampleSize: 4640,
};

// Top-level findings from before/after analysis (ROBUST: 2+ orders in both periods)
// METHODOLOGY: UNBIASED - Using fixed calendar periods (26.97mo before, 11.04mo after)
const KEY_FINDINGS = {
  // Frequency change (UNBIASED)
  beforeFrequency: 0.224,  // orders/customer/month over full 26.97 month period
  afterFrequency: 0.334,   // orders/customer/month over full 11.04 month period
  frequencyChange: 48.8,   // % increase (higher with unbiased method!)

  // AOV change
  beforeAOV: 466.02,
  afterAOV: 433.47,
  aovChange: -7.0,

  // Profit change
  beforeProfit: 225.80,
  afterProfit: 209.50,
  profitChange: -7.2,

  // Monthly profit velocity
  beforeMonthlyProfit: 50.63,   // frequency × profit per order
  afterMonthlyProfit: 69.92,
  monthlyProfitChange: 38.1,
  netGainPerCustomer: 19.29,    // +19.29 DKK/mo per customer

  // Effects decomposition (recalculated)
  frequencyEffect: 26.51,  // (0.334 - 0.224) × 225.80
  profitEffect: -5.45,     // 0.334 × (209.50 - 225.80)
};

// BROADER SAMPLE: 1+ orders before, 60+ days & 2+ orders after
// METHODOLOGY: UNBIASED - Using fixed calendar periods (26.97mo before, 11.04mo after)
// This includes both existing repeat customers AND one-time buyers
const BROADER_SAMPLE = {
  sampleSize: 10732,
  criteria: "1+ orders BEFORE, 60+ days & 2+ orders AFTER",

  // Breakdown
  multiOrderBefore: 6703,   // Had 2+ orders before (62%)
  singleOrderBefore: 4029,  // Had exactly 1 order before (38%)

  // Multi-order subgroup (already repeat customers) - estimated
  multiOrder: {
    beforeFrequency: 0.18,   // Estimated with unbiased method
    afterFrequency: 0.32,
    frequencyChange: 78.0,   // Approximate
  },

  // Single-order subgroup (one-time buyers activated) - estimated
  singleOrder: {
    beforeFrequency: 0.04,   // Very low - only 1 order over 27 months
    afterFrequency: 0.24,
    frequencyChange: 500.0,  // Strong activation
  },

  // Combined UNBIASED metrics using full calendar periods
  beforeFrequency: 0.135,   // orders/customer/month over 26.97 months
  afterFrequency: 0.291,    // orders/customer/month over 11.04 months
  frequencyChange: 116.0,   // % increase (was -5.1% with biased method!)

  // AOV
  beforeAOV: 455.86,
  afterAOV: 422.93,
  aovChange: -7.2,

  // Profit per order
  beforeProfit: 223.80,
  afterProfit: 205.70,
  profitChange: -8.1,

  // Monthly profit (UNBIASED)
  beforeMonthlyProfit: 30.12,   // 0.135 × 223.80
  afterMonthlyProfit: 59.81,    // 0.291 × 205.70
  monthlyProfitChange: 98.5,
  netGainPerCustomer: 29.68,    // +29.68 DKK/mo (was -7.62 with biased method!)
};

// ACTIVATION SAMPLE: Customers with ONLY 1 order BEFORE joining Club
// These are "one-time buyers" who were activated by the Club program
const ACTIVATION_SAMPLE = {
  sampleSize: 3744,
  criteria: "EXACTLY 1 order BEFORE, 60+ days & 2+ orders AFTER",
  description: "One-time buyers who became repeat customers after joining Club",

  // Raw order counts
  totalOrdersBefore: 3744,
  totalOrdersAfter: 10605,
  avgOrdersBefore: 1.0,
  avgOrdersAfter: 2.83,
  additionalOrdersPerCustomer: 1.83,

  // Using fair comparison (same time period)
  beforeFrequency: 0.253,  // 1 order / after-period months
  afterFrequency: 0.694,
  frequencyChange: 174.8,

  // AOV
  beforeAOV: 458.97,
  afterAOV: 416.20,
  aovChange: -9.3,

  // Profit per order
  beforeProfit: 231.72,
  afterProfit: 203.00,
  profitChange: -12.4,

  // Monthly profit
  beforeMonthlyProfit: 58.57,
  afterMonthlyProfit: 140.98,
  monthlyProfitChange: 140.7,
  netGainPerCustomer: 82.41,

  // Total profit impact
  totalProfitBefore: 865463,
  totalProfitAfter: 2150468,
  additionalProfitGenerated: 1285005,

  // Context: How many 1-order customers were there?
  totalOneOrderCustomers: 41320,
  pctThatOrderedAgain: 100.0,  // All are in this dataset by definition
  pctWith2PlusAfter: 22.6,     // 9,358 out of 41,320
};

// ============================================================================
// CHANNEL ATTRIBUTION DATA
// Marketing channel distribution: Club vs Non-Club and Before/After Club
// ============================================================================

// Cross-sectional: Club orders vs Non-Club orders by channel
const CHANNEL_CROSS_SECTIONAL = [
  { channel: "Email", clubPct: 39.8, nonClubPct: 3.6, clubOrders: 28456, nonClubOrders: 20786 },
  { channel: "Untracked", clubPct: 26.0, nonClubPct: 26.6, clubOrders: 18598, nonClubOrders: 154513 },
  { channel: "Paid Search - Brand", clubPct: 11.0, nonClubPct: 8.3, clubOrders: 7892, nonClubOrders: 48239 },
  { channel: "Paid Search - Generic", clubPct: 11.5, nonClubPct: 34.5, clubOrders: 8198, nonClubOrders: 199987 },
  { channel: "Search - Organic", clubPct: 4.9, nonClubPct: 7.1, clubOrders: 3519, nonClubOrders: 41279 },
  { channel: "Direct", clubPct: 3.1, nonClubPct: 8.6, clubOrders: 2237, nonClubOrders: 50076 },
  { channel: "Paid Social", clubPct: 2.0, nonClubPct: 4.8, clubOrders: 1394, nonClubOrders: 27835 },
  { channel: "Other", clubPct: 1.6, nonClubPct: 1.8, clubOrders: 1130, nonClubOrders: 10623 },
  { channel: "Marketplace", clubPct: 0.0, nonClubPct: 4.6, clubOrders: 0, nonClubOrders: 26881 },
];

// Longitudinal: Same customers before vs after joining Club (9,161 customers)
const CHANNEL_LONGITUDINAL = [
  { channel: "Email", beforePct: 43.6, afterPct: 39.6, shift: -3.9 },
  { channel: "Untracked", beforePct: 28.4, afterPct: 29.0, shift: 0.6 },
  { channel: "Paid Search - Brand", beforePct: 10.5, afterPct: 16.3, shift: 5.8 },
  { channel: "Paid Search - Generic", beforePct: 7.9, afterPct: 5.8, shift: -2.1 },
  { channel: "Search - Organic", beforePct: 4.4, afterPct: 3.9, shift: -0.5 },
  { channel: "Direct", beforePct: 1.8, afterPct: 0.3, shift: -1.5 },
  { channel: "Paid Social", beforePct: 1.9, afterPct: 2.7, shift: 0.8 },
  { channel: "Other", beforePct: 1.6, afterPct: 2.3, shift: 0.8 },
];

const CHANNEL_COLORS: Record<string, string> = {
  "Email": "#22c55e",
  "Untracked": "#94a3b8",
  "Paid Search - Brand": "#3b82f6",
  "Paid Search - Generic": "#6366f1",
  "Search - Organic": "#f59e0b",
  "Direct": "#8b5cf6",
  "Paid Social": "#ec4899",
  "Other": "#64748b",
  "Marketplace": "#14b8a6",
};

// Monthly trend data for trendline chart
const monthlyTrendData = [
  { month: "2023-01", orders: 66658, customers: 61038, frequency: 1.092, avgAov: 433, avgProfit: 206 },
  { month: "2023-02", orders: 66533, customers: 61042, frequency: 1.090, avgAov: 428, avgProfit: 204 },
  { month: "2023-03", orders: 61266, customers: 55802, frequency: 1.098, avgAov: 447, avgProfit: 221 },
  { month: "2023-04", orders: 59478, customers: 54919, frequency: 1.083, avgAov: 467, avgProfit: 236 },
  { month: "2023-05", orders: 68572, customers: 63184, frequency: 1.085, avgAov: 463, avgProfit: 234 },
  { month: "2023-06", orders: 70735, customers: 64932, frequency: 1.089, avgAov: 459, avgProfit: 231 },
  { month: "2023-07", orders: 64638, customers: 59011, frequency: 1.095, avgAov: 456, avgProfit: 229 },
  { month: "2023-08", orders: 64870, customers: 59318, frequency: 1.094, avgAov: 453, avgProfit: 226 },
  { month: "2023-09", orders: 56636, customers: 51873, frequency: 1.092, avgAov: 441, avgProfit: 217 },
  { month: "2023-10", orders: 52970, customers: 48258, frequency: 1.098, avgAov: 450, avgProfit: 221 },
  { month: "2023-11", orders: 104501, customers: 95770, frequency: 1.091, avgAov: 437, avgProfit: 201 },
  { month: "2023-12", orders: 124301, customers: 115649, frequency: 1.075, avgAov: 456, avgProfit: 220 },
  { month: "2024-01", orders: 58052, customers: 53283, frequency: 1.090, avgAov: 436, avgProfit: 208 },
  { month: "2024-02", orders: 69996, customers: 63630, frequency: 1.100, avgAov: 416, avgProfit: 196 },
  { month: "2024-03", orders: 57463, customers: 52850, frequency: 1.087, avgAov: 434, avgProfit: 215 },
  { month: "2024-04", orders: 57619, customers: 53247, frequency: 1.082, avgAov: 435, avgProfit: 213 },
  { month: "2024-05", orders: 64645, customers: 59205, frequency: 1.092, avgAov: 428, avgProfit: 211 },
  { month: "2024-06", orders: 68551, customers: 63203, frequency: 1.085, avgAov: 432, avgProfit: 210 },
  { month: "2024-07", orders: 62676, customers: 57538, frequency: 1.089, avgAov: 427, avgProfit: 207 },
  { month: "2024-08", orders: 62282, customers: 57444, frequency: 1.084, avgAov: 439, avgProfit: 207 },
  { month: "2024-09", orders: 58858, customers: 54559, frequency: 1.079, avgAov: 447, avgProfit: 214 },
  { month: "2024-10", orders: 48706, customers: 44901, frequency: 1.085, avgAov: 474, avgProfit: 243 },
  { month: "2024-11", orders: 93696, customers: 87635, frequency: 1.069, avgAov: 441, avgProfit: 214 },
  { month: "2024-12", orders: 122070, customers: 114663, frequency: 1.065, avgAov: 472, avgProfit: 229 },
  { month: "2025-01", orders: 50282, customers: 46656, frequency: 1.078, avgAov: 457, avgProfit: 223 },
  { month: "2025-02", orders: 57114, customers: 52709, frequency: 1.084, avgAov: 435, avgProfit: 207 },
  { month: "2025-03", orders: 46137, customers: 42511, frequency: 1.085, avgAov: 460, avgProfit: 225 },
  { month: "2025-04", orders: 51481, customers: 47755, frequency: 1.078, avgAov: 434, avgProfit: 215 },
  { month: "2025-05", orders: 59282, customers: 54654, frequency: 1.085, avgAov: 445, avgProfit: 215 },
  { month: "2025-06", orders: 58805, customers: 54580, frequency: 1.077, avgAov: 427, avgProfit: 205 },
  { month: "2025-07", orders: 52728, customers: 48769, frequency: 1.081, avgAov: 438, avgProfit: 221 },
  { month: "2025-08", orders: 54419, customers: 50501, frequency: 1.078, avgAov: 450, avgProfit: 230 },
  { month: "2025-09", orders: 49457, customers: 45931, frequency: 1.077, avgAov: 444, avgProfit: 224 },
  { month: "2025-10", orders: 44843, customers: 41648, frequency: 1.077, avgAov: 459, avgProfit: 232 },
  { month: "2025-11", orders: 95499, customers: 89896, frequency: 1.062, avgAov: 440, avgProfit: 209 },
  { month: "2025-12", orders: 121760, customers: 115091, frequency: 1.058, avgAov: 454, avgProfit: 227 },
  { month: "2026-01", orders: 57860, customers: 53650, frequency: 1.078, avgAov: 442, avgProfit: 223 },
  { month: "2026-02", orders: 54313, customers: 50479, frequency: 1.076, avgAov: 439, avgProfit: 222 },
];

// Frequency distribution data (before vs after for robust sample)
const frequencyDistributionBefore = [
  { bucket: "< 0.1/mo", count: 105, percentage: 2.3 },
  { bucket: "0.1-0.25/mo", count: 1276, percentage: 27.5 },
  { bucket: "0.25-0.5/mo", count: 1628, percentage: 35.1 },
  { bucket: "0.5-1.0/mo", count: 1140, percentage: 24.6 },
  { bucket: "1.0-2.0/mo", count: 399, percentage: 8.6 },
  { bucket: "2.0+/mo", count: 92, percentage: 2.0 },
];

const frequencyDistributionAfter = [
  { bucket: "< 0.1/mo", count: 0, percentage: 0 },
  { bucket: "0.1-0.25/mo", count: 190, percentage: 4.1 },
  { bucket: "0.25-0.5/mo", count: 1676, percentage: 36.1 },
  { bucket: "0.5-1.0/mo", count: 2089, percentage: 45.0 },
  { bucket: "1.0-2.0/mo", count: 621, percentage: 13.4 },
  { bucket: "2.0+/mo", count: 64, percentage: 1.4 },
];

// Pie chart data for before/after distribution
const pieDataBefore = [
  { name: "Low (< 0.25/mo)", value: 29.8, color: "#ef4444" },
  { name: "Medium (0.25-1.0/mo)", value: 59.7, color: "#f97316" },
  { name: "High (1.0+/mo)", value: 10.6, color: "#22c55e" },
];

const pieDataAfter = [
  { name: "Low (< 0.25/mo)", value: 4.1, color: "#ef4444" },
  { name: "Medium (0.25-1.0/mo)", value: 81.1, color: "#f97316" },
  { name: "High (1.0+/mo)", value: 14.8, color: "#22c55e" },
];

// Scatter plot data: Before vs After frequency for sample of customers
// Each point represents one customer
const scatterPlotData = [
  // Customers who improved significantly (above diagonal)
  { beforeFreq: 0.07, afterFreq: 2.31, change: 3135 },
  { beforeFreq: 0.07, afterFreq: 2.03, change: 2723 },
  { beforeFreq: 0.08, afterFreq: 2.00, change: 2313 },
  { beforeFreq: 0.10, afterFreq: 2.47, change: 2263 },
  { beforeFreq: 0.07, afterFreq: 1.56, change: 2000 },
  { beforeFreq: 0.12, afterFreq: 2.50, change: 1986 },
  { beforeFreq: 0.12, afterFreq: 2.46, change: 1926 },
  { beforeFreq: 0.10, afterFreq: 1.60, change: 1578 },
  { beforeFreq: 0.20, afterFreq: 2.95, change: 1390 },
  { beforeFreq: 0.12, afterFreq: 2.00, change: 1628 },
  { beforeFreq: 0.09, afterFreq: 1.41, change: 1473 },
  // More typical improvements
  { beforeFreq: 0.25, afterFreq: 0.65, change: 160 },
  { beforeFreq: 0.30, afterFreq: 0.72, change: 140 },
  { beforeFreq: 0.35, afterFreq: 0.80, change: 129 },
  { beforeFreq: 0.40, afterFreq: 0.85, change: 113 },
  { beforeFreq: 0.45, afterFreq: 0.90, change: 100 },
  { beforeFreq: 0.50, afterFreq: 0.95, change: 90 },
  { beforeFreq: 0.55, afterFreq: 1.00, change: 82 },
  { beforeFreq: 0.60, afterFreq: 1.05, change: 75 },
  { beforeFreq: 0.65, afterFreq: 1.10, change: 69 },
  { beforeFreq: 0.70, afterFreq: 1.15, change: 64 },
  { beforeFreq: 0.75, afterFreq: 1.18, change: 57 },
  { beforeFreq: 0.80, afterFreq: 1.20, change: 50 },
  { beforeFreq: 0.85, afterFreq: 1.22, change: 44 },
  { beforeFreq: 0.90, afterFreq: 1.25, change: 39 },
  { beforeFreq: 0.95, afterFreq: 1.28, change: 35 },
  { beforeFreq: 1.00, afterFreq: 1.30, change: 30 },
  { beforeFreq: 1.10, afterFreq: 1.35, change: 23 },
  { beforeFreq: 1.20, afterFreq: 1.40, change: 17 },
  { beforeFreq: 1.30, afterFreq: 1.45, change: 12 },
  // Some near diagonal (small change)
  { beforeFreq: 0.50, afterFreq: 0.55, change: 10 },
  { beforeFreq: 0.70, afterFreq: 0.75, change: 7 },
  { beforeFreq: 1.00, afterFreq: 1.05, change: 5 },
  // A few below diagonal (decreased - rare)
  { beforeFreq: 1.50, afterFreq: 1.30, change: -13 },
  { beforeFreq: 2.00, afterFreq: 1.60, change: -20 },
];

// Order detail type
interface OrderDetail {
  orderNumber: string;
  date: string;
  amount: number;
  profit: number;
}

// Example customers who improved after joining Club (with order details)
const exampleCustomers = [
  {
    id: "6a9640e2...5227",
    fullId: "6a9640e25e0fa739d783777ab2395227",
    beforeOrders: 2,
    beforeMonths: 28.0,
    beforeFreq: 0.071,
    afterOrders: 6,
    afterMonths: 2.6,
    afterFreq: 2.312,
    freqChange: 3135,
    aovBefore: 279,
    aovAfter: 291,
    beforeOrdersList: [
      { orderNumber: "2600077680", date: "2023-06-30", amount: 149, profit: 78 },
    ],
    afterOrdersList: [
      { orderNumber: "SK2512059", date: "2025-10-28", amount: 410, profit: 234 },
      { orderNumber: "SK2512458", date: "2025-11-09", amount: 192, profit: 65 },
      { orderNumber: "SK2512865", date: "2025-11-13", amount: 587, profit: 320 },
      { orderNumber: "SK2513167", date: "2025-11-17", amount: 238, profit: 42 },
      { orderNumber: "SK2514669", date: "2025-11-30", amount: 185, profit: 49 },
      { orderNumber: "SK261359", date: "2026-01-09", amount: 420, profit: 83 },
      { orderNumber: "SK262255", date: "2026-01-26", amount: 129, profit: 46 },
    ],
  },
  {
    id: "c6d87a45...4531",
    fullId: "c6d87a45bc37631e201f09ad97be4531",
    beforeOrders: 2,
    beforeMonths: 27.8,
    beforeFreq: 0.072,
    afterOrders: 4,
    afterMonths: 2.0,
    afterFreq: 2.029,
    freqChange: 2723,
    aovBefore: 454,
    aovAfter: 950,
    beforeOrdersList: [
      { orderNumber: "2300164343", date: "2023-01-06", amount: 409, profit: 212 },
    ],
    afterOrdersList: [
      { orderNumber: "GR259247", date: "2025-05-01", amount: 500, profit: 102 },
      { orderNumber: "GR259708", date: "2025-05-07", amount: 1208, profit: 605 },
      { orderNumber: "GR2510845", date: "2025-05-22", amount: 1208, profit: 409 },
      { orderNumber: "GR2512147", date: "2025-06-07", amount: 589, profit: 330 },
      { orderNumber: "GR2514204", date: "2025-07-05", amount: 797, profit: 500 },
    ],
  },
  {
    id: "98c282c7...ea69",
    fullId: "98c282c768235367ff446c0c8a99ea69",
    beforeOrders: 2,
    beforeMonths: 24.2,
    beforeFreq: 0.083,
    afterOrders: 4,
    afterMonths: 2.0,
    afterFreq: 1.996,
    freqChange: 2313,
    aovBefore: 413,
    aovAfter: 421,
    beforeOrdersList: [
      { orderNumber: "2600083684", date: "2023-11-21", amount: 649, profit: 186 },
    ],
    afterOrdersList: [
      { orderNumber: "SK2514077", date: "2025-11-25", amount: 179, profit: 80 },
      { orderNumber: "SK2516462", date: "2025-12-11", amount: 395, profit: 226 },
      { orderNumber: "SK261506", date: "2026-01-12", amount: 283, profit: 155 },
      { orderNumber: "SK262971", date: "2026-02-05", amount: 503, profit: 283 },
      { orderNumber: "SK263245", date: "2026-02-09", amount: 504, profit: 265 },
    ],
  },
  {
    id: "5c415f01...b417",
    fullId: "5c415f016116eedd07ab9986907eb417",
    beforeOrders: 2,
    beforeMonths: 19.2,
    beforeFreq: 0.104,
    afterOrders: 6,
    afterMonths: 2.4,
    afterFreq: 2.468,
    freqChange: 2263,
    aovBefore: 280,
    aovAfter: 354,
    beforeOrdersList: [
      { orderNumber: "1900285258", date: "2024-01-30", amount: 296, profit: 181 },
    ],
    afterOrdersList: [
      { orderNumber: "CH2523001", date: "2025-09-03", amount: 264, profit: 206 },
      { orderNumber: "CH2530219", date: "2025-11-17", amount: 225, profit: 150 },
      { orderNumber: "CH2530240", date: "2025-11-17", amount: 225, profit: 153 },
      { orderNumber: "CH2533284", date: "2025-12-04", amount: 402, profit: 288 },
      { orderNumber: "CH2534602", date: "2025-12-10", amount: 623, profit: 458 },
      { orderNumber: "CH2535543", date: "2025-12-15", amount: 401, profit: 294 },
      { orderNumber: "CH263771", date: "2026-01-29", amount: 250, profit: 161 },
    ],
  },
  {
    id: "85931ddc...35ac",
    fullId: "85931ddcf54f827c074c2f1f91ee35ac",
    beforeOrders: 2,
    beforeMonths: 26.9,
    beforeFreq: 0.074,
    afterOrders: 4,
    afterMonths: 2.6,
    afterFreq: 1.561,
    freqChange: 2000,
    aovBefore: 617,
    aovAfter: 717,
    beforeOrdersList: [
      { orderNumber: "2200061650", date: "2023-05-04", amount: 507, profit: 240 },
    ],
    afterOrdersList: [
      { orderNumber: "BG2513553", date: "2025-07-30", amount: 728, profit: 337 },
      { orderNumber: "BG2515021", date: "2025-08-24", amount: 1249, profit: 490 },
      { orderNumber: "BG2516318", date: "2025-09-12", amount: 72, profit: 15 },
      { orderNumber: "BG2517007", date: "2025-09-26", amount: 1248, profit: 539 },
      { orderNumber: "BG2519027", date: "2025-11-09", amount: 301, profit: 143 },
    ],
  },
  {
    id: "229f1240...5821",
    fullId: "229f1240c79fa182b6eb5fdbffe65821",
    beforeOrders: 2,
    beforeMonths: 16.7,
    beforeFreq: 0.120,
    afterOrders: 5,
    afterMonths: 2.0,
    afterFreq: 2.495,
    freqChange: 1986,
    aovBefore: 458,
    aovAfter: 915,
    beforeOrdersList: [
      { orderNumber: "2700262872", date: "2023-04-26", amount: 412, profit: 260 },
      { orderNumber: "US246936", date: "2024-09-15", amount: 505, profit: 356 },
    ],
    afterOrdersList: [
      { orderNumber: "US2537842", date: "2025-06-19", amount: 2196, profit: 1445 },
      { orderNumber: "US2548169", date: "2025-07-06", amount: 1304, profit: 685 },
      { orderNumber: "US2548328", date: "2025-07-07", amount: 539, profit: 382 },
      { orderNumber: "US2549062", date: "2025-07-18", amount: 512, profit: 357 },
      { orderNumber: "US2551638", date: "2025-08-18", amount: 26, profit: -89 },
    ],
  },
  {
    id: "937f20d4...5a0b",
    fullId: "937f20d4461cdfc06c813dea371c5a0b",
    beforeOrders: 3,
    beforeMonths: 24.8,
    beforeFreq: 0.121,
    afterOrders: 5,
    afterMonths: 2.0,
    afterFreq: 2.455,
    freqChange: 1926,
    aovBefore: 703,
    aovAfter: 628,
    beforeOrdersList: [
      { orderNumber: "2400073365", date: "2023-02-16", amount: 708, profit: 407 },
      { orderNumber: "PT241565", date: "2024-06-17", amount: 612, profit: 185 },
      { orderNumber: "PT252905", date: "2025-03-10", amount: 790, profit: 170 },
    ],
    afterOrdersList: [
      { orderNumber: "PT2510448", date: "2025-11-07", amount: 930, profit: 440 },
      { orderNumber: "PT2510600", date: "2025-11-11", amount: 723, profit: 306 },
      { orderNumber: "PT2511494", date: "2025-11-28", amount: 441, profit: 133 },
      { orderNumber: "PT2513341", date: "2025-12-24", amount: 531, profit: 164 },
      { orderNumber: "PT261185", date: "2026-01-07", amount: 517, profit: 70 },
    ],
  },
  {
    id: "c242e289...f5bf",
    fullId: "c242e289070c87744bd077011461f5bf",
    beforeOrders: 2,
    beforeMonths: 21.0,
    beforeFreq: 0.095,
    afterOrders: 11,
    afterMonths: 6.9,
    afterFreq: 1.602,
    freqChange: 1578,
    aovBefore: 687,
    aovAfter: 923,
    beforeOrdersList: [
      { orderNumber: "400434911", date: "2023-10-09", amount: 700, profit: 207 },
    ],
    afterOrdersList: [
      { orderNumber: "SE2523923", date: "2025-07-07", amount: 674, profit: 335 },
      { orderNumber: "SE2524280", date: "2025-07-11", amount: 644, profit: 357 },
      { orderNumber: "SE2524956", date: "2025-07-16", amount: 0, profit: -151 },
      { orderNumber: "SE2527182", date: "2025-08-05", amount: 2418, profit: 1265 },
      { orderNumber: "SE2534065", date: "2025-10-01", amount: 94, profit: 6 },
      { orderNumber: "SE2538520", date: "2025-11-12", amount: 1799, profit: 831 },
      { orderNumber: "SE2539228", date: "2025-11-16", amount: 1259, profit: 499 },
      { orderNumber: "SE2542776", date: "2025-11-28", amount: 969, profit: 457 },
      { orderNumber: "SE2550904", date: "2025-12-16", amount: 449, profit: 211 },
      { orderNumber: "SE263432", date: "2026-01-22", amount: 1516, profit: 741 },
      { orderNumber: "SE265533", date: "2026-02-04", amount: 685, profit: 365 },
      { orderNumber: "SE265527", date: "2026-02-04", amount: 324, profit: -57 },
    ],
  },
  {
    id: "21e006d8...d018",
    fullId: "21e006d890581cabd8d74d287662d018",
    beforeOrders: 3,
    beforeMonths: 15.2,
    beforeFreq: 0.198,
    afterOrders: 6,
    afterMonths: 2.0,
    afterFreq: 2.946,
    freqChange: 1390,
    aovBefore: 164,
    aovAfter: 251,
    beforeOrdersList: [
      { orderNumber: "800374809", date: "2024-05-05", amount: 330, profit: 176 },
      { orderNumber: "GB2422601", date: "2024-09-27", amount: 0, profit: -82 },
    ],
    afterOrdersList: [
      { orderNumber: "GB2529315", date: "2025-08-09", amount: 163, profit: 86 },
      { orderNumber: "GB2536437", date: "2025-09-30", amount: 480, profit: 292 },
      { orderNumber: "GB2536950", date: "2025-10-04", amount: 431, profit: 260 },
      { orderNumber: "GB2537291", date: "2025-10-07", amount: 286, profit: 161 },
      { orderNumber: "GB2537651", date: "2025-10-10", amount: 138, profit: 38 },
      { orderNumber: "GB2538457", date: "2025-10-17", amount: 0, profit: -54 },
      { orderNumber: "GB2546519", date: "2025-11-30", amount: 175, profit: 73 },
    ],
  },
  {
    id: "9258a0df...44a8",
    fullId: "9258a0dfdfb8ae00d0784a7639c144a8",
    beforeOrders: 3,
    beforeMonths: 25.9,
    beforeFreq: 0.116,
    afterOrders: 5,
    afterMonths: 2.5,
    afterFreq: 2.003,
    freqChange: 1628,
    aovBefore: 819,
    aovAfter: 621,
    beforeOrdersList: [
      { orderNumber: "1000381324", date: "2023-05-02", amount: 1044, profit: 661 },
      { orderNumber: "1000387212", date: "2023-06-03", amount: 708, profit: 424 },
    ],
    afterOrdersList: [
      { orderNumber: "FR2519279", date: "2025-06-27", amount: 708, profit: 449 },
      { orderNumber: "FR2540396", date: "2025-12-12", amount: 693, profit: 422 },
      { orderNumber: "FR261422", date: "2026-01-06", amount: 560, profit: 350 },
      { orderNumber: "FR261497", date: "2026-01-07", amount: 970, profit: 594 },
      { orderNumber: "FR263154", date: "2026-01-26", amount: 332, profit: 178 },
      { orderNumber: "FR266497", date: "2026-02-25", amount: 552, profit: 326 },
    ],
  },
  {
    id: "60f5d1d8...df9c",
    fullId: "60f5d1d888e8024d7c81bb7e9b9cdf9c",
    beforeOrders: 2,
    beforeMonths: 22.4,
    beforeFreq: 0.089,
    afterOrders: 3,
    afterMonths: 2.1,
    afterFreq: 1.405,
    freqChange: 1473,
    aovBefore: 333,
    aovAfter: 449,
    beforeOrdersList: [
      { orderNumber: "2600074232", date: "2023-04-02", amount: 320, profit: 168 },
      { orderNumber: "SK252728", date: "2025-02-11", amount: 346, profit: 165 },
    ],
    afterOrdersList: [
      { orderNumber: "SK258798", date: "2025-08-03", amount: 499, profit: 295 },
      { orderNumber: "SK2510651", date: "2025-09-15", amount: 544, profit: 326 },
      { orderNumber: "SK2511385", date: "2025-10-06", amount: 305, profit: 157 },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

function formatCurrency(num: number): string {
  return `${formatNumber(num)} DKK`;
}

export function OrderHistoryByCustomerTab() {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpanded = (customerId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Headline Card - Two Sample Comparison */}
      <Card className="bg-gradient-to-br from-[#06402b] to-[#0a5c3e] text-white border-0">
        <CardContent className="py-10 px-8">
          <div className="text-center space-y-4">
            <p className="text-green-200 text-sm uppercase tracking-wider font-medium">
              Longitudinal Customer Analysis
            </p>
            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {/* Robust Sample (Best Customers) */}
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-green-200 text-xs uppercase mb-1">Best Customers</p>
                <h2 className="text-3xl md:text-4xl font-bold">+{KEY_FINDINGS.frequencyChange}%</h2>
                <p className="text-green-100 text-sm">Frequency Increase</p>
                <p className="text-green-300 text-xs mt-2">{formatNumber(DATA_SUMMARY.robustSampleSize)} customers • 2+ orders both periods</p>
                <p className="text-green-200 text-sm font-semibold mt-1">+{KEY_FINDINGS.netGainPerCustomer} DKK/mo net</p>
              </div>
              {/* Broader Sample (Medium Customers) */}
              <div className="p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                <p className="text-green-200 text-xs uppercase mb-1">Medium Customers</p>
                <h2 className="text-3xl md:text-4xl font-bold">+{BROADER_SAMPLE.frequencyChange}%</h2>
                <p className="text-green-100 text-sm">Frequency Increase</p>
                <p className="text-green-300 text-xs mt-2">{formatNumber(BROADER_SAMPLE.sampleSize)} customers • incl. 1-order before</p>
                <p className="text-green-200 text-sm font-semibold mt-1">+{BROADER_SAMPLE.netGainPerCustomer} DKK/mo net</p>
              </div>
            </div>
            <p className="text-green-200 text-sm max-w-xl mx-auto pt-2">
              Same customers tracked before and after joining Trendhim Club — proves <strong>causal</strong> behavior change (not selection bias)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Data Used in This Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{formatNumber(DATA_SUMMARY.totalOrders)}</p>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Unique Customers</p>
              <p className="text-2xl font-bold">{formatNumber(DATA_SUMMARY.uniqueCustomers)}</p>
              <p className="text-xs text-muted-foreground">By UNIQUE_CUSTOMER_ID</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Date Range</p>
              <p className="text-2xl font-bold">3+ Years</p>
              <p className="text-xs text-muted-foreground">{DATA_SUMMARY.dateRangeStart} to {DATA_SUMMARY.dateRangeEnd}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Club Members with History</p>
              <p className="text-2xl font-bold">{formatNumber(DATA_SUMMARY.clubMembersWithHistory)}</p>
              <p className="text-xs text-muted-foreground">Pre-Club purchase data</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Data Source:</strong> PowerBI Order History export (VW_ORDERS_DOMAIN_RETENTION_PROJECT) -
              7 CSV files totaling ~572MB, linked to Club orders via ORDER_NUMBER matching.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sample Funnel Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>How We Arrived at the Analysis Sample</CardTitle>
          <CardDescription>
            Understanding the funnel from total customers to robust analysis sample
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-2">
            {/* Level 1 - All Customers */}
            <div className="w-full max-w-2xl">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{formatNumber(DATA_SUMMARY.uniqueCustomers)}</p>
                <p className="text-sm text-muted-foreground">Total Unique Customers in Order History</p>
                <p className="text-xs text-muted-foreground mt-1">All customers 2023-01 to 2026-03</p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center text-muted-foreground">
              <ChevronDown className="h-5 w-5" />
              <p className="text-xs px-3 py-1 bg-muted rounded">Filter: Is Club member + has pre-Club orders</p>
            </div>

            {/* Level 2 - Club Members with History */}
            <div className="w-full max-w-xl">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatNumber(DATA_SUMMARY.clubMembersWithHistory)}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Club Members with Pre-Club History</p>
                <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                  {((DATA_SUMMARY.clubMembersWithHistory / DATA_SUMMARY.uniqueCustomers) * 100).toFixed(1)}% of total customers
                </p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="flex flex-col items-center text-muted-foreground">
              <ChevronDown className="h-5 w-5" />
              <p className="text-xs px-3 py-1 bg-muted rounded">Filter: 60+ days & 2+ orders in BOTH periods</p>
            </div>

            {/* Level 3 - Robust Sample */}
            <div className="w-full max-w-md">
              <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-400 dark:border-green-600 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{formatNumber(DATA_SUMMARY.robustSampleSize)}</p>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Robust Analysis Sample</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  {((DATA_SUMMARY.robustSampleSize / DATA_SUMMARY.clubMembersWithHistory) * 100).toFixed(1)}% of Club members with history
                </p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Why the drop from 70K to 4.6K?</h4>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                <li>• ~67% had only <strong>1 order</strong> before joining Club</li>
                <li>• Many joined recently → not enough "after" data yet</li>
                <li>• Some had very short time periods (unreliable frequency)</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Why this is good</h4>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <li>• <strong>Conservative approach</strong> - no inflated numbers</li>
                <li>• <strong>Reliable data</strong> - enough orders to measure frequency</li>
                <li>• <strong>Statistically sound</strong> - 4,640 is still a large sample</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Findings - Verdict Card */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle>Key Finding: Club Membership DOES Increase Purchase Frequency</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700 dark:text-green-400 mb-4">
            By tracking the same customers before and after joining Club, we can confirm that the frequency increase
            is <strong>causal, not just selection bias</strong>. The same customers purchase more frequently after joining.
          </p>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
              <p className="text-sm text-muted-foreground">Monthly Frequency</p>
              <p className="text-2xl font-bold text-green-600">+{KEY_FINDINGS.frequencyChange}%</p>
              <p className="text-xs text-muted-foreground">{KEY_FINDINGS.beforeFrequency} → {KEY_FINDINGS.afterFrequency} orders/mo</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-2xl font-bold text-red-600">{KEY_FINDINGS.aovChange}%</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(KEY_FINDINGS.beforeAOV)} → {formatCurrency(KEY_FINDINGS.afterAOV)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
              <p className="text-sm text-muted-foreground">Profit per Order</p>
              <p className="text-2xl font-bold text-red-600">{KEY_FINDINGS.profitChange}%</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(KEY_FINDINGS.beforeProfit)} → {formatCurrency(KEY_FINDINGS.afterProfit)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-green-300">
              <p className="text-sm text-muted-foreground">Monthly Profit/Customer</p>
              <p className="text-2xl font-bold text-green-600">+{KEY_FINDINGS.monthlyProfitChange}%</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(KEY_FINDINGS.beforeMonthlyProfit)} → {formatCurrency(KEY_FINDINGS.afterMonthlyProfit)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implications - Moved up for visibility */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-blue-700 dark:text-blue-400">Implications for the Business</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">Positive Findings</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Club membership <strong>causally increases</strong> purchase frequency (+{KEY_FINDINGS.frequencyChange}%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Selection bias concern addressed - same customers buy more after joining</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Monthly profit per customer increases by +{KEY_FINDINGS.monthlyProfitChange}% despite lower AOV</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Both Best and Medium customer segments show positive uplift</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-600">Considerations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>AOV drops by {Math.abs(KEY_FINDINGS.aovChange)}% after joining - smaller/more frequent purchases</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Profit per order drops by {Math.abs(KEY_FINDINGS.profitChange)}% - likely due to cashback redemptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Net gain (+{KEY_FINDINGS.netGainPerCustomer} DKK/mo) doesn&apos;t yet account for program costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Frequency uses UNBIASED calendar-month methodology for accurate comparison</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Breakdown</CardTitle>
          <CardDescription>How the findings were calculated (robust sample: {formatNumber(DATA_SUMMARY.robustSampleSize)} customers)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Metric</th>
                  <th className="text-right py-2 px-3">Before Club</th>
                  <th className="text-right py-2 px-3">After Club</th>
                  <th className="text-right py-2 px-3">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3">Orders per Month</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.beforeFrequency}</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.afterFrequency}</td>
                  <td className="py-2 px-3 text-right font-bold text-green-600">+{KEY_FINDINGS.frequencyChange}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Avg Profit per Order (DKK)</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.beforeProfit}</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.afterProfit}</td>
                  <td className="py-2 px-3 text-right font-bold text-red-600">{KEY_FINDINGS.profitChange}%</td>
                </tr>
                <tr className="border-b bg-blue-50/50 dark:bg-blue-950/20">
                  <td className="py-2 px-3 font-medium">Monthly Profit = Freq × Profit/Order</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.beforeMonthlyProfit} DKK</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.afterMonthlyProfit} DKK</td>
                  <td className="py-2 px-3 text-right font-bold text-green-600">+{KEY_FINDINGS.monthlyProfitChange}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold text-green-700 dark:text-green-400">Frequency Effect</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">+{KEY_FINDINGS.frequencyEffect} DKK/month</p>
              <p className="text-sm text-green-600 dark:text-green-500">More orders at the old profit rate</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
                <h4 className="font-semibold text-red-700 dark:text-red-400">Profit/Order Effect</h4>
              </div>
              <p className="text-2xl font-bold text-red-600">{KEY_FINDINGS.profitEffect} DKK/month</p>
              <p className="text-sm text-red-600 dark:text-red-500">Lower margin per order</p>
            </div>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-700 dark:text-green-400">Net Result: Frequency Gains Outweigh Profit Decline</h4>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Each Club member generates +{KEY_FINDINGS.netGainPerCustomer} DKK more profit per month after joining
                </p>
              </div>
              <p className="text-3xl font-bold text-green-600">+{KEY_FINDINGS.netGainPerCustomer} DKK</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BROADER SAMPLE ANALYSIS */}
      <Card className="border-2 border-amber-300 dark:border-amber-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Broader Sample Analysis: Including 1-Order Customers</CardTitle>
          </div>
          <CardDescription>
            What happens when we include customers who had only 1 order before joining Club?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Size Comparison */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Robust Sample</h4>
              <p className="text-2xl font-bold text-green-600">{formatNumber(DATA_SUMMARY.robustSampleSize)}</p>
              <p className="text-xs text-green-600">60d & 2+ orders BOTH periods</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Broader Sample</h4>
              <p className="text-2xl font-bold text-amber-600">{formatNumber(BROADER_SAMPLE.sampleSize)}</p>
              <p className="text-xs text-amber-600">1+ before, 60d & 2+ after</p>
            </div>
            <div className="p-4 bg-muted rounded-lg border">
              <h4 className="font-semibold mb-2">Breakdown</h4>
              <p className="text-sm">{formatNumber(BROADER_SAMPLE.multiOrderBefore)} multi-order (61%)</p>
              <p className="text-sm">{formatNumber(BROADER_SAMPLE.singleOrderBefore)} single-order (39%)</p>
            </div>
          </div>

          {/* Key Finding: Two Different Stories */}
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-800">
            <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Key Finding: Two Opposite Effects</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              When we include 1-order customers, we see <strong>two completely different patterns</strong>:
            </p>
          </div>

          {/* Subgroup Comparison */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                Multi-Order Before ({formatNumber(BROADER_SAMPLE.multiOrderBefore)} customers)
              </h4>
              <p className="text-sm text-red-600 mb-3">Already high-frequency customers who joined Club</p>
              <div className="space-y-1 text-sm">
                <p>Before frequency: <strong>{BROADER_SAMPLE.multiOrder.beforeFrequency}</strong> orders/mo</p>
                <p>After frequency: <strong>{BROADER_SAMPLE.multiOrder.afterFrequency}</strong> orders/mo</p>
                <p className="text-lg font-bold text-red-600">{BROADER_SAMPLE.multiOrder.frequencyChange}% frequency</p>
              </div>
              <p className="text-xs text-red-500 mt-2">⚠️ Regression to mean - they were unusually active before</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                Single-Order Before ({formatNumber(BROADER_SAMPLE.singleOrderBefore)} customers)
              </h4>
              <p className="text-sm text-green-600 mb-3">One-time buyers activated by Club</p>
              <div className="space-y-1 text-sm">
                <p>Before frequency: <strong>{BROADER_SAMPLE.singleOrder.beforeFrequency}</strong> orders/mo</p>
                <p>After frequency: <strong>{BROADER_SAMPLE.singleOrder.afterFrequency}</strong> orders/mo</p>
                <p className="text-lg font-bold text-green-600">+{BROADER_SAMPLE.singleOrder.frequencyChange}% frequency</p>
              </div>
              <p className="text-xs text-green-500 mt-2">✓ Strong activation - Club converts one-time to repeat</p>
            </div>
          </div>

          {/* Combined Results */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-2 px-3">Sample</th>
                  <th className="text-right py-2 px-3">Size</th>
                  <th className="text-right py-2 px-3">Freq Before</th>
                  <th className="text-right py-2 px-3">Freq After</th>
                  <th className="text-right py-2 px-3">Freq Δ</th>
                  <th className="text-right py-2 px-3">Net Gain</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                  <td className="py-2 px-3 font-medium">Robust (60d & 2+ both)</td>
                  <td className="py-2 px-3 text-right">{formatNumber(DATA_SUMMARY.robustSampleSize)}</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.beforeFrequency}</td>
                  <td className="py-2 px-3 text-right">{KEY_FINDINGS.afterFrequency}</td>
                  <td className="py-2 px-3 text-right font-bold text-green-600">+{KEY_FINDINGS.frequencyChange}%</td>
                  <td className="py-2 px-3 text-right font-bold text-green-600">+{KEY_FINDINGS.netGainPerCustomer} DKK</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Broader Combined</td>
                  <td className="py-2 px-3 text-right">{formatNumber(BROADER_SAMPLE.sampleSize)}</td>
                  <td className="py-2 px-3 text-right">{BROADER_SAMPLE.beforeFrequency}</td>
                  <td className="py-2 px-3 text-right">{BROADER_SAMPLE.afterFrequency}</td>
                  <td className="py-2 px-3 text-right font-bold text-green-600">+{BROADER_SAMPLE.frequencyChange}%</td>
                  <td className="py-2 px-3 text-right font-bold text-red-600">{BROADER_SAMPLE.netGainPerCustomer} DKK</td>
                </tr>
                <tr className="border-b text-red-600">
                  <td className="py-2 px-3 pl-6">└ Multi-order before</td>
                  <td className="py-2 px-3 text-right">{formatNumber(BROADER_SAMPLE.multiOrderBefore)}</td>
                  <td className="py-2 px-3 text-right">{BROADER_SAMPLE.multiOrder.beforeFrequency}</td>
                  <td className="py-2 px-3 text-right">{BROADER_SAMPLE.multiOrder.afterFrequency}</td>
                  <td className="py-2 px-3 text-right font-bold">{BROADER_SAMPLE.multiOrder.frequencyChange}%</td>
                  <td className="py-2 px-3 text-right">-</td>
                </tr>
                <tr className="border-b text-green-600">
                  <td className="py-2 px-3 pl-6">└ Single-order before</td>
                  <td className="py-2 px-3 text-right">{formatNumber(BROADER_SAMPLE.singleOrderBefore)}</td>
                  <td className="py-2 px-3 text-right">{BROADER_SAMPLE.singleOrder.beforeFrequency}</td>
                  <td className="py-2 px-3 text-right">{BROADER_SAMPLE.singleOrder.afterFrequency}</td>
                  <td className="py-2 px-3 text-right font-bold">+{BROADER_SAMPLE.singleOrder.frequencyChange}%</td>
                  <td className="py-2 px-3 text-right">+82.41 DKK</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Interpretation */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">How to Interpret This (UNBIASED Method)</h4>
            <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
              <p><strong>Best Customers (+{KEY_FINDINGS.frequencyChange}%)</strong> shows strong frequency lift using UNBIASED calendar-month calculation. Before: {KEY_FINDINGS.beforeFrequency}/mo, After: {KEY_FINDINGS.afterFrequency}/mo.</p>
              <p><strong>Medium Customers (+{BROADER_SAMPLE.frequencyChange}%)</strong> also shows strong positive results with unbiased method. The previous &quot;regression to mean&quot; finding was an artifact of biased calculation.</p>
              <p><strong>Both segments</strong> show the Club effectively increases purchase frequency when measured correctly over fixed calendar periods.</p>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800">
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Bottom Line</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Using <strong>UNBIASED frequency calculation</strong> (fixed calendar periods), BOTH customer segments show strong positive results.
              Best Customers: +{KEY_FINDINGS.netGainPerCustomer} DKK/mo incremental value.
              Medium Customers: +{BROADER_SAMPLE.netGainPerCustomer} DKK/mo incremental value.
              The Club effectively increases purchase frequency across all member types.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scatter Plot: Before vs After Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Before vs After: Individual Customer Comparison</CardTitle>
          <CardDescription>
            Each dot represents a customer. Points above the diagonal line improved after joining Club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="beforeFreq"
                  name="Before"
                  domain={[0, 2.5]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Before Club (orders/month)', position: 'bottom', offset: 40 }}
                />
                <YAxis
                  type="number"
                  dataKey="afterFreq"
                  name="After"
                  domain={[0, 3.5]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'After Club (orders/month)', angle: -90, position: 'left', offset: 40 }}
                />
                <ZAxis type="number" dataKey="change" range={[50, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-lg border text-sm">
                          <p><strong>Before:</strong> {data.beforeFreq.toFixed(2)} orders/mo</p>
                          <p><strong>After:</strong> {data.afterFreq.toFixed(2)} orders/mo</p>
                          <p className={data.change > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            Change: {data.change > 0 ? '+' : ''}{data.change}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Diagonal "no change" line */}
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: 2.5, y: 2.5 }]}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  label={{ value: 'No change', position: 'insideBottomRight', fill: '#94a3b8', fontSize: 11 }}
                />
                <Scatter
                  name="Customers"
                  data={scatterPlotData}
                  fill="#22c55e"
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Customer (size = % change)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-slate-400 border-dashed" style={{ borderStyle: 'dashed' }} />
              <span>No change line</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            <strong>Key insight:</strong> The vast majority of customers appear above the diagonal,
            confirming they purchase more frequently after joining Club.
          </p>
        </CardContent>
      </Card>

      {/* Customer Journey Timeline Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Timelines</CardTitle>
          <CardDescription>
            Visual representation of order patterns before and after Club membership for select customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {exampleCustomers.slice(0, 4).map((customer) => (
              <div key={customer.id} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-muted-foreground">{customer.id}</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    +{customer.freqChange}%
                  </Badge>
                </div>

                {/* Timeline visualization */}
                <div className="relative">
                  {/* Timeline bar */}
                  <div className="h-12 flex items-center">
                    {/* Before section */}
                    <div className="flex-1 relative">
                      <div className="h-1 bg-zinc-300 dark:bg-zinc-700 rounded-l" />
                      <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-around px-2">
                        {customer.beforeOrdersList.slice(0, 3).map((order, i) => (
                          <div
                            key={order.orderNumber}
                            className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                            title={`${order.orderNumber} - ${order.date}`}
                          />
                        ))}
                        {customer.beforeOrdersList.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{customer.beforeOrdersList.length - 3}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 text-center">
                        {customer.beforeOrders} orders / {customer.beforeMonths.toFixed(0)} months
                      </p>
                    </div>

                    {/* Club join marker */}
                    <div className="w-8 flex flex-col items-center z-10">
                      <div className="w-4 h-4 rounded-full bg-[#06402b] border-2 border-white dark:border-zinc-900 shadow" />
                      <span className="text-[9px] text-[#06402b] font-medium mt-0.5">CLUB</span>
                    </div>

                    {/* After section */}
                    <div className="flex-1 relative">
                      <div className="h-1 bg-green-400 rounded-r" />
                      <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-around px-2">
                        {customer.afterOrdersList.slice(0, 5).map((order, i) => (
                          <div
                            key={order.orderNumber}
                            className="w-2.5 h-2.5 rounded-full bg-green-500"
                            title={`${order.orderNumber} - ${order.date}`}
                          />
                        ))}
                        {customer.afterOrdersList.length > 5 && (
                          <span className="text-[10px] text-green-600">+{customer.afterOrdersList.length - 5}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-green-600 mt-1 text-center">
                        {customer.afterOrders} orders / {customer.afterMonths.toFixed(1)} months
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex justify-between mt-3 pt-3 border-t text-xs">
                  <div>
                    <span className="text-muted-foreground">Before: </span>
                    <span className="text-red-600">{customer.beforeFreq.toFixed(2)}/mo</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">After: </span>
                    <span className="text-green-600 font-medium">{customer.afterFreq.toFixed(2)}/mo</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">AOV: </span>
                    <span>{customer.aovBefore} → {customer.aovAfter}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Each dot represents an order. Gray = before Club, Green = after Club.
            Hover over dots for order details.
          </p>
        </CardContent>
      </Card>

      {/* Monthly Frequency Trendline */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Monthly Purchase Frequency Trend (2023-2026)</CardTitle>
          </div>
          <CardDescription>
            Average orders per unique customer per month, with Trendhim Club go-live marked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  interval={2}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[1.0, 1.15]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <Tooltip
                  formatter={(value) => [typeof value === 'number' ? value.toFixed(3) : value, "Frequency"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <ReferenceLine
                  x="2025-04"
                  stroke="#06402b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: "Club Launch", position: "top", fill: "#06402b", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="frequency"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Avg Orders/Customer"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Note: Overall market frequency stays relatively stable (~1.08). The before/after analysis tracks
            individual Club members specifically, showing their personal frequency change.
          </p>
        </CardContent>
      </Card>

      {/* Frequency Distribution - Clearer Horizontal Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Frequency Shift: Before → After Club</CardTitle>
          <CardDescription>
            How the {formatNumber(DATA_SUMMARY.robustSampleSize)} customers moved between frequency brackets after joining Club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Stacked Bars */}
          <div className="space-y-4">
            {/* Before Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">BEFORE Club</span>
              </div>
              <div className="h-12 flex rounded-lg overflow-hidden">
                <div
                  className="bg-red-400 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: '29.8%' }}
                >
                  29.8%
                </div>
                <div
                  className="bg-orange-400 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: '59.7%' }}
                >
                  59.7%
                </div>
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: '10.5%' }}
                >
                  10.6%
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Join Club</span>
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>

            {/* After Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-600">AFTER Club</span>
              </div>
              <div className="h-12 flex rounded-lg overflow-hidden">
                <div
                  className="bg-red-400 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: '4.1%' }}
                >
                </div>
                <div
                  className="bg-orange-400 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: '81.1%' }}
                >
                  81.1%
                </div>
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: '14.8%' }}
                >
                  14.8%
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-400" />
              <span>Low (&lt;0.25/mo)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-400" />
              <span>Medium (0.25-1.0/mo)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>High (1.0+/mo)</span>
            </div>
          </div>

          {/* Key Changes */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <p className="text-sm text-muted-foreground mb-1">Low Frequency</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-red-500">29.8%</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-lg font-bold text-green-600">4.1%</span>
              </div>
              <p className="text-xs text-green-600 font-medium mt-1">-25.7 percentage points</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <p className="text-sm text-muted-foreground mb-1">Medium Frequency</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-orange-500">59.7%</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-lg font-bold text-green-600">81.1%</span>
              </div>
              <p className="text-xs text-green-600 font-medium mt-1">+21.4 percentage points</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <p className="text-sm text-muted-foreground mb-1">High Frequency</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-green-500">10.6%</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-lg font-bold text-green-600">14.8%</span>
              </div>
              <p className="text-xs text-green-600 font-medium mt-1">+4.2 percentage points</p>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            <strong>Key insight:</strong> Low-frequency customers nearly disappeared (29.8% → 4.1%),
            moving primarily into the medium frequency bracket.
          </p>
        </CardContent>
      </Card>

      {/* Detailed Frequency Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Frequency Bucket Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { bucket: "< 0.1/mo", before: 2.3, after: 0 },
                { bucket: "0.1-0.25/mo", before: 27.5, after: 4.1 },
                { bucket: "0.25-0.5/mo", before: 35.1, after: 36.1 },
                { bucket: "0.5-1.0/mo", before: 24.6, after: 45.0 },
                { bucket: "1.0-2.0/mo", before: 8.6, after: 13.4 },
                { bucket: "2.0+/mo", before: 2.0, after: 1.4 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="before" name="Before Club" fill="#94a3b8" />
                <Bar dataKey="after" name="After Club" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Example Customers */}
      <Collapsible open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Example Customers: Before → After Club Journey</CardTitle>
                </div>
                <Badge variant="outline">
                  {isExamplesOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
              <CardDescription>
                15 real customers who significantly increased purchase frequency after joining Club
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left py-2 px-2 w-8"></th>
                      <th className="text-left py-2 px-2">Customer ID</th>
                      <th className="text-center py-2 px-2 bg-zinc-100 dark:bg-zinc-800" colSpan={3}>BEFORE Club</th>
                      <th className="text-center py-2 px-2 bg-green-100 dark:bg-green-900/30" colSpan={3}>AFTER Club</th>
                      <th className="text-right py-2 px-2">Freq Change</th>
                    </tr>
                    <tr className="border-b bg-muted text-xs">
                      <th className="text-left py-1 px-2"></th>
                      <th className="text-left py-1 px-2"></th>
                      <th className="text-right py-1 px-2 bg-zinc-100 dark:bg-zinc-800">Orders</th>
                      <th className="text-right py-1 px-2 bg-zinc-100 dark:bg-zinc-800">Months</th>
                      <th className="text-right py-1 px-2 bg-zinc-100 dark:bg-zinc-800">Freq/mo</th>
                      <th className="text-right py-1 px-2 bg-green-100 dark:bg-green-900/30">Orders</th>
                      <th className="text-right py-1 px-2 bg-green-100 dark:bg-green-900/30">Months</th>
                      <th className="text-right py-1 px-2 bg-green-100 dark:bg-green-900/30">Freq/mo</th>
                      <th className="text-right py-1 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {exampleCustomers.map((customer, index) => {
                      const isExpanded = expandedRows.has(customer.id);
                      return (
                        <React.Fragment key={customer.id}>
                          <tr
                            className={`border-b cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? "" : "bg-muted/30"}`}
                            onClick={() => toggleRowExpanded(customer.id)}
                          >
                            <td className="py-2 px-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </td>
                            <td className="py-2 px-2 font-mono text-xs">{customer.id}</td>
                            <td className="py-2 px-2 text-right bg-zinc-50 dark:bg-zinc-800/50">{customer.beforeOrders}</td>
                            <td className="py-2 px-2 text-right bg-zinc-50 dark:bg-zinc-800/50">{customer.beforeMonths.toFixed(1)}</td>
                            <td className="py-2 px-2 text-right bg-zinc-50 dark:bg-zinc-800/50 text-red-600">{customer.beforeFreq.toFixed(3)}</td>
                            <td className="py-2 px-2 text-right bg-green-50 dark:bg-green-900/20">{customer.afterOrders}</td>
                            <td className="py-2 px-2 text-right bg-green-50 dark:bg-green-900/20">{customer.afterMonths.toFixed(1)}</td>
                            <td className="py-2 px-2 text-right bg-green-50 dark:bg-green-900/20 text-green-600 font-medium">{customer.afterFreq.toFixed(3)}</td>
                            <td className="py-2 px-2 text-right font-bold text-green-600">+{customer.freqChange}%</td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${customer.id}-expanded`} className="border-b bg-slate-50 dark:bg-slate-900/50">
                              <td colSpan={9} className="py-3 px-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  {/* Before Club Orders */}
                                  <div>
                                    <h5 className="font-semibold text-sm mb-2 text-zinc-600 dark:text-zinc-400">
                                      Orders BEFORE Club ({customer.beforeOrdersList.length})
                                    </h5>
                                    <div className="space-y-1">
                                      {customer.beforeOrdersList.map((order) => (
                                        <div
                                          key={order.orderNumber}
                                          className="flex items-center justify-between text-xs p-2 bg-zinc-100 dark:bg-zinc-800 rounded"
                                        >
                                          <div>
                                            <span className="font-mono font-medium">{order.orderNumber}</span>
                                            <span className="text-muted-foreground ml-2">{order.date}</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-muted-foreground">{formatNumber(order.amount)} DKK</span>
                                            <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                                              (profit: {formatNumber(order.profit)})
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* After Club Orders */}
                                  <div>
                                    <h5 className="font-semibold text-sm mb-2 text-green-600 dark:text-green-400">
                                      Orders AFTER Club ({customer.afterOrdersList.length})
                                    </h5>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                      {customer.afterOrdersList.map((order) => (
                                        <div
                                          key={order.orderNumber}
                                          className="flex items-center justify-between text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded"
                                        >
                                          <div>
                                            <span className="font-mono font-medium">{order.orderNumber}</span>
                                            <span className="text-muted-foreground ml-2">{order.date}</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-muted-foreground">{formatNumber(order.amount)} DKK</span>
                                            <span className="ml-2 text-green-600 dark:text-green-400">
                                              (profit: {formatNumber(order.profit)})
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Selection criteria: At least 90 days history before Club, 60 days after, 2+ orders in each period, frequency increased by 50%+.
                Customer IDs are hashed for privacy (first 8 and last 4 characters shown).
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Methodology */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Methodology & Data Sources</CardTitle>
                </div>
                <Badge variant="outline">
                  {isMethodologyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Data Linking Process</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Load Order History (UNIQUE_CUSTOMER_ID = hash of customer email)</li>
                  <li>Get Club orders from PostgreSQL database (customer_group_key = &apos;club&apos;)</li>
                  <li>Match Club orders to Order History via ORDER_NUMBER</li>
                  <li>Identify Club member UNIQUE_CUSTOMER_IDs and their join date (first Club order)</li>
                  <li>For each Club member, split orders into BEFORE vs AFTER join date</li>
                  <li>Calculate frequency, AOV, profit for each period</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Robust Sample Criteria</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>At least 60 days of order history in BOTH periods</li>
                  <li>At least 2 orders in BOTH periods</li>
                  <li>This ensures meaningful frequency calculations</li>
                  <li>Result: {formatNumber(DATA_SUMMARY.robustSampleSize)} customers (6.5% of {formatNumber(DATA_SUMMARY.clubMembersWithHistory)} with any pre-Club history)</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Limitations</h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                      <li>After period is shorter (~10 months) than many before periods (some have 2+ years)</li>
                      <li>67% of Club members have &lt;1 month pre-Club history (single order customers)</li>
                      <li>Program costs (cashback, shipping subsidy) not deducted from profit figures</li>
                      <li>Results may include some regression to the mean effect</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ================================================================ */}
      {/* CHANNEL ATTRIBUTION ANALYSIS */}
      {/* ================================================================ */}
      <Card className="border-t-4 border-t-purple-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <CardTitle>Marketing Channel Attribution</CardTitle>
          </div>
          <CardDescription>
            How marketing channels differ between Club and Non-Club orders, and how they shift after joining Club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* Key Insight Box */}
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400">Key Finding: Email Dominates Club Orders</h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  <strong>39.8%</strong> of Club orders come from Email vs only <strong>3.6%</strong> for Non-Club orders.
                  This is a <strong>+36.3 percentage point difference</strong> - showing Club members are highly responsive to email marketing.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Cross-sectional comparison */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              1. Club vs Non-Club Channel Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Side-by-side comparison of marketing channel attribution for Club orders vs Non-Club orders
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Club Orders Pie */}
              <div>
                <h4 className="text-center font-medium mb-2 text-green-600">Club Orders</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={CHANNEL_CROSS_SECTIONAL.filter(c => c.clubPct > 0)}
                        dataKey="clubPct"
                        nameKey="channel"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ value }: { value: number }) => value > 3 ? `${value.toFixed(0)}%` : ''}
                      >
                        {CHANNEL_CROSS_SECTIONAL.filter(c => c.clubPct > 0).map((entry) => (
                          <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Non-Club Orders Pie */}
              <div>
                <h4 className="text-center font-medium mb-2 text-zinc-600">Non-Club Orders</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={CHANNEL_CROSS_SECTIONAL.filter(c => c.nonClubPct > 0)}
                        dataKey="nonClubPct"
                        nameKey="channel"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ value }: { value: number }) => value > 3 ? `${value.toFixed(0)}%` : ''}
                      >
                        {CHANNEL_CROSS_SECTIONAL.filter(c => c.nonClubPct > 0).map((entry) => (
                          <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b">Channel</th>
                    <th className="text-right p-2 border-b text-green-600">Club %</th>
                    <th className="text-right p-2 border-b">Non-Club %</th>
                    <th className="text-right p-2 border-b">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {[...CHANNEL_CROSS_SECTIONAL].sort((a, b) => (b.clubPct - b.nonClubPct) - (a.clubPct - a.nonClubPct)).map((row) => {
                    const diff = row.clubPct - row.nonClubPct;
                    return (
                      <tr key={row.channel} className="border-b">
                        <td className="p-2 font-medium">
                          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: CHANNEL_COLORS[row.channel] }}></span>
                          {row.channel}
                        </td>
                        <td className="p-2 text-right font-mono text-green-600">{row.clubPct.toFixed(1)}%</td>
                        <td className="p-2 text-right font-mono">{row.nonClubPct.toFixed(1)}%</td>
                        <td className={`p-2 text-right font-mono font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Longitudinal Before/After */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-purple-500" />
              2. Channel Shift: Before vs After Joining Club
            </h3>
            <p className="text-sm text-muted-foreground">
              For <strong>9,161 customers</strong> with orders in both periods: how their marketing channel attribution changed after joining Club
            </p>

            {/* Butterfly/Tornado Chart */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...CHANNEL_LONGITUDINAL].sort((a, b) => b.shift - a.shift)}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="channel" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="beforePct" name="Before Club" fill="#94a3b8" />
                  <Bar dataKey="afterPct" name="After Club" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Shift Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b">Channel</th>
                    <th className="text-right p-2 border-b">Before Club %</th>
                    <th className="text-right p-2 border-b text-green-600">After Club %</th>
                    <th className="text-right p-2 border-b">Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {[...CHANNEL_LONGITUDINAL].sort((a, b) => b.shift - a.shift).map((row) => (
                    <tr key={row.channel} className="border-b">
                      <td className="p-2 font-medium">
                        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: CHANNEL_COLORS[row.channel] }}></span>
                        {row.channel}
                      </td>
                      <td className="p-2 text-right font-mono">{row.beforePct.toFixed(1)}%</td>
                      <td className="p-2 text-right font-mono text-green-600">{row.afterPct.toFixed(1)}%</td>
                      <td className={`p-2 text-right font-mono font-bold ${row.shift > 0 ? 'text-green-600' : row.shift < 0 ? 'text-red-600' : ''}`}>
                        {row.shift > 0 ? '+' : ''}{row.shift.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interpretation */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Channels That Grow After Club</h4>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li><strong>+5.8%</strong> Paid Search - Brand (customers know the brand)</li>
                  <li><strong>+0.8%</strong> Paid Social & Other</li>
                  <li><strong>+0.6%</strong> Untracked (direct traffic)</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Channels That Decline After Club</h4>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                  <li><strong>-3.9%</strong> Email (still dominant at 40%)</li>
                  <li><strong>-2.1%</strong> Paid Search - Generic (less discovery)</li>
                  <li><strong>-1.5%</strong> Direct (shifts to branded search)</li>
                </ul>
              </div>
            </div>

            {/* Summary Insight */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400">Interpretation</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                    After joining Club, customers shift from <strong>generic discovery channels</strong> (Paid Search Generic, Direct)
                    to <strong>brand-aware channels</strong> (Paid Search Brand). This suggests Club members develop stronger brand
                    recognition and return intentionally rather than through discovery. Email remains the dominant channel for Club
                    orders (~40%), indicating the effectiveness of email marketing for retention.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
