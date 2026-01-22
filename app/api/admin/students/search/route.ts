import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { checkPermission } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    // Check for canViewStudents permission (needed to search them)
    // Also arguably canAssignModules, but let's stick to view permission for search.
    const permResult = await checkPermission("canViewStudents");
    if (!permResult.authorized) {
      return permResult.response;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ success: true, students: [] });
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { indexNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      include: {
        degree: {
          include: {
            batch: true,
          },
        },
        grades: {
          select: {
            moduleId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 },
    );
  }
}
