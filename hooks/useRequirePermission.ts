"use client";

import { useSession } from "next-auth/react";

type Permission =
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
  | "canManageAdmins"
  | "canAssignModules"
  | "canViewGrades"
  | "canEditGrades";

interface UseRequirePermissionResult {
  isLoading: boolean;
  hasPermission: boolean;
  user: any;
}

/**
 * Hook to check if the current user has a specific permission.
 * Returns permission status for pages to handle their own UI.
 *
 * @param requiredPermission - The permission required to access this page
 */
export function useRequirePermission(
  requiredPermission: Permission,
): UseRequirePermissionResult {
  const { data: session, status } = useSession();

  const user = session?.user as any;
  const isLoading = status === "loading";

  // Check permission - only meaningful when session is loaded
  const hasPermission = (() => {
    // While loading, assume no permission yet (show loading)
    if (status === "loading") return false;
    // Not authenticated - no permission
    if (status !== "authenticated" || !user) return false;
    // Super Admin has all permissions
    if (user.role === "SUPER_ADMIN") return true;
    // Check the specific permission
    return user[requiredPermission] === true;
  })();

  return {
    isLoading,
    hasPermission,
    user,
  };
}

/**
 * Pre-built permission check helpers for common pages
 */
export const useRequireScrapePermission = () =>
  useRequirePermission("canScrape");
export const useRequireParsePDFPermission = () =>
  useRequirePermission("canParsePDF");
export const useRequireManageAdminsPermission = () =>
  useRequirePermission("canManageAdmins");
export const useRequireViewInvitationsPermission = () =>
  useRequirePermission("canViewInvitations");
export const useRequireEditInvitationsPermission = () =>
  useRequirePermission("canEditInvitations");
export const useRequireAssignModulesPermission = () =>
  useRequirePermission("canAssignModules");
export const useRequireEditGradesPermission = () =>
  useRequirePermission("canEditGrades");
