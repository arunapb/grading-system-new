import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  assignModulesToStudents,
  getStudentsWithoutGradesForModules,
} from "@/lib/db/grade.service";
import { logActivity } from "@/lib/db/activity.service";
import prisma from "@/lib/db/prisma";

import { requireAdminAuth } from "@/lib/auth";

// POST - Assign modules to multiple students (bulk operation)
export async function POST(request: NextRequest) {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const { moduleIds, studentIds, assignAll, semesterId } = body;

    if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json(
        { error: "At least one module ID is required" },
        { status: 400 },
      );
    }

    let targetStudentIds: string[] = studentIds || [];

    // If assignAll is true, get all students for the semester's degree
    if (assignAll && semesterId) {
      const students = await getStudentsWithoutGradesForModules(
        semesterId,
        moduleIds,
      );
      // Filter to only students who don't have all the modules already
      targetStudentIds = students
        .filter((s) => {
          // Include if student doesn't have at least one of the modules
          return moduleIds.some(
            (mId: string) => !s.existingModuleIds.includes(mId),
          );
        })
        .map((s) => s.id);
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json(
        { error: "No students to assign modules to" },
        { status: 400 },
      );
    }

    // Get module codes for logging
    const modules = await prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, code: true, name: true },
    });

    const result = await assignModulesToStudents(moduleIds, targetStudentIds);

    // Log activity
    await logActivity("MODULE_ASSIGNED", {
      moduleIds,
      moduleCodes: modules.map((m) => m.code),
      studentCount: targetStudentIds.length,
      assignedCount: result.count,
      assignedBy: (session?.user as any)?.username || session?.user?.email,
      userType: "admin",
    });

    return NextResponse.json({
      success: true,
      assignedCount: result.count,
      studentCount: targetStudentIds.length,
      modules: modules.map((m) => ({ code: m.code, name: m.name })),
    });
  } catch (error) {
    console.error("Error assigning modules:", error);
    return NextResponse.json(
      { error: "Failed to assign modules" },
      { status: 500 },
    );
  }
}

// GET - Get students for module assignment (with existing grade info)
export async function GET(request: NextRequest) {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get("semesterId");
    const moduleIdsParam = searchParams.get("moduleIds");

    if (!semesterId) {
      return NextResponse.json(
        { error: "Semester ID is required" },
        { status: 400 },
      );
    }

    const moduleIds = moduleIdsParam ? moduleIdsParam.split(",") : [];

    const students = await getStudentsWithoutGradesForModules(
      semesterId,
      moduleIds,
    );

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Error fetching students for module assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
