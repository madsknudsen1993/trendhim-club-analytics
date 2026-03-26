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
import { TRENDHIM_COLORS, formatNumber } from "@/lib/chart-config";

interface OrdersData {
  month: string;
  total: number;
  clubCount: number;
  nonClubCount: number;
  revenue: number;
}

interface OrdersOverTimeChartProps {
  data: OrdersData[];
  isLoading?: boolean;
}

export function OrdersOverTimeChart({
  data,
  isLoading,
}: OrdersOverTimeChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders Over Time</CardTitle>
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
        <CardTitle>Orders Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
            <Tooltip
              formatter={(value) => formatNumber(Number(value))}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="clubCount"
              name="Club Members"
              stroke={TRENDHIM_COLORS.club}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="nonClubCount"
              name="Non-Club"
              stroke={TRENDHIM_COLORS.nonClub}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={TRENDHIM_COLORS.primary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
