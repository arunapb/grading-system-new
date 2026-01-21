import { NextRequest, NextResponse } from "next/server";
import { scanPDFDirectory } from "@/lib/fs-utils";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    console.log(
      `🔍 Scanning PDF directory... (batch: ${batch || "all"}, degree: ${degree || "all"})`,
    );

    // Scan directory
    const pdfs = scanPDFDirectory(
      undefined,
      "",
      batch || undefined,
      degree || undefined,
    );

    console.log(`✅ Found ${pdfs.length} PDFs`);

    return NextResponse.json({
      success: true,
      count: pdfs.length,
      pdfs,
      context: batch && degree ? { batch, degree } : null,
    });
  } catch (error) {
    console.error("❌ Error listing PDFs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
