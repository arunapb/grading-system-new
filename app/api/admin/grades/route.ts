import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { upsertGrade } from "@/lib/db/grade.service";
import prisma from "@/lib/db/prisma";

// POST - Add or update a grade for a student (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      "D+",
      "D",
      "D-",
      "E",
      "F",
      "I",
      "W",
      "X",
    ];

    if (!validGrades.includes(grade.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid grade. Valid grades: ${validGrades.join(", ")}` },
        { status: 400 },
      );
    }

    const result = await upsertGrade(studentId, moduleId, grade.toUpperCase());

    return NextResponse.json({
      success: true,
      grade: result,
    });
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
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const moduleId = searchParams.get("moduleId");

    if (studentId) {
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
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("id");

    if (!gradeId) {
      return NextResponse.json(
        { error: "Grade ID is required" },
        { status: 400 },
      );
    }

    await prisma.studentGrade.delete({
      where: { id: gradeId },
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
