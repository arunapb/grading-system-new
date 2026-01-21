import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");

    if (!batch || !degree) {
      return NextResponse.json(
        { success: false, error: "Batch and degree are required" },
        { status: 400 },
      );
    }

    console.log(
      `📂 Fetching modules for ${batch}/${degree}/${year || "all"}/${semester || "all"}`,
    );

    // Build where clause
    const whereClause: any = {
      semester: {
        year: {
          degree: {
            name: degree,
            batch: { name: batch },
          },
        },
      },
    };

    if (year) {
      const yearMatch = year.match(/Year\s+(\d+)/i);
      const yearNumber = yearMatch ? parseInt(yearMatch[1]) : undefined;
      if (yearNumber) {
        whereClause.semester.year.number = yearNumber;
      }
    }

    if (semester) {
      const semMatch = semester.match(/Semester\s+(\d+)/i);
      const semNumber = semMatch ? parseInt(semMatch[1]) : undefined;
      if (semNumber) {
        whereClause.semester.number = semNumber;
      }
    }

    const modules = await prisma.module.findMany({
      where: whereClause,
      include: {
        semester: {
          include: {
            year: true,
          },
        },
        _count: {
          select: { grades: true },
        },
      },
      orderBy: { code: "asc" },
    });

    const files = modules.map((module: any) => ({
      id: module.id,
      filename: `${module.code}.pdf`,
      moduleCode: module.code,
      moduleName: module.name,
      credits: module.credits,
      year: module.semester.year.name,
      semester: module.semester.name,
      parsed: module._count.grades > 0,
      studentCount: module._count.grades,
      uploadDate: module.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
