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

/**
 * Assign modules to students with PENDING grade.
 * Uses createMany for efficient bulk insert, skipping duplicates.
 */
export async function assignModulesToStudents(
  moduleIds: string[],
  studentIds: string[],
) {
  const assignments: Array<{
    studentId: string;
    moduleId: string;
    grade: string;
    gradePoints: number;
  }> = [];

  for (const moduleId of moduleIds) {
    for (const studentId of studentIds) {
      assignments.push({
        studentId,
        moduleId,
        grade: "PENDING",
        gradePoints: 0,
      });
    }
  }

  // Use createMany with skipDuplicates for efficiency
  const result = await prisma.studentGrade.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  return result;
}

/**
 * Get modules with PENDING grade for a student (assigned but not yet graded)
 */
export async function getPendingModulesForStudent(studentId: string) {
  return prisma.studentGrade.findMany({
    where: {
      studentId,
      grade: "PENDING",
    },
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

/**
 * Update a PENDING grade to an actual grade (ONE-TIME only).
 * Returns null if grade is not PENDING (already submitted).
 */
export async function updatePendingGrade(
  studentId: string,
  moduleId: string,
  grade: string,
) {
  // First check if the grade is PENDING
  const existing = await prisma.studentGrade.findUnique({
    where: {
      studentId_moduleId: { studentId, moduleId },
    },
    select: { id: true, grade: true },
  });

  if (!existing) {
    return { success: false, error: "Module not assigned to student" };
  }

  if (existing.grade !== "PENDING") {
    return {
      success: false,
      error: "Grade already submitted and cannot be changed",
    };
  }

  const gradePoints = gradeToPoints(grade);

  const updated = await prisma.studentGrade.update({
    where: { id: existing.id },
    data: { grade, gradePoints },
    include: {
      module: {
        select: { code: true, name: true },
      },
    },
  });

  return { success: true, grade: updated };
}

/**
 * Get students for a semester's degree that don't have a grade for specific modules
 */
export async function getStudentsWithoutGradesForModules(
  semesterId: string,
  moduleIds: string[],
) {
  // Get the degree from the semester
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    select: {
      year: {
        select: {
          degreeId: true,
        },
      },
    },
  });

  if (!semester) return [];

  const degreeId = semester.year.degreeId;

  // Get all students in this degree
  const students = await prisma.student.findMany({
    where: { degreeId },
    select: {
      id: true,
      indexNumber: true,
      name: true,
      grades: {
        where: {
          moduleId: { in: moduleIds },
        },
        select: {
          moduleId: true,
        },
      },
    },
    orderBy: { indexNumber: "asc" },
  });

  // Return students with info about which modules they're missing
  return students.map((student) => ({
    id: student.id,
    indexNumber: student.indexNumber,
    name: student.name,
    existingModuleIds: student.grades.map((g) => g.moduleId),
  }));
}
