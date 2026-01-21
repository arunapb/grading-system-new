import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    // Find modules that don't have any grades (potentially unparsed PDFs)
    const modulesWithoutGrades = await prisma.module.findMany({
      where: {
        grades: {
          none: {},
        },
      },
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
      },
      take: 50,
    });

    const notifications = modulesWithoutGrades.map((module) => ({
      id: module.id,
      type: "warning",
      title: "Module without grades",
      message: `Module ${module.code} (${module.name}) has no student grades`,
      batch: module.semester.year.degree.batch.name,
      degree: module.semester.year.degree.name,
      year: module.semester.year.name,
      semester: module.semester.name,
      createdAt: module.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
