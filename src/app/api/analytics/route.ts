import { NextResponse } from "next/server";
import { getSegmentDistribution, getFilterOptions } from "@/lib/analytics-queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    if (type === "options") {
      const options = await getFilterOptions();
      return NextResponse.json(options);
    }

    const data = await getSegmentDistribution();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}
