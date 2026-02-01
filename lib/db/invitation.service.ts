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
/**
 * Create a new invitation for a student
 */
export async function createInvitation(
  studentId: string,
  absoluteExpirationMinutes: number = 43200, // Default 30 days
  validDurationMinutes: number = 60,
  maxUses: number = 1,
) {
  const code = generateCode();
  // Absolute expiration date (e.g. valid for 30 days from creation)
  const expiresAt = new Date(
    Date.now() + absoluteExpirationMinutes * 60 * 1000,
  );

  return prisma.studentInvitation.create({
    data: {
      code,
      studentId,
      expiresAt,
      validDuration: validDurationMinutes,
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

  // 1. Check absolute expiration deadline
  if (invitation.expiresAt && invitation.expiresAt < now) {
    return {
      valid: false,
      error: "Invitation link has expired (Deadline passed)",
    };
  }

  // 2. Check session duration (if already accessed)
  if (invitation.accessedAt) {
    const sessionExpiresAt = new Date(
      invitation.accessedAt.getTime() + invitation.validDuration * 60 * 1000,
    );
    if (sessionExpiresAt < now) {
      return { valid: false, error: "Invitation session has expired" };
    }
  }

  // Check if max uses reached (only if checkMaxUses is true)
  if (checkMaxUses && invitation.useCount >= invitation.maxUses) {
    return { valid: false, error: "Invitation has reached maximum uses" };
  }

  // Calculate remaining time in seconds
  // It is the minimum of (Absolute Expiry - Now) and (Session Expiry - Now)
  let absoluteRemaining = Infinity;
  if (invitation.expiresAt) {
    absoluteRemaining = Math.floor(
      (invitation.expiresAt.getTime() - now.getTime()) / 1000,
    );
  }

  let sessionRemaining = absoluteRemaining;
  if (invitation.accessedAt) {
    sessionRemaining = Math.floor(
      (invitation.accessedAt.getTime() +
        invitation.validDuration * 60 * 1000 -
        now.getTime()) /
        1000,
    );
  } else {
    // If not accessed yet, the potential session duration is the full length
    sessionRemaining = invitation.validDuration * 60;
  }

  // Return the smaller of the two (but ensure non-negative)
  const remainingTime = Math.max(
    0,
    Math.min(absoluteRemaining, sessionRemaining),
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
  // First fetch the invitation to check if it's the first access
  const invitation = await prisma.studentInvitation.findUnique({
    where: { id },
  });

  if (!invitation) throw new Error("Invitation not found");

  const updateData: any = {
    useCount: { increment: 1 },
    accessedAt: new Date(), // Always update accessedAt to latest access? Or first access?
    // Usually accessedAt means "First Accessed At" if we want to track start time.
    // But the requirements say "count after open this invitation".
    // So distinct logic:
    // 1. If accessedAt is null, SET it and SET expiresAt.
    // 2. Always update tracking info.
    lastIpAddress: trackingData?.ipAddress,
    lastUserAgent: trackingData?.userAgent,
    lastDevice: trackingData?.device,
    lastOs: trackingData?.os,
    lastBrowser: trackingData?.browser,
  };

  // If this is the FIRST access (accessedAt is null), start the timer
  if (!invitation.accessedAt) {
    // We set the FIRST access timestamp
    // (Note: The update below will overwrite accessedAt with NOW, which is correct for "First")
    // But wait, if I want `accessedAt` to be *first* access, I should only set it if it's null.
    // However, the `updateData` above has `accessedAt: new Date()`.
    // I should change that logic.

    // Let's keep `accessedAt` as "First Accessed".
    // And maybe `updatedAt` accounts for latest?
    // Schema doesn't have `updatedAt` for invitation.
    // The previous code was `accessedAt: new Date()`, which implies "Last Accessed".
    // But for expiration logic "from open", we need the START time.
    // Let's assume `accessedAt` in the schema is "First Accessed" based on my new requirement.
    // Or I should check if schema has `accessedAt` defined as just DateTime?.

    // I will treat `accessedAt` as "First Access Time" (Start of timer).
    updateData.accessedAt = new Date(); // This sets it.

    // Calculate expiration
    const expiresAt = new Date(
      Date.now() + invitation.validDuration * 60 * 1000,
    );
    updateData.expiresAt = expiresAt;
  } else {
    // If already accessed, DO NOT update accessedAt (keep the start time)
    // UNLESS we want `accessedAt` to mean "Last Accessed".
    // But we need the start time.
    // Let's look at the schema: `accessedAt DateTime? // When the student first accessed`
    // The comment says "When the student FIRST accessed".
    // So I should NOT update it on subsequent accesses.
    delete updateData.accessedAt;
  }

  return prisma.studentInvitation.update({
    where: { id },
    data: updateData,
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
