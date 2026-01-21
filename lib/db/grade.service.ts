import prisma from "./prisma";
import { gradeToPoints } from "../gpa-calculator";

export async function upsertGrade(
  studentId: string,
  moduleId: string,
  grade: string,
) {
  const gradePoints = gradeToPoints(grade);

  return prisma.studentGrade.upsert({
    where: {
      studentId_moduleId: { studentId, moduleId },
    },
    update: { grade, gradePoints },
    create: { studentId, moduleId, grade, gradePoints },
  });
}

export async function getGradesByStudent(studentId: string) {
  return prisma.studentGrade.findMany({
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
    orderBy: {
      module: {
        code: "asc",
      },
    },
  });
}

export async function getGradesByModule(moduleId: string) {
  return prisma.studentGrade.findMany({
    where: { moduleId },
    include: {
      student: true,
    },
    orderBy: {
      student: {
        indexNumber: "asc",
      },
    },
  });
}

export async function bulkUpsertGrades(
  grades: Array<{ studentId: string; moduleId: string; grade: string }>,
) {
  const results = await Promise.all(
    grades.map(({ studentId, moduleId, grade }) =>
      upsertGrade(studentId, moduleId, grade),
    ),
  );
  return results;
}
