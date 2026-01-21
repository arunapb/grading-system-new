import prisma from "./prisma";
import { AccountStatus } from "@prisma/client";
import { hash } from "bcryptjs";

/**
 * Creates a new admin with password
 */
export async function createAdmin(
  username: string,
  name: string,
  password: string,
) {
  const hashedPassword = await hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      username,
      name,
      password: hashedPassword,
      status: "APPROVED",
      role: "ADMIN",
    },
  });

  return admin;
}

/**
 * Generates a reset code for an existing admin
 */
export async function generateResetCode(
  adminId: string,
  expiresInMinutes: number = 30,
) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: {
      resetCode: code,
      resetCodeExpiresAt: expiresAt,
    },
  });

  return { admin, code, expiresAt };
}

/**
 * Verifies reset code and sets new password
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

  if (!admin.resetCode || admin.resetCode !== code.toUpperCase()) {
    throw new Error("Invalid reset code");
  }

  if (!admin.resetCodeExpiresAt || admin.resetCodeExpiresAt < new Date()) {
    throw new Error("Reset code has expired");
  }

  const hashedPassword = await hash(newPassword, 12);

  return prisma.admin.update({
    where: { id: admin.id },
    data: {
      password: hashedPassword,
      resetCode: null,
      resetCodeExpiresAt: null,
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
