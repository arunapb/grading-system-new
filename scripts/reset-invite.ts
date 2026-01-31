import dotenv from "dotenv";
dotenv.config();
import prisma from "@/lib/db/prisma";

async function main() {
  const code = "3BC75E";
  console.log(`Resetting invitation usage for code: ${code}`);

  // Using camelCase 'studentInvitation' as per Prisma convention for model 'StudentInvitation'
  const update = await prisma.studentInvitation.updateMany({
    where: { code: code },
    data: {
      useCount: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  if (update.count > 0) {
    console.log("SUCCESS: Invitation reset.");
  } else {
    console.error("FAILURE: Invitation not found (or already valid).");
    // Try finding it to debug
    const inv = await prisma.studentInvitation.findFirst({ where: { code } });
    console.log("Found invitation:", inv);
  }
}

main()
  .catch((e) => {
    console.error("Script error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
