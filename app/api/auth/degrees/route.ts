import { NextRequest, NextResponse } from "next/server";
import { getDegreesByBatch } from "@/lib/db/degree.service";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");

    if (!batch) {
      return NextResponse.json({ degrees: [] }, { status: 400 });
    }

    // Get batch by name first
    const batchRecord = await prisma.batch.findUnique({
      where: { name: batch },
    });

    if (!batchRecord) {
      return NextResponse.json({ degrees: [] });
    }

    const degrees = await getDegreesByBatch(batchRecord.id);
    const degreeNames = degrees.map((d: any) => d.name).sort();

    return NextResponse.json({ degrees: degreeNames });
  } catch (error) {
    console.error("Error fetching degrees:", error);
    return NextResponse.json({ degrees: [] }, { status: 500 });
  }
}
