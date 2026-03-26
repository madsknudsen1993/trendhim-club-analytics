"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";

interface Investigation {
  id: string;
  title: string;
  priority: "critical" | "high" | "medium";
  question: string;
  whyImportant: string;
  metricsNeeded: string[];
  dataRequired: string;
  haveData: boolean;
  dataStatus: string;
  action: string;
}

export function FurtherInvestigationsTab() {
  const investigations: Investigation[] = [
    {
      id: "1",
      title: "Selection Bias & Causation",
      priority: "critical",
      question: "Are Club members valuable BECAUSE of Club membership, or were they already high-value customers who self-selected into the program?",
      whyImportant: "This is THE fundamental question. If Club members were already valuable before joining, then the higher metrics we see (AOV, frequency, profit) are not caused by the Club - they're just characteristics of customers who choose to join.",
      metricsNeeded: [
        "Pre-Club purchase history for current Club members",
        "Compare their behavior before vs after joining",
        "Statistical matching with similar non-members"
      ],
      dataRequired: "Historical purchase data for customers BEFORE they joined Club, linked by customerId or email",
      haveData: false,
      dataStatus: "customerId only tracked from March 2025. Club launched April 2025. Cannot link historical orders to current Club members.",
      action: "Request customerId backfill on historical orders via email matching from IT/Data team"
    },
    {
      id: "2",
      title: "True Incrementality",
      priority: "critical",
      question: "How many Club orders are truly incremental (wouldn't have happened without the Club)?",
      whyImportant: "Without knowing incrementality, we cannot calculate true ROI. If Club members would have purchased anyway, the program costs are not generating new value.",
      metricsNeeded: [
        "Expected purchase frequency based on pre-Club behavior",
        "Actual frequency during Club membership",
        "Difference = incremental orders"
      ],
      dataRequired: "Pre-Club baseline purchase patterns for each customer",
      haveData: false,
      dataStatus: "Same limitation as Selection Bias - no pre-Club history available.",
      action: "Same data request as above - backfill customerId on historical orders"
    },
    {
      id: "3",
      title: "Unredeemed Cashback Liability",
      priority: "high",
      question: "How much cashback is sitting unredeemed in customer accounts? What is the potential liability?",
      whyImportant: "Unredeemed cashback is a balance sheet liability. If all customers requested cash out, what would the cost be? This affects true program cost calculation.",
      metricsNeeded: [
        "Total earned cashback (all time)",
        "Total redeemed cashback (all time)",
        "Current outstanding balance"
      ],
      dataRequired: "Complete cashback transaction history (earned, redeemed, expired)",
      haveData: false,
      dataStatus: "Current data only shows current balance, not earned vs redeemed breakdown.",
      action: "Request complete cashback transaction ledger from Finance/Loyalty team"
    },
    {
      id: "4",
      title: "True Shipping Cost Impact",
      priority: "high",
      question: "What is the actual shipping cost subsidy for Club members with lower free shipping thresholds?",
      whyImportant: "Current analysis uses estimated 35 DKK average. Actual costs vary by country, weight, and carrier. This could significantly affect ROI calculation.",
      metricsNeeded: [
        "Actual shipping cost per order",
        "Orders qualifying for Club free shipping but below normal threshold",
        "Total shipping subsidy cost"
      ],
      dataRequired: "Order-level shipping cost data by country and weight class",
      haveData: false,
      dataStatus: "Using estimated average of 35 DKK per subsidized order.",
      action: "Request actual shipping cost data from Logistics/Finance"
    },
    {
      id: "5",
      title: "Program Operational Costs",
      priority: "medium",
      question: "What are the true operational costs of running the Club program?",
      whyImportant: "Current analysis only includes cashback and shipping. Missing: staff time, technology, marketing, customer support for Club-related issues.",
      metricsNeeded: [
        "Staff hours dedicated to Club operations",
        "Technology/platform costs",
        "Club-specific marketing spend",
        "Customer support volume for Club issues"
      ],
      dataRequired: "Internal cost allocation from Finance/Operations",
      haveData: false,
      dataStatus: "Not included in current analysis.",
      action: "Work with Finance to allocate operational costs to Club program"
    },
    {
      id: "6",
      title: "Long-term Retention",
      priority: "medium",
      question: "Do early Club members stay engaged over time, or do they churn?",
      whyImportant: "Loyalty programs should drive long-term retention. With only 10 months of data, we can't assess if the Club creates lasting loyalty or just initial engagement.",
      metricsNeeded: [
        "12-month retention rate by join cohort",
        "Order frequency over time since joining",
        "Churn rate comparison vs non-members"
      ],
      dataRequired: "At least 12-24 months of Club membership data",
      haveData: false,
      dataStatus: "Only 10 months since launch. Need more time.",
      action: "Re-run analysis in 6-12 months with longer cohort data"
    }
  ];

  const criticalInvestigations = investigations.filter(i => i.priority === "critical");
  const highInvestigations = investigations.filter(i => i.priority === "high");
  const mediumInvestigations = investigations.filter(i => i.priority === "medium");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-500" />
            <CardTitle>Further Investigation Needed</CardTitle>
          </div>
          <CardDescription>
            Data gaps and analyses required to reach definitive conclusions about Club program effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The current analysis has limitations due to missing data. These investigations identify what we <strong>cannot</strong> currently
            analyze and what data would be needed to address key questions.
          </p>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">What We Know</h3>
            </div>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>• Club AOV higher than non-Club</li>
              <li>• Club loyalty rate higher</li>
              <li>• Club profit per order higher</li>
              <li>• Total cashback cost: ~6.9M DKK</li>
              <li>• Program currently not profitable</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">What We Don't Know</h3>
            </div>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              <li>• True shipping cost subsidy</li>
              <li>• Customer acquisition cost for Club</li>
              <li>• Unredeemed cashback liability</li>
              <li>• Long-term retention (need more time)</li>
              <li>• Operational program costs</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">BLOCKED Analyses</h3>
            </div>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              <li>• Selection bias analysis</li>
              <li>• True incrementality</li>
              <li>• Causation vs correlation</li>
            </ul>
            <p className="text-xs text-red-600 dark:text-red-500 mt-2 italic">
              Blocked: No pre-Club customer history data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Investigations (BLOCKED) */}
      <Card className="border-red-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-600">Critical - Data Not Available</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {criticalInvestigations.map((investigation) => (
            <div key={investigation.id} className="border-l-4 border-red-500 pl-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold">{investigation.title}</h4>
                <Badge variant="destructive">BLOCKED</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium">Question:</p>
                  <p>{investigation.question}</p>
                </div>

                <div>
                  <p className="text-muted-foreground font-medium">Why Important:</p>
                  <p className="text-muted-foreground">{investigation.whyImportant}</p>
                </div>

                <div>
                  <p className="text-muted-foreground font-medium">Metrics Needed:</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {investigation.metricsNeeded.map((metric, idx) => (
                      <li key={idx}>{metric}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded">
                  <HelpCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-red-700 dark:text-red-400 font-medium text-xs">Have Data: NO</p>
                    <p className="text-red-600 dark:text-red-500 text-xs">{investigation.dataStatus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground"><strong>Action:</strong> {investigation.action}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* High Priority Investigations */}
      <Card className="border-yellow-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-yellow-600 dark:text-yellow-400">High Priority - Need More Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {highInvestigations.map((investigation) => (
            <div key={investigation.id} className="border-l-4 border-yellow-500 pl-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold">{investigation.title}</h4>
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">DATA NEEDED</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <p>{investigation.question}</p>
                <p className="text-muted-foreground text-xs">{investigation.whyImportant}</p>

                <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
                  <HelpCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-yellow-700 dark:text-yellow-400 font-medium text-xs">Status: {investigation.dataStatus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs"><strong>Action:</strong> {investigation.action}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Medium Priority Investigations */}
      <Card>
        <CardHeader>
          <CardTitle>Medium Priority - Future Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mediumInvestigations.map((investigation) => (
            <div key={investigation.id} className="border-l-4 border-gray-300 pl-4 space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold">{investigation.title}</h4>
                <Badge variant="secondary">Medium</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{investigation.question}</p>
              <p className="text-xs text-muted-foreground italic">Action: {investigation.action}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Next Steps */}
      <Card className="border-[#06402b]/50 bg-[#06402b]/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#06402b]" />
            <CardTitle className="text-[#06402b] dark:text-green-400">Recommended Next Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li className="text-muted-foreground">
              <strong>Request backfill of customerId</strong> on historical orders via email matching from IT/Data team
            </li>
            <li className="text-muted-foreground">
              <strong>Obtain actual shipping cost data</strong> from logistics/finance for accurate subsidy calculation
            </li>
            <li className="text-muted-foreground">
              <strong>Set up monthly tracking</strong> of earned vs redeemed cashback for liability monitoring
            </li>
            <li className="text-muted-foreground">
              <strong>Re-run analysis in 6 months</strong> with more data for robust long-term conclusions
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
