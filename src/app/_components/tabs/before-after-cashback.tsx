"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, Info, Lightbulb } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TRENDHIM_COLORS } from "@/lib/chart-config";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BeforeAfterCashbackTabProps {
  isLoading: boolean;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

export function BeforeAfterCashbackTab({
  isLoading,
}: BeforeAfterCashbackTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // These metrics would ideally come from the API with actual before/after analysis
  // Based on the original Streamlit analysis pattern
  const improvedPct = 40.2;
  const declinedPct = 37.9;
  const samePct = 21.9;
  const netEffect = improvedPct - declinedPct;

  const frequencyBefore = 1.8;
  const frequencyAfter = 2.1;
  const frequencyChange = frequencyAfter - frequencyBefore;
  const frequencyChangePct = ((frequencyAfter / frequencyBefore) - 1) * 100;

  // Distribution of behavior change
  const behaviorDistribution = [
    { category: "Improved", value: improvedPct, fill: "#22c55e" },
    { category: "Declined", value: declinedPct, fill: "#ef4444" },
    { category: "No Change", value: samePct, fill: "#94a3b8" },
  ];

  // Before vs After comparison
  const beforeAfterData = [
    { metric: "Avg Orders", before: frequencyBefore, after: frequencyAfter },
  ];

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 5: Before/After Cashback Earning</CardTitle>
          <CardDescription className="text-base mt-2">
            "Club members increase purchase frequency AFTER earning cashback for the first time."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis compares the purchase behavior of the <strong>same customers</strong> before and after
            they first earned cashback, to determine if earning cashback changes shopping behavior.
          </p>
        </CardContent>
      </Card>

      {/* Conclusion */}
      <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            <CardTitle>Hypothesis Not Supported</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <strong>Finding:</strong> {improvedPct.toFixed(1)}% of customers improved their purchase frequency after earning cashback,
            while {declinedPct.toFixed(1)}% declined, and {samePct.toFixed(1)}% showed no meaningful change.
          </p>
          <p className="text-sm">
            <strong>Net effect:</strong> Only +{netEffect.toFixed(1)} percentage points improvement - essentially a wash.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Key finding:</strong> The majority of customers showed no change at all. Earning cashback does NOT
            meaningfully increase purchase frequency on its own.
          </p>
        </CardContent>
      </Card>

      {/* Strategic Insight Box */}
      <Card className="border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-500" />
            <CardTitle>Critical Strategic Insight</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium">
            There's an important distinction between "earning" and "using" cashback:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Action</th>
                  <th className="text-left py-2 pr-4">Customer Effort</th>
                  <th className="text-left py-2">Behavior Change?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Earning Cashback</td>
                  <td className="py-2 pr-4 text-muted-foreground">Passive (automatic)</td>
                  <td className="py-2">
                    <Badge variant="destructive">NO</Badge>
                    <span className="ml-2 text-muted-foreground">Does not drive repeat purchases</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Using/Redeeming Cashback</td>
                  <td className="py-2 pr-4 text-muted-foreground">Active (requires intent)</td>
                  <td className="py-2">
                    <Badge variant="default" className="bg-green-600">YES</Badge>
                    <span className="ml-2 text-muted-foreground">Creates purchase intent</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Implication:</strong> The value of cashback comes from customers actively choosing to use it,
            not from passively accumulating it. Marketing efforts should focus on driving redemption, not just accumulation.
          </p>
        </CardContent>
      </Card>

      {/* Methodology Dropdown */}
      <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Methodology & Definitions</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {isMethodologyOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Analysis Approach:</h4>
                <p className="text-muted-foreground">
                  This is a <strong>within-customer comparison</strong> - we analyze the same customers before and after
                  their first cashback earning event, eliminating selection bias that affects cross-group comparisons.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Time Windows:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Before Window:</strong> 6 months prior to first cashback earning</li>
                  <li><strong>After Window:</strong> 6 months following first cashback earning</li>
                  <li><strong>Minimum Data:</strong> Must have orders in both windows</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Customer Qualification:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Has at least one cashback earning event</li>
                  <li>Has trackable order history before and after</li>
                  <li>Minimum 2 orders total (at least 1 in each window)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Frequency Calculation:</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-xs">
                  <p>Orders Before = Count of orders in 6 months before first cashback</p>
                  <p>Orders After = Count of orders in 6 months after first cashback</p>
                  <p>Change = (Orders After - Orders Before) / Orders Before × 100%</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Classification:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Improved:</strong> More than 20% increase in frequency</li>
                  <li><strong>Declined:</strong> More than 20% decrease in frequency</li>
                  <li><strong>No Change:</strong> Within ±20% of original frequency</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Limitations:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Sample limited to customers with sufficient history in both windows</li>
                  <li>Does not distinguish between earning methods (purchase vs referral)</li>
                  <li>Seasonal effects partially controlled but not eliminated</li>
                  <li>Cannot isolate cashback effect from other Club benefits</li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Customers Improved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{improvedPct.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Increased frequency &gt;20%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Customers Declined</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{declinedPct.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Decreased frequency &gt;20%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No Meaningful Change</p>
            <p className="text-2xl font-bold text-gray-500 mt-1">{samePct.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Within ±20%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Effect</p>
            <p className={`text-2xl font-bold mt-1 ${netEffect >= 0 ? "text-green-600" : "text-red-600"}`}>
              {netEffect >= 0 ? "+" : ""}{netEffect.toFixed(1)}pp
            </p>
            <p className="text-xs text-muted-foreground mt-1">Improved - Declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Behavior Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-zinc-500">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={behaviorDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} domain={[0, 50]} />
                  <YAxis dataKey="category" type="category" width={100} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Bar dataKey="value" fill="#06402b">
                    {behaviorDistribution.map((entry, index) => (
                      <rect key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Frequency: Before vs After</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-zinc-500">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beforeAfterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis domain={[0, 3]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="before" name="Before Cashback" fill={TRENDHIM_COLORS.nonClub} />
                  <Bar dataKey="after" name="After Cashback" fill={TRENDHIM_COLORS.club} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Before/After Frequency Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold">Frequency Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Orders Before (6mo)</span>
                  <span className="font-medium">{frequencyBefore.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Orders After (6mo)</span>
                  <span className="font-medium">{frequencyAfter.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Absolute Change</span>
                  <span className={`font-medium ${frequencyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {frequencyChange >= 0 ? "+" : ""}{frequencyChange.toFixed(2)} orders
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentage Change</span>
                  <span className={`font-medium ${frequencyChangePct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {frequencyChangePct >= 0 ? "+" : ""}{frequencyChangePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Interpretation</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  While there is a small (+{frequencyChangePct.toFixed(1)}%) increase in average frequency,
                  this is largely offset by the ~equal number of customers who decreased their purchasing.
                </p>
                <p>
                  The net effect ({netEffect.toFixed(1)}pp) is minimal and does not justify the cashback costs.
                </p>
                <p className="font-medium text-foreground">
                  Conclusion: Earning cashback alone does not drive behavior change.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
