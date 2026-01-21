import prisma from "./prisma";

export async function findOrCreateDegree(name: string, batchId: string) {
  const degree = await prisma.degree.upsert({
    where: {
      name_batchId: { name, batchId },
    },
    update: {},
    create: { name, batchId },
    include: { years: true },
  });

  // If newly created (or no years exist), seed structure
  if (degree.years.length === 0) {
    for (let i = 1; i <= 4; i++) {
      const year = await prisma.year.create({
        data: {
          name: `Year ${i}`,
          number: i,
          degreeId: degree.id,
        },
      });

      for (let j = 1; j <= 2; j++) {
        await prisma.semester.create({
          data: {
            name: `Semester ${j}`,
            number: j,
            yearId: year.id,
          },
        });
      }
    }
  }

  return degree;
}

export async function getDegreesByBatch(batchId: string) {
  return prisma.degree.findMany({
    where: { batchId },
    orderBy: { name: "asc" },
  });
}

export async function getDegreeByNameAndBatch(name: string, batchName: string) {
  return prisma.degree.findFirst({
    where: {
      name,
      batch: { name: batchName },
    },
    include: {
      batch: true,
      years: {
        include: {
          semesters: {
            include: {
              modules: true,
            },
          },
        },
      },
    },
  });
}

export async function getDegreeById(id: string) {
  return prisma.degree.findUnique({
    where: { id },
    include: {
      batch: true,
      years: {
        include: {
          semesters: {
            include: {
              modules: true,
            },
          },
        },
      },
      _count: {
        select: { students: true },
      },
    },
  });
}

export async function deleteDegree(id: string) {
  return prisma.degree.delete({
    where: { id },
  });
}

export async function getDegreesWithStats(batchId: string) {
  const degrees = await prisma.degree.findMany({
    where: { batchId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { students: true },
      },
      years: {
        include: {
          semesters: {
            include: {
              _count: {
                select: { modules: true },
              },
            },
          },
        },
      },
    },
  });

  return degrees.map((degree) => {
    const totalModules = degree.years.reduce((sum, year) => {
      return (
        sum +
        year.semesters.reduce((semSum, sem) => semSum + sem._count.modules, 0)
      );
    }, 0);

    return {
      id: degree.id,
      name: degree.name,
      studentCount: degree._count.students,
      moduleCount: totalModules,
      yearCount: degree.years.length,
      hasData: totalModules > 0,
    };
  });
}
