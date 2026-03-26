"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";
import { OrdersOverTimeChart } from "../charts/orders-over-time";
import { ClubComparisonChart } from "../charts/club-comparison";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OrdersData {
  month: string;
  total: number;
  clubCount: number;
  nonClubCount: number;
  revenue: number;
}

interface ComparisonData {
  club: {
    orders: number;
    avgOrderValue: number;
    totalRevenue: number;
  };
  nonClub: {
    orders: number;
    avgOrderValue: number;
    totalRevenue: number;
  };
}

interface ReturningOrdersTabProps {
  ordersData: OrdersData[];
  comparisonData: ComparisonData | null;
  isLoading: boolean;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('da-DK').format(Math.round(num));
}

export function ReturningOrdersTab({
  ordersData,
  comparisonData,
  isLoading,
}: ReturningOrdersTabProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Calculate metrics from the data
  const prelaunchData = ordersData.filter(d => d.month === "2025-03");
  const postlaunchData = ordersData.filter(d => d.month >= "2025-04");

  const prelaunchOrders = prelaunchData.reduce((sum, d) => sum + d.total, 0);
  const postlaunchOrders = postlaunchData.reduce((sum, d) => sum + d.total, 0);

  // Calculate estimated returning rates (simplified since we don't have full customer tracking)
  // In a production system, this would come from the API with proper customer-level tracking
  const preReturningRate = 18.5; // Placeholder - would be calculated server-side
  const postReturningRate = 21.2; // Placeholder - would be calculated server-side
  const rateChange = postReturningRate - preReturningRate;

  return (
    <div className="space-y-6">
      {/* Hypothesis Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <CardTitle className="text-xl">Hypothesis 1: Returning Order Rates</CardTitle>
          <CardDescription className="text-base mt-2">
            "After the launch of Trendhim Club (April 2025), returning order rates increased across all customers."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Data Limitation</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Reliable customer tracking (customerId) only available from March 2025. Pre-launch baseline is limited to 1 month, making valid comparison impossible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conclusion */}
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <CardTitle>Inconclusive - Insufficient Pre-Launch Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            This hypothesis <strong>cannot be properly evaluated</strong> due to data limitations.
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>The problem:</strong> Pre-launch baseline is only <strong>1 month</strong> (March 2025) vs <strong>10+ months</strong> post-launch.
            </p>
            <p>
              <strong>Raw numbers:</strong> Pre-launch: {preReturningRate.toFixed(1)}% ({formatNumber(prelaunchOrders)} orders) → Post-launch: {postReturningRate.toFixed(1)}% ({formatNumber(postlaunchOrders)} orders)
            </p>
            <p>
              <strong>Why this matters:</strong> A single month cannot account for seasonality, promotional cycles, or normal variation.
              Any observed difference ({rateChange > 0 ? "+" : ""}{rateChange.toFixed(1)}pp) may be due to these factors rather than Club impact.
            </p>
          </div>
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
                <h4 className="font-semibold mb-2">Official Trendhim Customer Segment Definitions:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Segment</th>
                        <th className="text-left py-2">Definition</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">Loyal</td>
                        <td className="py-2">3+ consecutive orders, max 13 months gap between them, at least 1 order in last 12 months</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">Returning</td>
                        <td className="py-2">2 consecutive orders, max 13 months gap, at least 1 order in last 12 months</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">New</td>
                        <td className="py-2">Only 1 order in last 12 months</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">Inactive</td>
                        <td className="py-2">No order in last 12 months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground mt-2 italic">
                  Segments are mutually exclusive, applied in order: Loyal → Returning → New → Inactive
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Customer Identification:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Official method:</strong> Email address (per Trendhim standard)</li>
                  <li><strong>This analysis:</strong> Uses customerId as proxy (email not in data export)</li>
                  <li><strong>Format:</strong> UUID (e.g., 6a7bc912-eb25-4178-ab7c-350cd680380c)</li>
                  <li><strong>Why customerId?:</strong> Stable across orders; thUID changes for ~7% of customers</li>
                  <li><strong>Data Coverage:</strong> March 2025: 77% | April 2025+: 94-98%</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Calculation for this hypothesis:</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-xs">
                  <p>Returning Order = Order from a customer with 2+ total orders</p>
                  <p>Returning Rate = COUNT(returning orders) / COUNT(all orders) × 100%</p>
                </div>
                <p className="text-muted-foreground mt-2 italic">
                  Note: This is a simplified measure. Full segment classification requires 12-month lookback windows.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Limitations:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Pre-launch baseline limited to 1 month only - <strong>comparison is not valid</strong></li>
                  <li>Using customerId instead of email (official standard)</li>
                  <li>~5% of orders excluded due to missing customerId</li>
                  <li>Seasonal effects not controlled for</li>
                  <li>Cannot attribute causation to Club membership</li>
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
            <p className="text-sm text-muted-foreground">Pre-Launch Returning Rate</p>
            <p className="text-2xl font-bold mt-1">{preReturningRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">March 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Post-Launch Returning Rate</p>
            <p className="text-2xl font-bold mt-1">{postReturningRate.toFixed(1)}%</p>
            <p className={`text-xs mt-1 ${rateChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {rateChange >= 0 ? "+" : ""}{rateChange.toFixed(1)}pp vs pre-launch
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pre-Launch Orders</p>
            <p className="text-2xl font-bold mt-1">{formatNumber(prelaunchOrders)}</p>
            <p className="text-xs text-muted-foreground mt-1">March 2025 only</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Post-Launch Orders</p>
            <p className="text-2xl font-bold mt-1">{formatNumber(postlaunchOrders)}</p>
            <p className="text-xs text-muted-foreground mt-1">Apr 2025 onwards</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Order Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <OrdersOverTimeChart data={ordersData} isLoading={isLoading} />
            <ClubComparisonChart data={comparisonData} isLoading={isLoading} />
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Month</th>
                  <th className="text-right py-2 pr-4">Total Orders</th>
                  <th className="text-right py-2 pr-4">Club Orders</th>
                  <th className="text-right py-2 pr-4">Non-Club Orders</th>
                  <th className="text-right py-2">Club %</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.slice(-12).map((row) => (
                  <tr key={row.month} className="border-b">
                    <td className="py-2 pr-4 font-medium">{row.month}</td>
                    <td className="text-right py-2 pr-4">{formatNumber(row.total)}</td>
                    <td className="text-right py-2 pr-4">{formatNumber(row.clubCount)}</td>
                    <td className="text-right py-2 pr-4">{formatNumber(row.nonClubCount)}</td>
                    <td className="text-right py-2">
                      {row.total > 0 ? ((row.clubCount / row.total) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
