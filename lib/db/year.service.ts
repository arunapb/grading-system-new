import prisma from "./prisma";

export async function findOrCreateYear(
  name: string,
  number: number,
  degreeId: string,
) {
  return prisma.year.upsert({
    where: {
      number_degreeId: { number, degreeId },
    },
    update: { name },
    create: { name, number, degreeId },
  });
}

export async function getYearsByDegree(degreeId: string) {
  return prisma.year.findMany({
    where: { degreeId },
    orderBy: { number: "asc" },
    include: {
      semesters: true,
    },
  });
}

export async function getYearById(id: string) {
  return prisma.year.findUnique({
    where: { id },
    include: {
      degree: {
        include: {
          batch: true,
        },
      },
      semesters: {
        include: {
          modules: true,
        },
      },
    },
  });
}

export async function deleteYear(id: string) {
  return prisma.year.delete({
    where: { id },
  });
}
