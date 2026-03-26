import { NextResponse } from "next/server";
import { getMonthlyClubMetrics } from "@/lib/analytics-queries";

export async function GET() {
  try {
    const data = await getMonthlyClubMetrics();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching monthly metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly metrics" },
      { status: 500 }
    );
  }
}
