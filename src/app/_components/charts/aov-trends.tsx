"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY_COLORS, formatCurrency } from "@/lib/chart-config";

interface AOVData {
  month: string;
  currency: string;
  avgOrderValue: number;
  clubAOV: number;
  nonClubAOV: number;
}

interface AOVTrendsChartProps {
  data: AOVData[];
  isLoading?: boolean;
}

export function AOVTrendsChart({ data, isLoading }: AOVTrendsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Average Order Value by Currency</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex h-full items-center justify-center text-zinc-500">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data: group by month, create separate series for each currency
  const currencies = [...new Set(data.map((d) => d.currency))];
  const months = [...new Set(data.map((d) => d.month))].sort();

  const chartData = months.map((month) => {
    const monthData: Record<string, number | string> = { month };
    currencies.forEach((currency) => {
      const entry = data.find((d) => d.month === month && d.currency === currency);
      if (entry) {
        monthData[currency] = entry.avgOrderValue;
      }
    });
    return monthData;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Order Value by Currency</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) =>
                formatCurrency(Number(value), String(name))
              }
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            {currencies.map((currency) => (
              <Line
                key={currency}
                type="monotone"
                dataKey={currency}
                name={currency}
                stroke={CURRENCY_COLORS[currency] || "#666"}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
