import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");

    // If match is provided, filter by it. If not, return all (or maybe limit?).
    // For admin selection, we want all.
    const whereClause = batch ? { batch: { name: batch } } : {};

    console.log(
      `🎓 Fetching available degrees ${batch ? `for ${batch}` : "(all)"} from database...`,
    );

    const degrees = await prisma.degree.findMany({
      where: whereClause,
      orderBy: [
        { batch: { name: "desc" } }, // Order by Batch first
        { name: "asc" },
      ],
      include: {
        batch: true, // Need batch info if fetching all
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
    const enrichedDegrees = degrees.map((degree: any) => {
      const totalModules = degree.years.reduce((sum: number, year: any) => {
        return (
          sum +
          year.semesters.reduce(
            (semSum: number, sem: any) => semSum + sem._count.modules,
            0,
          )
        );
      }, 0);

      return {
        id: degree.id,
        name: degree.name,
        batchName: degree.batch.name,
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
