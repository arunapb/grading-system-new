import prisma from "./prisma";

export async function findOrCreateSemester(
  name: string,
  number: number,
  yearId: string,
) {
  return prisma.semester.upsert({
    where: {
      number_yearId: { number, yearId },
    },
    update: { name },
    create: { name, number, yearId },
  });
}

export async function getSemestersByYear(yearId: string) {
  return prisma.semester.findMany({
    where: { yearId },
    orderBy: { number: "asc" },
    include: {
      modules: true,
    },
  });
}

export async function getSemesterById(id: string) {
  return prisma.semester.findUnique({
    where: { id },
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
      modules: {
        include: {
          _count: {
            select: { grades: true },
          },
        },
      },
    },
  });
}

export async function deleteSemester(id: string) {
  return prisma.semester.delete({
    where: { id },
  });
}
