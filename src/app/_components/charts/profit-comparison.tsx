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
  ComposedChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TRENDHIM_COLORS, formatCurrency } from "@/lib/chart-config";

interface ProfitData {
  month: string;
  revenue: number;
  profit: number;
  productCost: number;
  freightCost: number;
  paymentCost: number;
  clubProfit: number;
  nonClubProfit: number;
  profitMargin: number;
}

interface ProfitComparisonChartProps {
  data: ProfitData[];
  isLoading?: boolean;
}

export function ProfitComparisonChart({
  data,
  isLoading,
}: ProfitComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex h-full items-center justify-center text-zinc-500">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit Analysis (DKK)</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value, name) => {
                const numValue = Number(value);
                if (name === "Profit Margin") return `${numValue.toFixed(1)}%`;
                return formatCurrency(numValue);
              }}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="clubProfit"
              name="Club Profit"
              fill={TRENDHIM_COLORS.club}
              stackId="profit"
            />
            <Bar
              yAxisId="left"
              dataKey="nonClubProfit"
              name="Non-Club Profit"
              fill={TRENDHIM_COLORS.nonClub}
              stackId="profit"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="profitMargin"
              name="Profit Margin"
              stroke={TRENDHIM_COLORS.accent}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
