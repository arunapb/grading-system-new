import prisma from "./prisma";
import { randomBytes } from "node:crypto";

/**
 * Generate a random 6-character alphanumeric code
 */
function generateCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

/**
 * Create a new invitation for a student
 */
export async function createInvitation(
  studentId: string,
  expiresInMinutes: number = 60,
  maxUses: number = 1,
) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  return prisma.studentInvitation.create({
    data: {
      code,
      studentId,
      expiresAt,
      maxUses,
    },
    include: {
      student: {
        include: {
          degree: {
            include: {
              batch: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get invitation by code
 */
export async function getInvitationByCode(code: string) {
  return prisma.studentInvitation.findUnique({
    where: { code },
    include: {
      student: {
        include: {
          degree: {
            include: {
              batch: true,
            },
          },
          grades: {
            include: {
              module: {
                include: {
                  semester: {
                    include: {
                      year: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Validate an invitation - check if it's valid and not expired/exhausted
 */
export async function validateInvitation(
  code: string,
  checkMaxUses: boolean = true,
): Promise<{
  valid: boolean;
  error?: string;
  invitation?: Awaited<ReturnType<typeof getInvitationByCode>>;
  remainingTime?: number;
}> {
  const invitation = await getInvitationByCode(code);

  if (!invitation) {
    return { valid: false, error: "Invitation not found" };
  }

  const now = new Date();

  // Check if expired
  if (invitation.expiresAt < now) {
    return { valid: false, error: "Invitation has expired" };
  }

  // Check if max uses reached (only if checkMaxUses is true)
  if (checkMaxUses && invitation.useCount >= invitation.maxUses) {
    return { valid: false, error: "Invitation has reached maximum uses" };
  }

  // Calculate remaining time in seconds
  const remainingTime = Math.floor(
    (invitation.expiresAt.getTime() - now.getTime()) / 1000,
  );

  return { valid: true, invitation, remainingTime };
}

/**
 * Mark invitation as accessed (increment use count) with device tracking
 */
export async function incrementInvitationUse(
  id: string,
  trackingData?: {
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    os?: string;
    browser?: string;
  },
) {
  return prisma.studentInvitation.update({
    where: { id },
    data: {
      useCount: { increment: 1 },
      accessedAt: new Date(),
      lastIpAddress: trackingData?.ipAddress,
      lastUserAgent: trackingData?.userAgent,
      lastDevice: trackingData?.device,
      lastOs: trackingData?.os,
      lastBrowser: trackingData?.browser,
    },
  });
}

/**
 * Get all invitations (for admin)
 */
export async function getAllInvitations() {
  return prisma.studentInvitation.findMany({
    include: {
      student: {
        include: {
          degree: {
            include: {
              batch: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(id: string) {
  return prisma.studentInvitation.delete({
    where: { id },
  });
}

/**
 * Get invitations for a specific student
 */
export async function getStudentInvitations(studentId: string) {
  return prisma.studentInvitation.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
}
