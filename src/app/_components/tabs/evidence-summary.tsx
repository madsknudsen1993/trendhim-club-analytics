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
} from "lucide-react";

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

const hypothesisResults: HypothesisResult[] = [
  {
    id: "H1",
    name: "Returning Orders",
    hypothesis: "Club members have higher returning order rates",
    verdict: "INCONCLUSIVE",
    finding: "Insufficient pre-launch baseline data to measure true impact. Club members show 5.7% repeat rate, but causation cannot be established.",
    keyMetric: "Club Repeat Rate",
    keyValue: "5.7%",
    caveat: "No pre-Club baseline available",
  },
  {
    id: "H2",
    name: "Purchase Frequency",
    hypothesis: "Club members purchase more frequently than non-members",
    verdict: "SUPPORTED",
    finding: "Club members average 1.30 orders per customer vs 1.23 for non-Club, representing a 5.7% higher purchase frequency.",
    keyMetric: "Club Frequency",
    keyValue: "1.30 orders/customer",
  },
  {
    id: "H3",
    name: "Loyalty Progression",
    hypothesis: "Club membership accelerates progression through loyalty tiers",
    verdict: "PARTIALLY SUPPORTED",
    finding: "Club members have higher Loyal segment (3+ orders) rate of 7.0% vs 3.2% for non-Club. However, selection bias may explain this difference.",
    keyMetric: "Loyal Rate",
    keyValue: "7.0% vs 3.2%",
    caveat: "Selection bias possible",
  },
  {
    id: "H4",
    name: "Cashback Impact",
    hypothesis: "Cashback balances drive repeat purchases",
    verdict: "PARTIALLY SUPPORTED",
    finding: "Customers with positive cashback balance show higher repeat rates, but direction of causality is unclear - engaged customers may both earn more cashback AND purchase more.",
    keyMetric: "With Balance Repeat",
    keyValue: "+23% vs zero balance",
    caveat: "Causality unclear",
  },
  {
    id: "H5",
    name: "Before/After Cashback",
    hypothesis: "Customer behavior improves after earning cashback",
    verdict: "INCONCLUSIVE",
    finding: "Cannot establish before/after comparison - customerId only tracked from March 2025, just before Club launch.",
    keyMetric: "Data Gap",
    keyValue: "No pre-launch customerId",
    caveat: "Analysis blocked by data limitation",
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
    finding: "Club members consistently show 12-15% higher AOV across all currencies and time periods.",
    keyMetric: "AOV Difference",
    keyValue: "+12.5%",
  },
  {
    id: "H8",
    name: "Order Profit",
    hypothesis: "Club orders are more profitable per order",
    verdict: "SUPPORTED",
    finding: "Club orders average +1 DKK higher profit per order. However, this small difference does not offset program costs.",
    keyMetric: "Profit Difference",
    keyValue: "+1 DKK/order",
    caveat: "Does not offset costs",
  },
  {
    id: "H9",
    name: "Program ROI",
    hypothesis: "Incremental revenue covers program costs",
    verdict: "NOT SUPPORTED",
    finding: "Total program costs (3.44M DKK) significantly exceed incremental profit (102K DKK). Net value is -3.34M DKK with ROI of -97%.",
    keyMetric: "Program ROI",
    keyValue: "-97.0%",
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
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Positive Signals</h4>
              <ul className="space-y-1 text-sm text-green-700 dark:text-green-400">
                <li>• Club members show higher AOV (+12.5%)</li>
                <li>• Higher purchase frequency (1.30 vs 1.23)</li>
                <li>• More stable seasonal patterns</li>
                <li>• Higher profit per order (+1 DKK)</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Critical Issues</h4>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                <li>• Program ROI is -97% (costs exceed benefits)</li>
                <li>• Selection bias cannot be ruled out</li>
                <li>• No pre-launch baseline for causation</li>
                <li>• Incremental value may be overstated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Verdict */}
      <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-700 dark:text-red-400">Overall Program Verdict</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            While Club members exhibit positive behavioral indicators (higher AOV, frequency, loyalty), the
            <strong> program is not financially viable in its current form</strong>. Program costs of 3.44M DKK
            far exceed the 102K DKK in incremental profit, resulting in a net loss of 3.34M DKK.
          </p>
          <p className="text-sm text-muted-foreground">
            Additionally, the observed positive behaviors may be due to selection bias rather than program
            causation - high-value customers may self-select into the Club rather than the Club creating
            high-value behavior.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
