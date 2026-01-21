import prisma from "./prisma";
import { Admin, Role, AccountStatus, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

/**
 * Creates a pending admin and generates an OTP
 */
export async function createAdmin(username: string, name: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await hash("temp-password-" + Date.now(), 10); // temporary

  const admin = await prisma.admin.create({
    data: {
      username,
      name,
      password: hashedPassword,
      status: "PENDING",
      verificationCode: otp,
      role: "ADMIN", // Default role
    },
  });

  return { admin, otp };
}

/**
 * Generates a reset OTP for an existing admin
 */
export async function generateResetOtp(adminId: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: { verificationCode: otp },
  });

  return { admin, otp };
}

/**
 * Verifies OTP and sets new password
 */
export async function verifyAndSetPassword(
  username: string,
  code: string,
  newPassword: string,
) {
  const admin = await prisma.admin.findUnique({
    where: { username },
  });

  if (!admin) throw new Error("Admin not found");

  if (admin.verificationCode !== code) {
    throw new Error("Invalid verification code");
  }

  const hashedPassword = await hash(newPassword, 12);

  return prisma.admin.update({
    where: { id: admin.id },
    data: {
      password: hashedPassword,
      verificationCode: null, // Clear code
      status: "APPROVED", // Ensure approved
    },
  });
}

export async function findAdminByUsername(username: string) {
  return prisma.admin.findUnique({
    where: { username },
  });
}

export async function updateAdminStatus(id: string, status: AccountStatus) {
  return prisma.admin.update({
    where: { id },
    data: { status },
  });
}

export async function getAllAdmins() {
  return prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
  });
}
