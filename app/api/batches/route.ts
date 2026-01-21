import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log("📦 Fetching available batches from database...");

    const batches = await prisma.batch.findMany({
      orderBy: { name: "asc" },
      include: {
        degrees: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    // Enrich with student counts and degree information
    const enrichedBatches = batches.map((batch: any) => {
      const totalStudents = batch.degrees.reduce((sum: number, degree: any) => {
        return sum + degree._count.students;
      }, 0);

      return {
        name: batch.name,
        degrees: batch.degrees.length,
        students: totalStudents,
      };
    });

    console.log(`✅ Found ${batches.length} batches`);

    return NextResponse.json({
      success: true,
      count: batches.length,
      batches: enrichedBatches,
    });
  } catch (error) {
    console.error("❌ Error fetching batches:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
