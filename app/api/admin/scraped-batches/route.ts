import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    // Get all degrees with their student counts from database
    const degrees = await prisma.degree.findMany({
      include: {
        batch: true,
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ batch: { name: "asc" } }, { name: "asc" }],
    });

    const scraped = degrees
      .filter((d) => d._count.students > 0)
      .map((d) => ({
        batch: d.batch.name,
        degree: d.name,
        studentCount: d._count.students,
        scrapedAt: d.updatedAt.toISOString(),
      }));

    return NextResponse.json({
      success: true,
      scraped,
    });
  } catch (error) {
    console.error("Error fetching scraped batches:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
