import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        degree: {
          include: {
            batch: true,
          },
        },
        grades: {
          include: {
            module: {
              include: {
                semester: true,
              },
            },
          },
          orderBy: {
            module: {
              code: "asc",
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 },
      );
    }

    // Process grades to calculate GPA/CGPA and group by semester
    let totalCredits = 0;
    let totalPoints = 0;

    // Grouping by semester
    const academicHistory: Record<string, any> = {};

    student.grades.forEach((grade) => {
      const semesterName = grade.module.semester.name;
      const semesterId = grade.module.semester.id;
      const credits = grade.module.credits;
      const points = grade.gradePoints ?? 0;
      const gradeLetter = grade.grade; // A+, A, etc.

      if (!academicHistory[semesterName]) {
        academicHistory[semesterName] = {
          id: semesterId,
          name: semesterName,
          modules: [],
          semTotalCredits: 0,
          semTotalPoints: 0,
        };
      }

      academicHistory[semesterName].modules.push({
        code: grade.module.code,
        name: grade.module.name,
        credits: credits,
        grade: gradeLetter,
        points: points,
      });

      // Update semester totals
      academicHistory[semesterName].semTotalCredits += credits;
      academicHistory[semesterName].semTotalPoints += credits * points;

      // Update overall totals
      totalCredits += credits;
      totalPoints += credits * points;
    });

    // Calculate GPAs
    const semesters = Object.values(academicHistory).map((sem) => {
      const gpa =
        sem.semTotalCredits > 0 ? sem.semTotalPoints / sem.semTotalCredits : 0;
      return {
        ...sem,
        gpa: Math.round(gpa * 100) / 100,
      };
    });

    // Sort semesters (this might need better logic if names are "Semester 1", "Semester 2")
    // Assuming names contain numbers we can extract
    semesters.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.name.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    const formattedStudent = {
      id: student.id,
      indexNumber: student.indexNumber,
      name: student.name,
      photoUrl: student.photoUrl,
      batch: student.degree.batch.name,
      degree: student.degree.name,
      cgpa: Math.round(cgpa * 100) / 100,
      totalCredits,
      semesters,
    };

    return NextResponse.json({
      success: true,
      student: formattedStudent,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 },
    );
  }
}
