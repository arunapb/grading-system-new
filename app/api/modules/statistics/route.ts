import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    // Fetch all modules with their grades and semester info
    const modules = await prisma.module.findMany({
      include: {
        semester: {
          include: {
            year: {
              include: {
                degree: {
                  include: {
                    batch: true,
                  },
                },
              },
            },
          },
        },
        grades: {
          select: {
            grade: true,
          },
        },
      },
      orderBy: [
        { semester: { year: { number: "asc" } } },
        { semester: { number: "asc" } },
        { code: "asc" },
      ],
    });

    // Process modules to group by year/semester and calculate grade distribution
    const processedModules = modules.map((module) => {
      // Count grades
      const gradeCounts: Record<string, number> = {};
      module.grades.forEach((g) => {
        gradeCounts[g.grade] = (gradeCounts[g.grade] || 0) + 1;
      });

      return {
        id: module.id,
        code: module.code,
        name: module.name,
        credits: module.credits,
        totalStudents: module.grades.length,
        gradeCounts,
        semester: module.semester.name,
        semesterNumber: module.semester.number,
        year: module.semester.year.name,
        yearNumber: module.semester.year.number,
        degree: module.semester.year.degree.name,
        batch: module.semester.year.degree.batch.name,
      };
    });

    // Group by batch -> degree -> year -> semester
    const grouped: Record<
      string,
      Record<string, Record<string, Record<string, typeof processedModules>>>
    > = {};

    processedModules.forEach((module) => {
      if (!grouped[module.batch]) {
        grouped[module.batch] = {};
      }
      if (!grouped[module.batch][module.degree]) {
        grouped[module.batch][module.degree] = {};
      }
      if (!grouped[module.batch][module.degree][module.year]) {
        grouped[module.batch][module.degree][module.year] = {};
      }
      if (!grouped[module.batch][module.degree][module.year][module.semester]) {
        grouped[module.batch][module.degree][module.year][module.semester] = [];
      }
      grouped[module.batch][module.degree][module.year][module.semester].push(
        module,
      );
    });

    return NextResponse.json({
      success: true,
      count: modules.length,
      modules: processedModules,
      grouped,
    });
  } catch (error) {
    console.error("Error fetching module statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
