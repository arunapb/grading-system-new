import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "superadmin";
  const password = process.env.ADMIN_PASSWORD || "password";
  const hashedPassword = await hash(password, 12);

  const superAdmin = await prisma.admin.upsert({
    where: { username },
    update: {
      password: hashedPassword,
    },
    create: {
      username,
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "APPROVED",
    },
  });

  console.log("Super admin created/updated:", {
    username: superAdmin.username,
    name: superAdmin.name,
    role: superAdmin.role,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
