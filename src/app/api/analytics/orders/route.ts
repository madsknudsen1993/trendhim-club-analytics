import { NextResponse } from "next/server";
import {
  getOrdersOverTime,
  getClubComparison,
  getReturningOrderAnalysis,
  getPurchaseFrequencyAnalysis,
} from "@/lib/analytics-queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const countryCode = searchParams.get("countryCode");
  const currencyCode = searchParams.get("currencyCode");

  const filters = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    countryCode: countryCode || undefined,
    currencyCode: currencyCode || undefined,
  };

  try {
    switch (type) {
      case "comparison":
        const comparison = await getClubComparison(filters);
        return NextResponse.json(comparison);

      case "returning":
        const returning = await getReturningOrderAnalysis();
        return NextResponse.json(returning);

      case "frequency":
        const frequency = await getPurchaseFrequencyAnalysis();
        return NextResponse.json(frequency);

      default:
        const orders = await getOrdersOverTime(filters);
        return NextResponse.json(orders);
    }
  } catch (error) {
    console.error("Error fetching orders data:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders data" },
      { status: 500 }
    );
  }
}
