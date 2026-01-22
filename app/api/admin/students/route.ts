import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "@/lib/permissions";
import prisma from "@/lib/db/prisma";

// GET - Get students filtered by batch and degree (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check for canViewStudents permission
    const permResult = await checkPermission("canViewStudents");
    if (!permResult.authorized) {
      return permResult.response;
    }

    const { searchParams } = new URL(request.url);
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    // Build where clause
    const where: any = {};

    if (batch && degree) {
      where.degree = {
        name: degree,
        batch: {
          name: batch,
        },
      };
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        indexNumber: true,
        name: true,
        photoUrl: true,
        degree: {
          select: {
            name: true,
            batch: {
              select: {
                name: true,
              },
            },
          },
        },
        grades: {
          select: {
            gradePoints: true,
            grade: true,
            module: {
              select: {
                credits: true,
              },
            },
          },
        },
      },
      orderBy: {
        indexNumber: "asc",
      },
    });

    // Calculate CGPA for each student
    const studentsWithCGPA = students.map((student: any) => {
      // Logic copied from gpa-calculator.ts / student.service.ts
      // Filter out non-GPA grades (P, N, W)
      const validGrades = student.grades.filter((g: any) => {
        const gradeLetter = g.grade?.toUpperCase().trim() || "";
        return !["P", "N", "W", "PENDING"].includes(gradeLetter);
      });

      const totalCredits = validGrades.reduce(
        (sum: number, g: any) => sum + g.module.credits,
        0,
      );

      const totalPoints = validGrades.reduce(
        (sum: number, g: any) => sum + (g.gradePoints ?? 0) * g.module.credits,
        0,
      );

      const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

      return {
        id: student.id,
        indexNumber: student.indexNumber,
        name: student.name,
        photoUrl: student.photoUrl,
        cgpa: Math.round(cgpa * 10000) / 10000,
        totalCredits,
        batch: student.degree.batch.name,
        degree: student.degree.name,
        moduleCount: student.grades.length, // Add module count for display
      };
    });

    return NextResponse.json({
      success: true,
      students: studentsWithCGPA,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
