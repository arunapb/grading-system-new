import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { gradeToPoints } from "@/lib/gpa-calculator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    console.log(`📊 Fetching grade: ${id}`);

    const grade = await prisma.studentGrade.findUnique({
      where: { id },
      include: {
        student: true,
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
    });

    if (!grade) {
      return NextResponse.json(
        { success: false, error: "Grade not found" },
        { status: 404 },
      );
    }

    console.log(`✅ Found grade for ${grade.student.indexNumber}`);

    return NextResponse.json({
      success: true,
      grade: {
        id: grade.id,
        grade: grade.grade,
        gradePoints: grade.gradePoints,
        student: {
          id: grade.student.id,
          indexNumber: grade.student.indexNumber,
          name: grade.student.name,
        },
        module: {
          id: grade.module.id,
          code: grade.module.code,
          name: grade.module.name,
          credits: grade.module.credits,
        },
        semester: grade.module.semester.name,
        year: grade.module.semester.year.name,
        degree: grade.module.semester.year.degree.name,
        batch: grade.module.semester.year.degree.batch.name,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching grade:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { grade } = body;

    if (!grade) {
      return NextResponse.json(
        { success: false, error: "grade is required" },
        { status: 400 },
      );
    }

    console.log(`✏️ Updating grade: ${id} to ${grade}`);

    const existingGrade = await prisma.studentGrade.findUnique({
      where: { id },
    });

    if (!existingGrade) {
      return NextResponse.json(
        { success: false, error: "Grade not found" },
        { status: 404 },
      );
    }

    const gradePoints = gradeToPoints(grade);

    const updatedGrade = await prisma.studentGrade.update({
      where: { id },
      data: { grade, gradePoints },
    });

    console.log(`✅ Updated grade: ${updatedGrade.id}`);

    return NextResponse.json({
      success: true,
      grade: {
        id: updatedGrade.id,
        grade: updatedGrade.grade,
        gradePoints: updatedGrade.gradePoints,
      },
    });
  } catch (error) {
    console.error("❌ Error updating grade:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    console.log(`🗑️ Deleting grade: ${id}`);

    const existingGrade = await prisma.studentGrade.findUnique({
      where: { id },
    });

    if (!existingGrade) {
      return NextResponse.json(
        { success: false, error: "Grade not found" },
        { status: 404 },
      );
    }

    await prisma.studentGrade.delete({
      where: { id },
    });

    console.log(`✅ Deleted grade: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Grade deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting grade:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
