import prisma from "./prisma";

export async function findOrCreateModule(
  code: string,
  name: string,
  credits: number,
  semesterId: string,
) {
  return prisma.module.upsert({
    where: {
      code_semesterId: { code, semesterId },
    },
    update: { name, credits },
    create: { code, name, credits, semesterId },
  });
}

export async function getModulesBySemester(semesterId: string) {
  return prisma.module.findMany({
    where: { semesterId },
    orderBy: { code: "asc" },
  });
}

export async function updateModule(
  id: string,
  data: { code?: string; name?: string; credits?: number },
) {
  return prisma.module.update({
    where: { id },
    data,
  });
}

export async function getModuleWithGrades(moduleId: string) {
  return prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      grades: {
        include: {
          student: true,
        },
      },
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
  });
}

export async function getModuleById(id: string) {
  return prisma.module.findUnique({
    where: { id },
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
      grades: {
        include: {
          student: true,
        },
      },
    },
  });
}

export async function deleteModule(id: string) {
  return prisma.module.delete({
    where: { id },
  });
}

export async function getAllModules(
  batchName?: string,
  degreeName?: string,
  yearNumber?: number,
  semesterNumber?: number,
) {
  const whereClause: any = {};

  if (batchName || degreeName || yearNumber || semesterNumber) {
    whereClause.semester = {};

    if (semesterNumber) {
      whereClause.semester.number = semesterNumber;
    }

    if (yearNumber || degreeName || batchName) {
      whereClause.semester.year = {};

      if (yearNumber) {
        whereClause.semester.year.number = yearNumber;
      }

      if (degreeName || batchName) {
        whereClause.semester.year.degree = {};

        if (degreeName) {
          whereClause.semester.year.degree.name = degreeName;
        }

        if (batchName) {
          whereClause.semester.year.degree.batch = { name: batchName };
        }
      }
    }
  }

  return prisma.module.findMany({
    where: whereClause,
    orderBy: { code: "asc" },
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
      _count: {
        select: { grades: true },
      },
    },
  });
}

export async function getModuleByCode(code: string, semesterId: string) {
  return prisma.module.findUnique({
    where: {
      code_semesterId: { code, semesterId },
    },
  });
}
