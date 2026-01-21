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
                semester: {
                  include: {
                    year: true,
                  },
                },
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
      const yearName = grade.module.semester.year.name; // e.g. "Year 1"
      const semesterName = grade.module.semester.name; // e.g. "Semester 1"
      const fullSemesterName = `${yearName} ${semesterName}`; // e.g. "Year 1 Semester 1"

      const yearId = grade.module.semester.year.id;
      const semesterId = grade.module.semester.id;
      // Composite key to ensure uniqueness: yearId + semesterId
      const uniqueKey = `${yearId}_${semesterId}`;

      const credits = grade.module.credits;
      const points = grade.gradePoints ?? 0;
      const gradeLetter = grade.grade;

      if (!academicHistory[uniqueKey]) {
        academicHistory[uniqueKey] = {
          id: semesterId,
          name: fullSemesterName, // Display name
          yearNumber: grade.module.semester.year.number,
          semesterNumber: grade.module.semester.number,
          modules: [],
          semTotalCredits: 0,
          semTotalPoints: 0,
        };
      }

      academicHistory[uniqueKey].modules.push({
        code: grade.module.code,
        name: grade.module.name,
        credits: credits,
        grade: gradeLetter,
        points: points,
      });

      // Update semester totals
      academicHistory[uniqueKey].semTotalCredits += credits;
      academicHistory[uniqueKey].semTotalPoints += credits * points;

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
        gpa: Math.round(gpa * 10000) / 10000,
      };
    });

    // Sort chronologically: Year 1 Sem 1, Year 1 Sem 2, Year 2 Sem 1...
    semesters.sort((a, b) => {
      if (a.yearNumber !== b.yearNumber) {
        return a.yearNumber - b.yearNumber;
      }
      return a.semesterNumber - b.semesterNumber;
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
