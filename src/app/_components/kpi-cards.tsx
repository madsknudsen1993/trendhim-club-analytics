"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/chart-config";
import { ShoppingCart, DollarSign, Users, TrendingDown } from "lucide-react";
import { CORE_METRICS } from "./tabs/data-source";

// All values from CORE_METRICS (Single Source of Truth)
export function KPICards() {
  const kpis = [
    {
      title: "Total Orders",
      value: formatNumber(CORE_METRICS.orders.total),
      subtitle: "Apr 2025 - Jan 2026",
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(CORE_METRICS.revenue.total),
      subtitle: "All markets (DKK)",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Club Orders",
      value: formatPercent(CORE_METRICS.orders.clubPercentage),
      subtitle: "of total orders",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Program ROI",
      value: `${CORE_METRICS.value.roi}%`,
      subtitle: "Not profitable",
      icon: TrendingDown,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
