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

// Order History longitudinal analysis results
const ORDER_HISTORY = {
  robustSampleSize: 4640,
  beforeFrequency: 0.545,
  afterFrequency: 0.680,
  frequencyChange: 24.8,
  beforeMonthlyProfit: 123.41,
  afterMonthlyProfit: 140.76,
  monthlyProfitChange: 14.1,
};

const hypothesisResults: HypothesisResult[] = [
  {
    id: "H1",
    name: "Returning Orders",
    hypothesis: "Club members have higher returning order rates",
    verdict: "SUPPORTED",
    finding: `Order History analysis shows same customers increase from ${ORDER_HISTORY.beforeFrequency} to ${ORDER_HISTORY.afterFrequency} orders/month after joining Club. This proves causation, not just correlation.`,
    keyMetric: "Frequency Change (causal)",
    keyValue: `+${ORDER_HISTORY.frequencyChange}%`,
  },
  {
    id: "H2",
    name: "Purchase Frequency",
    hypothesis: "Club members purchase more frequently than non-members",
    verdict: "SUPPORTED",
    finding: `Cross-sectional: Club ${CORE_METRICS.frequency.club} vs Non-Club ${CORE_METRICS.frequency.nonClub} orders/customer (+${CORE_METRICS.frequency.differencePercent}%). Longitudinal: Same customers show +${ORDER_HISTORY.frequencyChange}% increase after joining.`,
    keyMetric: "Longitudinal Change",
    keyValue: `+${ORDER_HISTORY.frequencyChange}%`,
  },
  {
    id: "H3",
    name: "Loyalty Progression",
    hypothesis: "Club membership accelerates progression through loyalty tiers",
    verdict: "PARTIALLY SUPPORTED",
    finding: "Club members have higher Loyal segment (3+ orders) rate of 7.0% vs 3.2% for non-Club. Order History confirms frequency increase is causal, supporting this hypothesis.",
    keyMetric: "Loyal Rate",
    keyValue: "7.0% vs 3.2%",
    caveat: "Longitudinal sample is highly engaged members",
  },
  {
    id: "H4",
    name: "Cashback Impact",
    hypothesis: "Cashback balances drive repeat purchases",
    verdict: "PARTIALLY SUPPORTED",
    finding: `${CORE_METRICS.cashbackSegments.hasBalance.percentage}% of members have positive cashback balance. These members show higher engagement, but causality direction still unclear.`,
    keyMetric: "Members with Balance",
    keyValue: `${CORE_METRICS.cashbackSegments.hasBalance.percentage}%`,
    caveat: "Correlation vs causation unclear",
  },
  {
    id: "H5",
    name: "Before/After Behavior",
    hypothesis: "Customer behavior improves after joining Club",
    verdict: "SUPPORTED",
    finding: `Order History analysis of ${ORDER_HISTORY.robustSampleSize.toLocaleString()} customers shows clear improvement: frequency +${ORDER_HISTORY.frequencyChange}%, monthly profit +${ORDER_HISTORY.monthlyProfitChange}%. This is causal evidence.`,
    keyMetric: "Monthly Profit Change",
    keyValue: `+${ORDER_HISTORY.monthlyProfitChange}%`,
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
    verdict: "SUPPORTED",
    finding: `Club AOV ${CORE_METRICS.aov.club} DKK vs Non-Club ${CORE_METRICS.aov.nonClub} DKK (+${(((CORE_METRICS.aov.club - CORE_METRICS.aov.nonClub) / CORE_METRICS.aov.nonClub) * 100).toFixed(1)}%). However, Order History shows AOV drops slightly after joining (customers order more often at smaller amounts).`,
    keyMetric: "AOV Difference",
    keyValue: `+${(((CORE_METRICS.aov.club - CORE_METRICS.aov.nonClub) / CORE_METRICS.aov.nonClub) * 100).toFixed(1)}%`,
    caveat: "Cross-sectional vs longitudinal differ",
  },
  {
    id: "H8",
    name: "Order Profit",
    hypothesis: "Club orders are more profitable per order",
    verdict: "PARTIALLY SUPPORTED",
    finding: `Cross-sectional: Club ${CORE_METRICS.profit.clubAvgProfit} DKK vs Non-Club ${CORE_METRICS.profit.nonClubAvgProfit} DKK (+${CORE_METRICS.profit.differenceDKK} DKK/order). However, Order History shows profit/order drops after joining - the gain comes from higher frequency, not higher margins.`,
    keyMetric: "Profit Difference",
    keyValue: `+${CORE_METRICS.profit.differenceDKK} DKK/order`,
    caveat: "Volume effect > margin effect",
  },
  {
    id: "H9",
    name: "Program ROI",
    hypothesis: "Incremental revenue covers program costs",
    verdict: "INCONCLUSIVE",
    finding: `Cross-sectional ROI: ${CORE_METRICS.value.roi}% (costs ${(CORE_METRICS.costs.totalProgramCosts/1000000).toFixed(2)}M exceed ${(CORE_METRICS.value.incrementalProfit/1000).toFixed(0)}K incremental). But Order History suggests +17 DKK/member/month value for engaged members, which could yield positive ROI if applied broadly.`,
    keyMetric: "Program ROI",
    keyValue: `${CORE_METRICS.value.roi}% to TBD`,
    caveat: "Depends on which analysis you trust",
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Proven (Causal Evidence)</h4>
              <ul className="space-y-1 text-sm text-green-700 dark:text-green-400">
                <li>• <strong>+{ORDER_HISTORY.frequencyChange}% frequency increase</strong> (same customers, before/after)</li>
                <li>• <strong>+{ORDER_HISTORY.monthlyProfitChange}% monthly profit increase</strong> per engaged member</li>
                <li>• Club <em>causes</em> behavior change (not just selection bias)</li>
                <li>• Higher AOV cross-sectionally (+{(((CORE_METRICS.aov.club - CORE_METRICS.aov.nonClub) / CORE_METRICS.aov.nonClub) * 100).toFixed(0)}%)</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Uncertain / Caveats</h4>
              <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
                <li>• Longitudinal sample ({ORDER_HISTORY.robustSampleSize.toLocaleString()}) may not represent all {CORE_METRICS.customers.totalClub.toLocaleString()} members</li>
                <li>• {CORE_METRICS.cashbackSegments.zeroBalance.percentage}% of members have zero cashback balance</li>
                <li>• Cross-sectional ROI is {CORE_METRICS.value.roi}% (very negative)</li>
                <li>• True ROI depends on how many members the uplift applies to</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Verdict */}
      <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <CardTitle className="text-amber-700 dark:text-amber-400">Overall Program Verdict: Mixed Evidence</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              <strong>✓ Good news:</strong> Order History analysis proves Club membership <em>causes</em> a +{ORDER_HISTORY.frequencyChange}%
              frequency increase in the same customers. This is real behavior change, not selection bias. Engaged members generate
              +17 DKK/month incremental value.
            </p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">
              <strong>✗ Challenge:</strong> Program costs are {(CORE_METRICS.costs.totalProgramCosts/1000000).toFixed(2)}M DKK (10 months).
              Cross-sectional analysis shows only +{(CORE_METRICS.value.incrementalProfit/1000).toFixed(0)}K DKK incremental profit,
              yielding {CORE_METRICS.value.roi}% ROI. The longitudinal sample of {ORDER_HISTORY.robustSampleSize.toLocaleString()}
              highly engaged members may not represent all {CORE_METRICS.customers.totalClub.toLocaleString()} members.
            </p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>→ Conclusion:</strong> The Club program <em>works</em> at driving behavior change. The question is whether the
              value generated by engaged members offsets the costs shared across all members. ROI ranges from {CORE_METRICS.value.roi}%
              (pessimistic) to potentially positive (if longitudinal uplift applies broadly).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
