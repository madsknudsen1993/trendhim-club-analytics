import { NextResponse } from "next/server";
import { getCashbackAnalysis } from "@/lib/analytics-queries";

export async function GET() {
  // Auth disabled for local development
  try {
    const data = await getCashbackAnalysis();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching cashback data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cashback data" },
      { status: 500 }
    );
  }
}
