import { NextRequest, NextResponse } from "next/server";
import { validateInvitation } from "@/lib/db/invitation.service";
import { updatePendingGrade } from "@/lib/db/grade.service";
import { logActivity } from "@/lib/db/activity.service";

// POST - Student submits grade for an assigned module (ONE-TIME only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, moduleId, grade } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 },
      );
    }

    if (!moduleId || !grade) {
      return NextResponse.json(
        { error: "Module ID and grade are required" },
        { status: 400 },
      );
    }

    // Validate the invitation code
    const result = await validateInvitation(code.toUpperCase());

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const studentId = result.invitation!.studentId;
    const student = result.invitation!.student;

    // Validate grade
    const validGrades = [
      "A+",
      "A",
      "A-",
      "B+",
      "B",
      "B-",
      "C+",
      "C",
      "C-",
      "D+",
      "D",
      "D-",
      "E",
      "F",
      "I",
      "W",
      "X",
    ];

    const normalizedGrade = grade.toUpperCase();
    if (!validGrades.includes(normalizedGrade)) {
      return NextResponse.json(
        { error: `Invalid grade. Valid grades: ${validGrades.join(", ")}` },
        { status: 400 },
      );
    }

    // Update the grade (will fail if not PENDING)
    const updateResult = await updatePendingGrade(
      studentId,
      moduleId,
      normalizedGrade,
    );

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 400 });
    }

    // Log activity with student info
    await logActivity("STUDENT_GRADE_UPDATED", {
      studentId,
      studentIndexNumber: student.indexNumber,
      studentName: student.name || "Unknown",
      moduleId,
      moduleCode: updateResult.grade?.module.code,
      moduleName: updateResult.grade?.module.name,
      newGrade: normalizedGrade,
      userType: "student",
    });

    return NextResponse.json({
      success: true,
      message: "Grade submitted successfully",
      grade: {
        moduleCode: updateResult.grade?.module.code,
        moduleName: updateResult.grade?.module.name,
        grade: normalizedGrade,
      },
    });
  } catch (error) {
    console.error("Error updating student grade:", error);
    return NextResponse.json(
      { error: "Failed to submit grade" },
      { status: 500 },
    );
  }
}
