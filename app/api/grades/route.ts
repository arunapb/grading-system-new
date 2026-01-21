import { NextRequest, NextResponse } from "next/server";
import {
  getGradesByStudent,
  getGradesByModule,
  bulkUpsertGrades,
} from "@/lib/db/grade.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const moduleId = searchParams.get("moduleId");

    if (!studentId && !moduleId) {
      return NextResponse.json(
        {
          success: false,
          error: "Either studentId or moduleId is required",
        },
        { status: 400 },
      );
    }

    console.log(
      `📊 Fetching grades (studentId: ${studentId || "none"}, moduleId: ${moduleId || "none"})`,
    );

    let grades: any[] = [];

    if (studentId) {
      grades = await getGradesByStudent(studentId);
    } else if (moduleId) {
      grades = await getGradesByModule(moduleId);
    }

    console.log(`✅ Found ${grades?.length || 0} grades`);

    return NextResponse.json({
      success: true,
      count: grades?.length || 0,
      grades: grades?.map((g: any) => ({
        id: g.id,
        grade: g.grade,
        gradePoints: g.gradePoints,
        studentId: g.studentId,
        moduleId: g.moduleId,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching grades:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grades } = body;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "grades array is required",
        },
        { status: 400 },
      );
    }

    // Validate each grade
    for (const g of grades) {
      if (!g.studentId || !g.moduleId || !g.grade) {
        return NextResponse.json(
          {
            success: false,
            error: "Each grade must have studentId, moduleId, and grade",
          },
          { status: 400 },
        );
      }
    }

    console.log(`📝 Bulk upserting ${grades.length} grades`);

    const results = await bulkUpsertGrades(grades);

    console.log(`✅ Upserted ${results.length} grades`);

    return NextResponse.json({
      success: true,
      count: results.length,
      grades: results.map((g: any) => ({
        id: g.id,
        grade: g.grade,
        gradePoints: g.gradePoints,
        studentId: g.studentId,
        moduleId: g.moduleId,
      })),
    });
  } catch (error) {
    console.error("❌ Error upserting grades:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
