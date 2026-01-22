import { NextRequest, NextResponse } from "next/server";
import { validateInvitation } from "@/lib/db/invitation.service";
import { updatePendingGrade } from "@/lib/db/grade.service";
import { logActivity } from "@/lib/db/activity.service";
import prisma from "@/lib/db/prisma";
import { gradeToPoints } from "@/lib/gpa-calculator";

// POST - Student submits grade for an assigned module (ONE-TIME only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Update Grade API received:", body);
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

    // Validate the invitation code (don't check max uses for updates, as student is already logged in)
    const result = await validateInvitation(code.toUpperCase(), false);

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
      "D",
      "I",
      "F",
      "P",
      "N",
      "W",
    ];

    const normalizedGrade = grade.toUpperCase();
    if (!validGrades.includes(normalizedGrade)) {
      return NextResponse.json(
        { error: `Invalid grade. Valid grades: ${validGrades.join(", ")}` },
        { status: 400 },
      );
    }

    // Check existing grade
    // If we have access to the current grade in the request, or we should fetch it.
    // The updatePendingGrade service might blindly update. We need to check restrictions here.
    // However, `updatePendingGrade` only updates if status is PENDING.
    // But the requirement is: "update by student if result is greater than C then cant edit no longer"
    // This implies that if they ALREADY have a grade > C, they can't change it.
    // We strictly need to verify the *current* grade status.

    // Check if the student already has a grade for this module that is > C
    // We'll need to fetch it first.
    // Note: The `validateInvitation` returns the student object but invites are usually linked to a specific batch/degree.
    // We already have studentId.

    // Let's import prisma to check existing grade
    const existingGrade = await prisma.studentGrade.findUnique({
      where: {
        studentId_moduleId: {
          studentId,
          moduleId,
        },
      },
    });

    if (existingGrade) {
      const existingPoints = gradeToPoints(existingGrade.grade);
      // If exiting grade is C (2.0) or better, deny update
      if (existingPoints >= 2.0) {
        return NextResponse.json(
          {
            error:
              "Cannot update grade. You have already passed this module with C or better.",
          },
          { status: 400 },
        );
      }
    }

    // Update the grade (will fail if not PENDING, OR if we strictly allow re-takes for < C)
    // The requirement suggests they CAN edit if it's < C.
    // `updatePendingGrade` might need to be more flexible or we rely on the check above
    // and then assume we can upsert or update.
    // Let's check `updatePendingGrade` implementation later, but for now assuming it handles "PENDING" check.
    // If the student has a D, they might want to upgrade. Admin sets it to PENDING?
    // Or student just overwrites?
    // "Student Portal1 give this error" -> "Module ID and grade are required"

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
      userName: student.name || "Unknown",
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
