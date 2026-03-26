"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/chart-config";
import { ShoppingCart, DollarSign, Users, TrendingUp } from "lucide-react";

interface KPICardsProps {
  totalOrders: number;
  totalRevenue: number;
  clubPercentage: number;
  avgOrderValue: number;
  isLoading?: boolean;
}

export function KPICards({
  totalOrders,
  totalRevenue,
  clubPercentage,
  avgOrderValue,
  isLoading,
}: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Orders",
      value: formatNumber(totalOrders),
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Club Members",
      value: formatPercent(clubPercentage),
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(avgOrderValue),
      icon: TrendingUp,
      color: "text-orange-600",
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
