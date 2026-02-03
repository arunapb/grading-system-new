import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export type Permission =
  | "canViewStructure"
  | "canEditStructure"
  | "canViewStudents"
  | "canEditStudents"
  | "canViewModules"
  | "canEditModules"
  | "canViewInvitations"
  | "canEditInvitations"
  | "canScrape"
  | "canParsePDF"
  | "canManageAdmins";

/**
 * Check if the current admin has the required permission.
 * Returns the session if authorized, or a NextResponse with 403 if not.
 */
export async function checkPermission(
  requiredPermission: Permission,
): Promise<
  | { authorized: true; session: any }
  | { authorized: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      authorized: false,
      response: new NextResponse("Unauthorized", { status: 401 }),
    };
  }

  const user = session.user as any;

  // Super Admin has all permissions
  if (user.role === "SUPER_ADMIN") {
    return { authorized: true, session };
  }

  // Check if admin is approved
  if (user.type !== "admin" || user.status !== "APPROVED") {
    return {
      authorized: false,
      response: new NextResponse("Unauthorized", { status: 403 }),
    };
  }

  // Check specific permission
  if (!user[requiredPermission]) {
    return {
      authorized: false,
      response: new NextResponse(
        `Forbidden: Missing permission '${requiredPermission}'`,
        { status: 403 },
      ),
    };
  }

  return { authorized: true, session };
}

/**
 * Check if admin has any of the required permissions
 */
export async function checkAnyPermission(
  requiredPermissions: Permission[],
): Promise<
  | { authorized: true; session: any }
  | { authorized: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      authorized: false,
      response: new NextResponse("Unauthorized", { status: 401 }),
    };
  }

  const user = session.user as any;

  // Super Admin has all permissions
  if (user.role === "SUPER_ADMIN") {
    return { authorized: true, session };
  }

  // Check if admin is approved
  if (user.type !== "admin" || user.status !== "APPROVED") {
    return {
      authorized: false,
      response: new NextResponse("Unauthorized", { status: 403 }),
    };
  }

  // Check if any permission matches
  const hasPermission = requiredPermissions.some((perm) => user[perm]);
  if (!hasPermission) {
    return {
      authorized: false,
      response: new NextResponse(
        `Forbidden: Missing one of permissions: ${requiredPermissions.join(", ")}`,
        { status: 403 },
      ),
    };
  }

  return { authorized: true, session };
}

/**
 * Get admin's scope (allowed batches and degrees).
 * Returns undefined for Super Admin (full access).
 * Returns { allowedBatches, allowedDegrees } for restricted admins.
 * Returns { allowedBatches: [], allowedDegrees: [] } if admin has no access.
 */
export async function getAdminScope(session: any): Promise<
  | {
      allowedBatches: string[];
      allowedDegrees: string[];
    }
  | undefined
> {
  // Import prisma dynamically to avoid circular deps
  const prisma = (await import("@/lib/db/prisma")).default;

  const user = session?.user as any;

  if (!user) return undefined;

  // Super Admin has full access - return undefined
  if (user.role === "SUPER_ADMIN") {
    return undefined;
  }

  // For regular admins, fetch their scope
  const admin = await prisma.admin.findUnique({
    where: { username: user.email },
    select: {
      allowedBatches: { select: { id: true } },
      allowedDegrees: { select: { id: true } },
    },
  });

  if (!admin) {
    // Admin not found - return empty (no access)
    return { allowedBatches: [], allowedDegrees: [] };
  }

  const allowedBatches = admin.allowedBatches.map((b) => b.id);
  const allowedDegrees = admin.allowedDegrees.map((d) => d.id);

  // If both are empty, it means full access (by our design)
  if (allowedBatches.length === 0 && allowedDegrees.length === 0) {
    return undefined;
  }

  return { allowedBatches, allowedDegrees };
}

/**
 * Check if a student is within the admin's scope.
 * Returns true if accessible, false otherwise.
 */
export async function isStudentInScope(
  studentDegreeId: string,
  studentBatchId: string,
  adminScope:
    | { allowedBatches: string[]; allowedDegrees: string[] }
    | undefined,
): Promise<boolean> {
  // No scope = full access
  if (!adminScope) return true;

  const { allowedBatches, allowedDegrees } = adminScope;

  // Check if student's degree is in allowed degrees
  if (allowedDegrees.length > 0 && allowedDegrees.includes(studentDegreeId)) {
    return true;
  }

  // Check if student's batch is in allowed batches
  if (allowedBatches.length > 0 && allowedBatches.includes(studentBatchId)) {
    return true;
  }

  // If we have scope restrictions and student matches none, deny access
  return false;
}
