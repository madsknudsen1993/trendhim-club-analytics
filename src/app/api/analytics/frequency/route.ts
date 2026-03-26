import { NextResponse } from "next/server";
import { getPurchaseFrequencyAnalysis } from "@/lib/analytics-queries";

export async function GET() {
  try {
    const data = await getPurchaseFrequencyAnalysis();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching frequency data:", error);
    return NextResponse.json(
      { error: "Failed to fetch frequency data" },
      { status: 500 }
    );
  }
}
