"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TRENDHIM_COLORS, formatCurrency, formatNumber } from "@/lib/chart-config";

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

interface ClubComparisonChartProps {
  data: ComparisonData | null;
  isLoading?: boolean;
}

export function ClubComparisonChart({
  data,
  isLoading,
}: ClubComparisonChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Club vs Non-Club Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex h-full items-center justify-center text-zinc-500">
            {isLoading ? "Loading..." : "No data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      metric: "Orders",
      Club: data.club.orders,
      "Non-Club": data.nonClub.orders,
    },
    {
      metric: "Avg Order Value",
      Club: data.club.avgOrderValue,
      "Non-Club": data.nonClub.avgOrderValue,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Club vs Non-Club Comparison</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="metric"
              type="category"
              tick={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
            <Bar dataKey="Club" fill={TRENDHIM_COLORS.club} />
            <Bar dataKey="Non-Club" fill={TRENDHIM_COLORS.nonClub} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
