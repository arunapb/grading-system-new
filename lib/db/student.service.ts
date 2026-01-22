import prisma from "./prisma";

export async function findStudentsByIndexNumbers(
  indexNumbers: string[],
  degreeId: string,
) {
  return prisma.student.findMany({
    where: {
      degreeId,
      indexNumber: { in: indexNumbers },
    },
    select: { id: true, indexNumber: true, name: true },
  });
}

export async function bulkCreateStudents(
  students: { indexNumber: string; degreeId: string; name?: string }[],
) {
  return prisma.student.createMany({
    data: students,
    skipDuplicates: true,
  });
}

export async function findOrCreateStudent(
  indexNumber: string,
  degreeId: string,
  name?: string,
  photoUrl?: string,
) {
  return prisma.student.upsert({
    where: {
      indexNumber_degreeId: { indexNumber, degreeId },
    },
    update: {
      name: name || undefined,
      photoUrl: photoUrl || undefined,
    },
    create: { indexNumber, degreeId, name, photoUrl },
  });
}

export async function updateStudentProfile(
  indexNumber: string,
  degreeId: string,
  name: string,
  photoUrl: string | null,
) {
  return prisma.student.update({
    where: {
      indexNumber_degreeId: { indexNumber, degreeId },
    },
    data: {
      name,
      photoUrl,
    },
  });
}

export async function getStudentByIndex(
  idOrIndex: string,
  batchName?: string,
  degreeName?: string,
) {
  // Try to find by ID (CUID) or Index Number
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: idOrIndex },
        { indexNumber: { equals: idOrIndex, mode: "insensitive" } },
      ],
    },
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
      },
    },
  });

  return student;
}

export async function getAllStudentsWithCGPA(
  batchName?: string,
  degreeName?: string,
) {
  const whereClause: any = {};

  if (batchName && degreeName) {
    whereClause.degree = {
      name: degreeName,
      batch: { name: batchName },
    };
  } else if (batchName) {
    whereClause.degree = {
      batch: { name: batchName },
    };
  }

  const students = await prisma.student.findMany({
    where: whereClause,
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
      },
    },
  });

  // Calculate CGPA for each student
  return students
    .map((student) => {
      const validGrades = student.grades.filter((g) => g.gradePoints > 0);
      const totalCredits = validGrades.reduce(
        (sum, g) => sum + g.module.credits,
        0,
      );
      const totalPoints = validGrades.reduce(
        (sum, g) => sum + g.gradePoints * g.module.credits,
        0,
      );
      const cgpa =
        totalCredits > 0
          ? parseFloat((totalPoints / totalCredits).toFixed(2))
          : 0;

      let photoUrl = student.photoUrl;
      // If photoUrl is relative (not starting with http), construct full path
      if (
        photoUrl &&
        student.degree &&
        student.degree.batch &&
        !photoUrl.startsWith("http")
      ) {
        const batchParam = encodeURIComponent(student.degree.batch.name);
        const degreeParam = encodeURIComponent(student.degree.name);
        photoUrl = `/${batchParam}/${degreeParam}/${photoUrl}`;
      }

      return {
        indexNumber: student.indexNumber,
        name: student.name,
        photoUrl,
        cgpa,
        totalCredits,
        moduleCount: student.grades.length,
        batch: student.degree.batch.name,
        degree: student.degree.name,
      };
    })
    .sort((a, b) => b.cgpa - a.cgpa);
}

export async function getStudentDetails(
  indexNumber: string,
  batchName?: string,
  degreeName?: string,
) {
  const student = await getStudentByIndex(indexNumber, batchName, degreeName);

  if (!student) return null;

  // Group grades by semester
  const semesterMap = new Map<string, typeof student.grades>();

  for (const grade of student.grades) {
    const key = `${grade.module.semester.year.name}|${grade.module.semester.name}`;
    if (!semesterMap.has(key)) {
      semesterMap.set(key, []);
    }
    semesterMap.get(key)!.push(grade);
  }

  // Calculate SGPA for each semester
  const semesters = Array.from(semesterMap.entries())
    .map(([key, grades]) => {
      const [yearName, semesterName] = key.split("|");
      const validGrades = grades.filter((g) => g.gradePoints > 0);
      const totalCredits = validGrades.reduce(
        (sum, g) => sum + g.module.credits,
        0,
      );
      const totalPoints = validGrades.reduce(
        (sum, g) => sum + g.gradePoints * g.module.credits,
        0,
      );
      const sgpa =
        totalCredits > 0
          ? parseFloat((totalPoints / totalCredits).toFixed(2))
          : 0;

      return {
        year: yearName,
        semester: semesterName,
        sgpa,
        credits: totalCredits,
        modules: grades.map((g) => ({
          id: g.moduleId,
          moduleCode: g.module.code,
          moduleName: g.module.name,
          grade: g.grade,
          credits: g.module.credits,
          gradePoints: g.gradePoints,
          year: g.module.semester.year.name,
          semester: g.module.semester.name,
        })),
      };
    })
    .sort((a, b) => {
      const yearCompare = a.year.localeCompare(b.year);
      if (yearCompare !== 0) return yearCompare;
      return a.semester.localeCompare(b.semester);
    });

  // Calculate overall CGPA
  const allValidGrades = student.grades.filter((g) => g.gradePoints > 0);
  const totalCredits = allValidGrades.reduce(
    (sum, g) => sum + g.module.credits,
    0,
  );
  const totalPoints = allValidGrades.reduce(
    (sum, g) => sum + g.gradePoints * g.module.credits,
    0,
  );
  const cgpa =
    totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

  // Get rank
  const allStudents = await getAllStudentsWithCGPA(batchName, degreeName);
  const rank = allStudents.findIndex((s) => s.indexNumber === indexNumber) + 1;

  // Construct photo URL if available
  let photoUrl = student.photoUrl;
  if (
    photoUrl &&
    student.degree &&
    student.degree.batch &&
    !photoUrl.startsWith("http")
  ) {
    // encodeURIComponent is important for spaces in "Batch 21"
    const batchParam = encodeURIComponent(student.degree.batch.name);
    const degreeParam = encodeURIComponent(student.degree.name);
    // photoUrl in db is "photos/index.png", so we need to construct the full path
    photoUrl = `/${batchParam}/${degreeParam}/${photoUrl}`;
  }

  return {
    indexNumber: student.indexNumber,
    name: student.name,
    photoUrl,
    batch: student.degree.batch.name,
    degree: student.degree.name,
    rank,
    cgpa,
    totalCredits,
    semesters,
    modules: student.grades.map((g) => ({
      id: g.moduleId,
      moduleCode: g.module.code,
      moduleName: g.module.name,
      grade: g.grade,
      credits: g.module.credits,
      gradePoints: g.gradePoints,
      year: g.module.semester.year.name,
      semester: g.module.semester.name,
    })),
  };
}
