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
