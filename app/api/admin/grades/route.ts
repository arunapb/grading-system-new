import { upsertGrade } from "@/lib/db/grade.service";
import prisma from "@/lib/db/prisma";
import { gradeToPoints } from "@/lib/gpa-calculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/db/activity.service";
import { getGeoLocation } from "@/lib/geolocation";
import { getAdminScope, isStudentInScope } from "@/lib/permissions";

// POST - Add or update a grade for a student (admin only)
import { requireAdminAuth, getAdminSession } from "@/lib/auth";

// POST - Add or update a grade for a student (admin only)
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (
    !session ||
    ((session.user as any).role !== "SUPER_ADMIN" &&
      !(session.user as any).canEditGrades)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { studentId, moduleId, grade } = body;

    if (!studentId || !moduleId || !grade) {
      return NextResponse.json(
        { error: "Student ID, Module ID, and grade are required" },
        { status: 400 },
      );
    }

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

    if (!validGrades.includes(grade.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid grade. Valid grades: ${validGrades.join(", ")}` },
        { status: 400 },
      );
    }

    // Verify student is within admin's scope
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        degree: {
          include: { batch: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const adminScope = await getAdminScope(session);
    const hasAccess = await isStudentInScope(
      student.degreeId,
      student.degree?.batch.id ?? null,
      adminScope,
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied - student not in your scope" },
        { status: 403 },
      );
    }

    // Check existing grade
    const existingGrade = await prisma.studentGrade.findUnique({
      where: {
        studentId_moduleId: {
          studentId,
          moduleId,
        },
      },
    });

    if (existingGrade) {
      const currentPoints = gradeToPoints(existingGrade.grade);
      // If current grade is C (2.0) or higher, deny update
      if (currentPoints >= 2.0) {
        return NextResponse.json(
          {
            error:
              "Cannot update grade. Student has already passed this module with C or better.",
          },
          { status: 400 },
        );
      }
    }

    const result = await upsertGrade(studentId, moduleId, grade.toUpperCase());

    // Log Activity
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown";
    const geo = await getGeoLocation(ip);

    await logActivity("GRADE_UPDATED", {
      studentId,
      moduleId,
      grade: grade.toUpperCase(),
      previousGrade: existingGrade?.grade || null,
      updatedBy: (session.user as any).username || session.user.email,
      role: (session.user as any).role,
      geo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding/updating grade:", error);
    return NextResponse.json(
      { error: "Failed to add/update grade" },
      { status: 500 },
    );
  }
}

// GET - Get grades for a student or module (admin only)
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (
    !session ||
    ((session.user as any).role !== "SUPER_ADMIN" &&
      !(session.user as any).canViewGrades)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const moduleId = searchParams.get("moduleId");

    if (studentId) {
      // Verify student is within admin's scope
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          degree: { include: { batch: true } },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 },
        );
      }

      const adminScope = await getAdminScope(session);
      const hasAccess = await isStudentInScope(
        student.degreeId,
        student.degree?.batch.id ?? null,
        adminScope,
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied - student not in your scope" },
          { status: 403 },
        );
      }

      const grades = await prisma.studentGrade.findMany({
        where: { studentId },
        include: {
          module: {
            include: {
              semester: {
                include: {
                  year: true,
                },
              },
            },
          },
        },
      });
      return NextResponse.json(grades);
    }

    if (moduleId) {
      const grades = await prisma.studentGrade.findMany({
        where: { moduleId },
        include: {
          student: {
            include: {
              degree: {
                include: {
                  batch: true,
                },
              },
            },
          },
        },
      });
      return NextResponse.json(grades);
    }

    return NextResponse.json(
      { error: "Student ID or Module ID is required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a grade (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (
    !session ||
    ((session.user as any).role !== "SUPER_ADMIN" &&
      !(session.user as any).canEditGrades)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("id");

    if (!gradeId) {
      return NextResponse.json(
        { error: "Grade ID is required" },
        { status: 400 },
      );
    }

    // Fetch grade with student info for scope check
    const gradeRecord = await prisma.studentGrade.findUnique({
      where: { id: gradeId },
      include: {
        student: {
          include: {
            degree: { include: { batch: true } },
          },
        },
      },
    });

    if (!gradeRecord) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Verify student is within admin's scope
    const adminScope = await getAdminScope(session);
    const hasAccess = await isStudentInScope(
      gradeRecord.student.degreeId,
      gradeRecord.student.degree?.batch.id ?? null,
      adminScope,
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied - student not in your scope" },
        { status: 403 },
      );
    }

    await prisma.studentGrade.delete({
      where: { id: gradeId },
    });

    // Log Activity
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown";
    const geo = await getGeoLocation(ip);

    await logActivity("GRADE_DELETED", {
      gradeId,
      deletedBy: (session.user as any).username || session.user.email,
      role: (session.user as any).role,
      geo,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json(
      { error: "Failed to delete grade" },
      { status: 500 },
    );
  }
}
