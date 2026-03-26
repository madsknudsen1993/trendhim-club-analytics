import { NextResponse } from "next/server";
import { getKPIs, getProgramROI } from "@/lib/analytics-queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const countryCode = searchParams.get("countryCode");
  const currencyCode = searchParams.get("currencyCode");
  const includeROI = searchParams.get("includeROI") === "true";

  try {
    const kpis = await getKPIs({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      countryCode: countryCode || undefined,
      currencyCode: currencyCode || undefined,
    });

    // Optionally include ROI data
    if (includeROI) {
      const roi = await getProgramROI();
      return NextResponse.json({ ...kpis, roi });
    }

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
