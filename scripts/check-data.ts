import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const indexNumber = process.argv[2];
  if (!indexNumber) {
    console.error("Please provide an index number");
    process.exit(1);
  }

  console.log(`Checking for student: ${indexNumber}`);

  const students = await prisma.student.findMany({
    where: {
      indexNumber: {
        equals: indexNumber,
        mode: "insensitive",
      },
    },
    include: {
      degree: {
        include: {
          batch: true,
        },
      },
    },
  });

  if (students.length === 0) {
    console.log("No students found with that index number.");
  } else {
    console.log(`Found ${students.length} student(s):`);
    students.forEach((s) => {
      console.log(`- ID: ${s.id}`);
      console.log(`  Name: ${s.name}`);
      console.log(`  Index: ${s.indexNumber}`);
      console.log(`  Degree: ${s.degree.name} (ID: ${s.degree.id})`);
      console.log(`  Batch: ${s.degree.batch.name} (ID: ${s.degree.batchId})`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
