import { NextResponse } from "next/server";
import { getProgramROI } from "@/lib/analytics-queries";

export async function GET() {
  try {
    const data = await getProgramROI();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching ROI data:", error);
    return NextResponse.json(
      { error: "Failed to fetch ROI data" },
      { status: 500 }
    );
  }
}
