import prisma from "./prisma";

export async function findOrCreateBatch(name: string) {
  return prisma.batch.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

export async function getAllBatches() {
  return prisma.batch.findMany({
    orderBy: { name: "asc" },
    include: {
      degrees: true,
    },
  });
}

export async function getBatchByName(name: string) {
  return prisma.batch.findUnique({
    where: { name },
    include: {
      degrees: {
        include: {
          years: {
            include: {
              semesters: true,
            },
          },
        },
      },
    },
  });
}

export async function getBatchById(id: string) {
  return prisma.batch.findUnique({
    where: { id },
    include: {
      degrees: {
        include: {
          years: {
            include: {
              semesters: true,
            },
          },
        },
      },
    },
  });
}

export async function deleteBatch(id: string) {
  return prisma.batch.delete({
    where: { id },
  });
}

export async function getBatchesWithStudentCounts() {
  const batches = await prisma.batch.findMany({
    orderBy: { name: "asc" },
    include: {
      degrees: {
        include: {
          _count: {
            select: { students: true },
          },
        },
      },
    },
  });

  return batches.map((batch) => {
    const totalStudents = batch.degrees.reduce((sum, degree) => {
      return sum + degree._count.students;
    }, 0);

    return {
      id: batch.id,
      name: batch.name,
      degreeCount: batch.degrees.length,
      studentCount: totalStudents,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  });
}
