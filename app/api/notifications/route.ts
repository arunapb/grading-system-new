import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    // Get recent activity for user notifications (e.g., new grades added)
    const recentGrades = await prisma.studentGrade.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        module: {
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
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Group by module to create notifications
    const moduleMap = new Map<
      string,
      {
        module: (typeof recentGrades)[0]["module"];
        count: number;
        latestDate: Date;
      }
    >();

    for (const grade of recentGrades) {
      const existing = moduleMap.get(grade.moduleId);
      if (existing) {
        existing.count++;
        if (grade.createdAt > existing.latestDate) {
          existing.latestDate = grade.createdAt;
        }
      } else {
        moduleMap.set(grade.moduleId, {
          module: grade.module,
          count: 1,
          latestDate: grade.createdAt,
        });
      }
    }

    const notifications = Array.from(moduleMap.values()).map((item: any) => ({
      id: item.module.id,
      type: "info",
      title: "New Results Available",
      message: `${item.count} new grade(s) added for ${item.module.code} - ${item.module.name}`,
      batch: item.module.semester.year.degree.batch.name,
      degree: item.module.semester.year.degree.name,
      year: item.module.semester.year.name,
      semester: item.module.semester.name,
      createdAt: item.latestDate.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
