"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { CORE_METRICS } from "./data-source";

type Verdict = "SUPPORTED" | "NOT SUPPORTED" | "INCONCLUSIVE" | "PARTIALLY SUPPORTED";

interface HypothesisResult {
  id: string;
  name: string;
  hypothesis: string;
  verdict: Verdict;
  finding: string;
  keyMetric: string;
  keyValue: string;
  caveat?: string;
}

// Order History longitudinal analysis results - derived from CORE_METRICS single source of truth
const ORDER_HISTORY = {
  robustSampleSize: CORE_METRICS.orderHistory.robustSampleSize,
  beforeFrequency: CORE_METRICS.orderHistory.before.frequency,
  afterFrequency: CORE_METRICS.orderHistory.after.frequency,
  frequencyChange: CORE_METRICS.orderHistory.changes.frequencyChange,
  beforeMonthlyProfit: CORE_METRICS.orderHistory.before.monthlyProfit,
  afterMonthlyProfit: CORE_METRICS.orderHistory.after.monthlyProfit,
  monthlyProfitChange: CORE_METRICS.orderHistory.changes.monthlyProfitChange,
};

// Broader sample data
const BROADER = CORE_METRICS.orderHistory.broaderSample;
const BROADER_HISTORY = {
  sampleSize: BROADER.sampleSize,
  frequencyChange: BROADER.changes.frequencyChange,
  monthlyProfitChange: BROADER.changes.monthlyProfitChange,
  incrementalValue: BROADER.changes.incrementalMonthlyValue,
};

const hypothesisResults: HypothesisResult[] = [
  {
    id: "H1",
    name: "Returning Orders",
    hypothesis: "Club members have higher returning order rates",
    verdict: "SUPPORTED",
    finding: `Robust sample: +${ORDER_HISTORY.frequencyChange}% frequency increase. Broader sample (incl. 1-order customers): +${BROADER_HISTORY.frequencyChange}%. Both prove causation, but magnitude varies by sample definition.`,
    keyMetric: "Frequency Change",
    keyValue: `+${ORDER_HISTORY.frequencyChange}% / +${BROADER_HISTORY.frequencyChange}%`,
    caveat: "Robust vs Broader samples differ significantly",
  },
  {
    id: "H2",
    name: "Purchase Frequency",
    hypothesis: "Club members purchase more frequently than non-members",
    verdict: "SUPPORTED",
    finding: `Cross-sectional: +${CORE_METRICS.frequency.differencePercent}%. Longitudinal: Robust +${ORDER_HISTORY.frequencyChange}%, Broader +${BROADER_HISTORY.frequencyChange}%. Frequency increase is causal but varies by sample.`,
    keyMetric: "Longitudinal Range",
    keyValue: `+${BROADER_HISTORY.frequencyChange}% to +${ORDER_HISTORY.frequencyChange}%`,
    caveat: "Broader sample includes regression-to-mean",
  },
  {
    id: "H3",
    name: "Loyalty Progression",
    hypothesis: "Club membership accelerates progression through loyalty tiers",
    verdict: "PARTIALLY SUPPORTED",
    finding: "Club Loyal segment (3+ orders): 7.0% vs Non-Club 3.2%. However, broader sample shows high-frequency customers regress (-24.5%) while one-time buyers activate (+174.8%).",
    keyMetric: "Loyal Rate",
    keyValue: "7.0% vs 3.2%",
    caveat: "Mixed effects: activation vs regression",
  },
  {
    id: "H4",
    name: "Cashback Impact",
    hypothesis: "Cashback balances drive repeat purchases",
    verdict: "PARTIALLY SUPPORTED",
    finding: `${CORE_METRICS.cashbackSegments.hasBalance.percentage}% have positive balance. Broader sample shows cashback costs (-10.1% profit/order) can offset frequency gains when applied broadly.`,
    keyMetric: "Members with Balance",
    keyValue: `${CORE_METRICS.cashbackSegments.hasBalance.percentage}%`,
    caveat: "Cashback cost vs behavior benefit unclear",
  },
  {
    id: "H5",
    name: "Before/After Behavior",
    hypothesis: "Customer behavior improves after joining Club",
    verdict: "PARTIALLY SUPPORTED",
    finding: `Robust (${ORDER_HISTORY.robustSampleSize.toLocaleString()}): +${ORDER_HISTORY.monthlyProfitChange}% monthly profit. Broader (${BROADER_HISTORY.sampleSize.toLocaleString()}): ${BROADER_HISTORY.monthlyProfitChange}% monthly profit. Net value depends on sample.`,
    keyMetric: "Monthly Profit Change",
    keyValue: `+${ORDER_HISTORY.monthlyProfitChange}% / ${BROADER_HISTORY.monthlyProfitChange}%`,
    caveat: "Broader sample shows negative profit change",
  },
  {
    id: "H6",
    name: "Seasonal Patterns",
    hypothesis: "Club members show more stable seasonal patterns",
    verdict: "SUPPORTED",
    finding: "Club members demonstrate 30% less seasonal variance in purchase patterns. More consistent ordering throughout the year.",
    keyMetric: "Seasonal Variance",
    keyValue: "30% lower CV",
  },
  {
    id: "H7",
    name: "Average Order Value",
    hypothesis: "Club members have higher average order values",
    verdict: "PARTIALLY SUPPORTED",
    finding: `Cross-sectional: Club +${(((CORE_METRICS.aov.club - CORE_METRICS.aov.nonClub) / CORE_METRICS.aov.nonClub) * 100).toFixed(1)}% higher AOV. But longitudinal shows AOV drops after joining (Robust -7.6%, Broader -8.1%) as customers order more often at smaller amounts.`,
    keyMetric: "AOV Difference",
    keyValue: `+${(((CORE_METRICS.aov.club - CORE_METRICS.aov.nonClub) / CORE_METRICS.aov.nonClub) * 100).toFixed(1)}% cross / -8% long`,
    caveat: "Cross-sectional vs longitudinal differ",
  },
  {
    id: "H8",
    name: "Order Profit",
    hypothesis: "Club orders are more profitable per order",
    verdict: "NOT SUPPORTED",
    finding: `Cross-sectional: +${CORE_METRICS.profit.differenceDKK} DKK/order. Longitudinal: profit/order drops (Robust -8.6%, Broader -10.1%). The gain comes from frequency volume, not margins. Cashback erodes per-order profit.`,
    keyMetric: "Profit/Order Change",
    keyValue: `-8.6% to -10.1%`,
    caveat: "Volume wins, but margins drop",
  },
  {
    id: "H9",
    name: "Program ROI",
    hypothesis: "Incremental revenue covers program costs",
    verdict: "INCONCLUSIVE",
    finding: `Robust sample: +17.35 DKK/mo = potentially profitable. Broader sample: -7.62 DKK/mo = not profitable. True ROI lies between these scenarios depending on member mix.`,
    keyMetric: "Net Value/Member",
    keyValue: `-7.62 to +17.35 DKK/mo`,
    caveat: "Highly dependent on sample definition",
  },
];

function getVerdictBadge(verdict: Verdict) {
  switch (verdict) {
    case "SUPPORTED":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          SUPPORTED
        </Badge>
      );
    case "NOT SUPPORTED":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          NOT SUPPORTED
        </Badge>
      );
    case "INCONCLUSIVE":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
          <HelpCircle className="h-3 w-3 mr-1" />
          INCONCLUSIVE
        </Badge>
      );
    case "PARTIALLY SUPPORTED":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
          <Minus className="h-3 w-3 mr-1" />
          PARTIALLY SUPPORTED
        </Badge>
      );
  }
}

function getVerdictBorder(verdict: Verdict) {
  switch (verdict) {
    case "SUPPORTED":
      return "border-l-green-500";
    case "NOT SUPPORTED":
      return "border-l-red-500";
    case "INCONCLUSIVE":
      return "border-l-yellow-500";
    case "PARTIALLY SUPPORTED":
      return "border-l-blue-500";
  }
}

function getVerdictIcon(verdict: Verdict) {
  switch (verdict) {
    case "SUPPORTED":
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    case "NOT SUPPORTED":
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    case "INCONCLUSIVE":
      return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    case "PARTIALLY SUPPORTED":
      return <Minus className="h-5 w-5 text-blue-500" />;
  }
}

export function EvidenceSummaryTab() {
  const supported = hypothesisResults.filter(h => h.verdict === "SUPPORTED").length;
  const notSupported = hypothesisResults.filter(h => h.verdict === "NOT SUPPORTED").length;
  const inconclusive = hypothesisResults.filter(h => h.verdict === "INCONCLUSIVE").length;
  const partial = hypothesisResults.filter(h => h.verdict === "PARTIALLY SUPPORTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#06402b]" />
            <CardTitle className="text-xl">Evidence Summary</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            Consolidated results from all 9 hypotheses tested in this analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Each hypothesis was evaluated using available data from April 2025 (Club launch) through January 2026.
            Verdicts reflect the strength of evidence, accounting for data limitations and potential biases.
          </p>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Supported</p>
                <p className="text-3xl font-bold text-green-600">{supported}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Partially Supported</p>
                <p className="text-3xl font-bold text-blue-600">{partial}</p>
              </div>
              <Minus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Inconclusive</p>
                <p className="text-3xl font-bold text-yellow-600">{inconclusive}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">Not Supported</p>
                <p className="text-3xl font-bold text-red-600">{notSupported}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hypothesis Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hypothesisResults.map((h) => (
          <Card key={h.id} className={`border-l-4 ${getVerdictBorder(h.verdict)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getVerdictIcon(h.verdict)}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{h.id}</p>
                    <CardTitle className="text-base">{h.name}</CardTitle>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                {getVerdictBadge(h.verdict)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground italic">"{h.hypothesis}"</p>

              <div className="p-2 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{h.keyMetric}</span>
                  <span className="text-sm font-bold">{h.keyValue}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{h.finding}</p>

              {h.caveat && (
                <div className="flex items-start gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{h.caveat}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <CardTitle>Key Takeaways</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Robust Sample ({ORDER_HISTORY.robustSampleSize.toLocaleString()})</h4>
              <ul className="space-y-1 text-sm text-green-700 dark:text-green-400">
                <li>• <strong>+{ORDER_HISTORY.frequencyChange}% frequency</strong></li>
                <li>• <strong>+{ORDER_HISTORY.monthlyProfitChange}% monthly profit</strong></li>
                <li>• <strong>+17.35 DKK/mo</strong> net value</li>
                <li>• Highly engaged repeat customers</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">Broader Sample ({BROADER_HISTORY.sampleSize.toLocaleString()})</h4>
              <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-400">
                <li>• <strong>+{BROADER_HISTORY.frequencyChange}% frequency</strong></li>
                <li>• <strong>{BROADER_HISTORY.monthlyProfitChange}% monthly profit</strong></li>
                <li>• <strong>{BROADER_HISTORY.incrementalValue} DKK/mo</strong> net value</li>
                <li>• Includes 1-order customers + regression</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">What We Know For Certain</h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                <li>• Club <em>causes</em> frequency increase (causal)</li>
                <li>• Profit/order drops after joining (-8-10%)</li>
                <li>• High-freq customers regress (-24.5%)</li>
                <li>• One-time buyers activate (+174.8%)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
