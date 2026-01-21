import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch parameter is required",
        },
        { status: 400 },
      );
    }

    console.log(`🎓 Fetching available degrees for ${batch} from database...`);

    const degrees = await prisma.degree.findMany({
      where: {
        batch: { name: batch },
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { students: true },
        },
        years: {
          include: {
            semesters: {
              include: {
                _count: {
                  select: { modules: true },
                },
              },
            },
          },
        },
      },
    });

    // Enrich with student counts and data availability
    const enrichedDegrees = degrees.map((degree) => {
      const totalModules = degree.years.reduce((sum, year) => {
        return (
          sum +
          year.semesters.reduce((semSum, sem) => semSum + sem._count.modules, 0)
        );
      }, 0);

      return {
        name: degree.name,
        students: degree._count.students,
        hasData: totalModules > 0,
      };
    });

    console.log(`✅ Found ${degrees.length} degrees in ${batch}`);

    return NextResponse.json({
      success: true,
      batch,
      count: degrees.length,
      degrees: enrichedDegrees,
    });
  } catch (error) {
    console.error("❌ Error fetching degrees:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
