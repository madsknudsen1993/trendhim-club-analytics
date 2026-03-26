"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEGMENT_COLORS, formatNumber } from "@/lib/chart-config";

interface SegmentData {
  month: string;
  loyal: number;
  returning: number;
  new: number;
  inactive: number;
}

interface SegmentDistributionChartProps {
  data: SegmentData[];
  isLoading?: boolean;
}

export function SegmentDistributionChart({
  data,
  isLoading,
}: SegmentDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Segment Distribution</CardTitle>
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
        <CardTitle>Customer Segment Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
            <Area
              type="monotone"
              dataKey="loyal"
              name="Loyal"
              stackId="1"
              stroke={SEGMENT_COLORS.loyal}
              fill={SEGMENT_COLORS.loyal}
            />
            <Area
              type="monotone"
              dataKey="returning"
              name="Returning"
              stackId="1"
              stroke={SEGMENT_COLORS.returning}
              fill={SEGMENT_COLORS.returning}
            />
            <Area
              type="monotone"
              dataKey="new"
              name="New"
              stackId="1"
              stroke={SEGMENT_COLORS.new}
              fill={SEGMENT_COLORS.new}
            />
            <Area
              type="monotone"
              dataKey="inactive"
              name="Inactive"
              stackId="1"
              stroke={SEGMENT_COLORS.inactive}
              fill={SEGMENT_COLORS.inactive}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
