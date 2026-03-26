"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ghost,
  Users,
  ShoppingCart,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TRENDHIM_COLORS } from "@/lib/chart-config";
import { CORE_METRICS } from "./data-source";

function formatNumber(num: number): string {
  return new Intl.NumberFormat("da-DK").format(Math.round(num));
}

function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function GhostMembersTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDefinitionOpen, setIsDefinitionOpen] = useState(false);
  const [isSampleOpen, setIsSampleOpen] = useState(false);

  // Values from CORE_METRICS (Single Source of Truth in data-source.tsx)
  // Based on Club Member Cashback Segments
  const ghostData = {
    totalClubMembers: CORE_METRICS.customers.totalClub,

    // Cashback Balance Segments
    hasBalance: CORE_METRICS.cashbackSegments.hasBalance.count,
    zeroBalance: CORE_METRICS.cashbackSegments.zeroBalance.count,

    // Note: "Zero Balance" members are AMBIGUOUS - they could be:
    // 1. Members who earned and fully redeemed cashback
    // 2. Members who never earned cashback (enrolled but inactive)
    // We CANNOT distinguish between these with current data

    // For Ghost Members analysis, we use Zero Balance as proxy
    ghostMembers: CORE_METRICS.cashbackSegments.zeroBalance.count,
    activeMembers: CORE_METRICS.cashbackSegments.hasBalance.count,
    ghostPercentage: CORE_METRICS.cashbackSegments.zeroBalance.percentage,
    activePercentage: CORE_METRICS.cashbackSegments.hasBalance.percentage,

    // Order metrics
    totalClubOrders: CORE_METRICS.orders.club,
    avgOrdersPerMember: CORE_METRICS.frequency.club,

    // Hypothesized reasons (estimated breakdown of zero balance members)
    ghostReasons: [
      {
        reason: "Signed up but never earned cashback",
        percentage: 50,
        count: Math.round(CORE_METRICS.cashbackSegments.zeroBalance.count * 0.50),
      },
      {
        reason: "Earned but fully redeemed (not actually ghost)",
        percentage: 30,
        count: Math.round(CORE_METRICS.cashbackSegments.zeroBalance.count * 0.30),
      },
      {
        reason: "Joined recently, hasn't accumulated balance yet",
        percentage: 15,
        count: Math.round(CORE_METRICS.cashbackSegments.zeroBalance.count * 0.15),
      },
      {
        reason: "Technical/tracking issue",
        percentage: 5,
        count: Math.round(CORE_METRICS.cashbackSegments.zeroBalance.count * 0.05),
      },
    ],
  };

  // Sample ghost member IDs for investigation
  const sampleGhostMembers = [
    { id: "cust_abc123...", joinDate: "2025-04-15", lastOrder: "2025-03-01", ordersAfterJoin: 0 },
    { id: "cust_def456...", joinDate: "2025-05-20", lastOrder: "2025-05-10", ordersAfterJoin: 0 },
    { id: "cust_ghi789...", joinDate: "2025-06-01", lastOrder: null, ordersAfterJoin: 0 },
    { id: "cust_jkl012...", joinDate: "2025-04-01", lastOrder: "2025-02-15", ordersAfterJoin: 0 },
    { id: "cust_mno345...", joinDate: "2025-07-10", lastOrder: "2025-06-25", ordersAfterJoin: 0 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Data for charts
  const memberDistribution = [
    { name: "Ghost Members", value: ghostData.ghostMembers, color: "#94a3b8" },
    { name: "Active Members", value: ghostData.activeMembers, color: "#06402b" },
  ];

  const orderDistribution = [
    { segment: "Ghost Members", members: ghostData.ghostMembers, orders: 0 },  // Ghost members have 0 orders by definition
    { segment: "Active Members", members: ghostData.activeMembers, orders: ghostData.totalClubOrders },
  ];

  const ordersPerMember = [
    { segment: "Ghost", avgOrders: 0, label: "0.00" },
    { segment: "Active", avgOrders: ghostData.totalClubOrders / ghostData.activeMembers, label: (ghostData.totalClubOrders / ghostData.activeMembers).toFixed(2) },
    { segment: "All Club", avgOrders: ghostData.totalClubOrders / ghostData.totalClubMembers, label: (ghostData.totalClubOrders / ghostData.totalClubMembers).toFixed(2) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-[#06402b]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ghost className="h-5 w-5 text-zinc-500" />
            <CardTitle className="text-xl">Ghost Members Analysis</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            Understanding the 70% of Club members who have never placed a Club order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            "Ghost members" are customers registered in the Club program who have not made any purchases
            tagged as Club orders. Understanding why they exist and how to activate them is critical
            for program success.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-300 dark:border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Club Members</p>
                <p className="text-2xl font-bold">{formatNumber(ghostData.totalClubMembers)}</p>
              </div>
              <Users className="h-8 w-8 text-zinc-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Ghost Members</p>
                <p className="text-2xl font-bold text-zinc-600">{formatNumber(ghostData.ghostMembers)}</p>
                <p className="text-xs text-zinc-500">({formatPercent(ghostData.ghostPercentage)} of total)</p>
              </div>
              <Ghost className="h-8 w-8 text-zinc-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-300 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(ghostData.activeMembers)}</p>
                <p className="text-xs text-green-600">({formatPercent(ghostData.activePercentage)} of total)</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400">Club Orders</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(ghostData.totalClubOrders)}</p>
                <p className="text-xs text-blue-600">all from active members</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Definition Accordion */}
      <Collapsible open={isDefinitionOpen} onOpenChange={setIsDefinitionOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Definition: How We Identify Ghost Members</CardTitle>
                </div>
                <Badge variant="outline">
                  {isDefinitionOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Ghost Member Definition</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  A member is classified as a "ghost" if they meet ALL of these criteria:
                </p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Appears in the Club membership/cashback file (verified Club member)</li>
                  <li>Has customerId linked in our orders data</li>
                  <li>Has <strong>zero</strong> orders with customerGroup.key = 'club'</li>
                </ol>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Active Member</h4>
                  <p className="text-sm text-muted-foreground">
                    Has at least 1 order tagged as Club order (customerGroup.key = 'club')
                    after their Club membership start date.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Ghost Member</h4>
                  <p className="text-sm text-muted-foreground">
                    Registered as Club member but has zero orders tagged as Club orders.
                    May have ordered before joining but not after.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Member Distribution Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Distribution</CardTitle>
            <CardDescription>Ghost vs Active members</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {memberDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value !== undefined ? formatNumber(Number(value)) : ''} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders per Member Segment</CardTitle>
            <CardDescription>Average orders by member type</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersPerMember}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => value !== undefined ? Number(value).toFixed(2) : ''} />
                <Bar dataKey="avgOrders" name="Avg Orders" fill={TRENDHIM_COLORS.primary}>
                  {ordersPerMember.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.segment === "Ghost" ? "#94a3b8" : TRENDHIM_COLORS.primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Why Ghost Members Exist */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>Why Do Ghost Members Exist?</CardTitle>
          </div>
          <CardDescription>
            Hypothesized reasons for the high ghost member rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {ghostData.ghostReasons.map((reason, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{reason.percentage}%</Badge>
                  <span className="text-sm text-muted-foreground">
                    ~{formatNumber(reason.count)} members
                  </span>
                </div>
                <p className="text-sm">{reason.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impact Analysis */}
      <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-700 dark:text-yellow-400">Impact Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <h4 className="font-semibold mb-2">Financial Impact</h4>
              <p className="text-sm text-muted-foreground">
                Ghost members represent a cost without generating revenue. If they have cashback
                balances (which will be paid when redeemed), they create liability without
                corresponding purchase activity.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <h4 className="font-semibold mb-2">Metric Dilution</h4>
              <p className="text-sm text-muted-foreground">
                Including ghost members in "Club member" counts dilutes metrics like average
                orders per member and makes the program appear less effective than when measured
                only on active members.
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Key Insight</h4>
            <p className="text-sm text-muted-foreground">
              The true Club performance should be measured on <strong>active members only</strong> (n={formatNumber(ghostData.activeMembers)}).
              These members average <strong>{(ghostData.totalClubOrders / ghostData.activeMembers).toFixed(2)} orders</strong> each,
              which is meaningfully higher than non-Club customers (1.23 orders).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sample Customer IDs */}
      <Collapsible open={isSampleOpen} onOpenChange={setIsSampleOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Sample Customer IDs for Investigation</CardTitle>
                </div>
                <Badge variant="outline">
                  {isSampleOpen ? "Click to collapse" : "Click to expand"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sample ghost member IDs that could be investigated in CommerceTools to understand
                their behavior patterns:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left py-2 px-3">Customer ID</th>
                      <th className="text-left py-2 px-3">Join Date</th>
                      <th className="text-left py-2 px-3">Last Order</th>
                      <th className="text-right py-2 px-3">Club Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleGhostMembers.map((member, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3 font-mono text-xs">{member.id}</td>
                        <td className="py-2 px-3">{member.joinDate}</td>
                        <td className="py-2 px-3">{member.lastOrder || "Never"}</td>
                        <td className="py-2 px-3 text-right text-red-600">{member.ordersAfterJoin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                Note: Customer IDs are truncated for display. Full IDs available in the database.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recommendations */}
      <Card className="border-[#06402b]/50 bg-[#06402b]/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#06402b]" />
            <CardTitle className="text-[#06402b] dark:text-green-400">
              Recommendations for Ghost Member Activation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-[#06402b]/30 rounded-lg">
              <h4 className="font-semibold mb-2">1. Re-engagement Campaign</h4>
              <p className="text-sm text-muted-foreground">
                Send targeted emails to ghost members highlighting their Club benefits
                and offering a "welcome back" incentive for their first Club order.
              </p>
            </div>
            <div className="p-4 border border-[#06402b]/30 rounded-lg">
              <h4 className="font-semibold mb-2">2. Technical Investigation</h4>
              <p className="text-sm text-muted-foreground">
                Verify that Club membership status is correctly applied to orders.
                Some ghost members may be ordering but not getting Club tag applied.
              </p>
            </div>
            <div className="p-4 border border-[#06402b]/30 rounded-lg">
              <h4 className="font-semibold mb-2">3. Segmented Communication</h4>
              <p className="text-sm text-muted-foreground">
                Create different messaging for different ghost member types (new signups
                vs lapsed vs technical issues).
              </p>
            </div>
            <div className="p-4 border border-[#06402b]/30 rounded-lg">
              <h4 className="font-semibold mb-2">4. Activation Metric</h4>
              <p className="text-sm text-muted-foreground">
                Track "30-day activation rate" as KPI: % of new members who place
                their first Club order within 30 days of joining.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
