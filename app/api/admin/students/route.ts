import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db/prisma";

// GET - Get students filtered by batch and degree (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      let totalCredits = 0;
      let totalPoints = 0;

      for (const grade of student.grades) {
        const credits = grade.module.credits;
        const points = grade.gradePoints ?? 0;
        totalCredits += credits;
        totalPoints += credits * points;
      }

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
