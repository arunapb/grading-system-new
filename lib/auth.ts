import { compare } from "bcryptjs";
import prisma from "./db/prisma";

/**
 * Validate student credentials
 * @param batch - Batch name (e.g., "batch 21")
 * @param degree - Degree name (e.g., "IT")
 * @param indexNumber - Student index number
 * @returns Student data if valid, null otherwise
 */
export async function validateStudent(
  batch: string,
  degree: string,
  indexNumber: string,
) {
  try {
    console.log("Validating student:", { batch, degree, indexNumber });

    const student = await prisma.student.findFirst({
      where: {
        indexNumber,
        degree: {
          name: degree,
          batch: {
            name: batch,
          },
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

    if (student && student.status === "APPROVED") {
      return {
        indexNumber: student.indexNumber,
        name: student.name,
        batch: student.degree.batch.name,
        degree: student.degree.name,
        status: student.status,
        role: "STUDENT",
      };
    }

    if (student && student.status !== "APPROVED") {
      console.log(`Student ${indexNumber} is ${student.status}`);
      return null; // Or handle specific status error in NextAuth
    }

    console.log("Student not found or invalid credentials");
    return null;
  } catch (error) {
    console.error("Error validating student:", error);
    return null;
  }
}

/**
 * Validate lecturer credentials (kept as is for now, or update if requirements change)
 * @param code - Lecture code
 * @returns True if valid, false otherwise
 */
export function validateLecturer(code: string): boolean {
  const validCodes = [
    process.env.LECTURE_CODE1,
    process.env.LECTURE_CODE2,
    process.env.LECTURE_CODE3,
  ];

  return validCodes.includes(code);
}

/**
 * Validate admin credentials
 * @param username - Admin username (or email)
 * @param password - Admin password
 * @returns Admin data if valid, null otherwise
 */
export async function validateAdmin(username: string, password: string) {
  try {
    // Try to find by username first, then by email
    let admin = await prisma.admin.findUnique({
      where: { username },
    });

    // If not found by username, return null (no email field anymore)
    if (!admin) {
      return null;
    }

    if (!admin) {
      return null;
    }

    const isValid = await compare(password, admin.password);

    if (isValid && admin.status === "APPROVED") {
      return {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role, // SUPER_ADMIN or ADMIN
        status: admin.status,
        canViewStructure: (admin as any).canViewStructure,
        canEditStructure: (admin as any).canEditStructure,
        canViewStudents: (admin as any).canViewStudents,
        canEditStudents: (admin as any).canEditStudents,
        canViewModules: (admin as any).canViewModules,
        canEditModules: (admin as any).canEditModules,
        canViewInvitations: (admin as any).canViewInvitations,
        canEditInvitations: (admin as any).canEditInvitations,
        canScrape: (admin as any).canScrape,
        canParsePDF: (admin as any).canParsePDF,
        canManageAdmins: (admin as any).canManageAdmins,
      };
    }

    return null;
  } catch (error) {
    console.error("Error validating admin:", error);
    return null;
  }
}

/**
 * Get available batches from database
 */
export async function getAvailableBatches(): Promise<string[]> {
  try {
    const batches = await prisma.batch.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return batches.map((b: any) => b.name);
  } catch (error) {
    console.error("Error getting batches:", error);
    return [];
  }
}

/**
 * Get available degrees for a batch from database
 */
export async function getAvailableDegrees(batch: string): Promise<string[]> {
  try {
    const batchData = await prisma.batch.findUnique({
      where: { name: batch },
      include: {
        degrees: {
          select: { name: true },
          orderBy: { name: "asc" },
        },
      },
    });

    return batchData?.degrees.map((d: any) => d.name) || [];
  } catch (error) {
    console.error("Error getting degrees:", error);
    return [];
  }
}

/**
 * Require admin authentication for API routes
 * Only returns true if user is ADMIN or SUPER_ADMIN
 */
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

export async function requireAdminAuth() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)
  ) {
    return false;
  }

  return true;
}

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !session.user ||
    !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)
  ) {
    return null;
  }
  return session;
}
