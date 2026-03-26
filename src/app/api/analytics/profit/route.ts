import { NextResponse } from "next/server";
import { getProfitAnalysis, getAOVByCurrency } from "@/lib/analytics-queries";

export async function GET(request: Request) {
  // Auth disabled for local development
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const type = searchParams.get("type") || "profit";

  const filters = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  try {
    if (type === "aov") {
      const data = await getAOVByCurrency(filters);
      return NextResponse.json(data);
    }

    const data = await getProfitAnalysis(filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching profit data:", error);
    return NextResponse.json(
      { error: "Failed to fetch profit data" },
      { status: 500 }
    );
  }
}
