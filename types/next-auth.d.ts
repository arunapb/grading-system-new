import { DefaultSession, DefaultUser } from "next-auth";
import { Role, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      type: string;
      role?: Role;
      status?: AccountStatus;
      batch?: string;
      degree?: string;
      indexNumber?: string;
      lectureCode?: string;
      // Permissions
      canViewStructure?: boolean;
      canEditStructure?: boolean;
      canViewStudents?: boolean;
      canEditStudents?: boolean;
      canViewModules?: boolean;
      canEditModules?: boolean;
      canViewInvitations?: boolean;
      canEditInvitations?: boolean;
      canScrape?: boolean;
      canParsePDF?: boolean;
      canManageAdmins?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    type: string;
    role?: Role;
    status?: AccountStatus;
    batch?: string;
    degree?: string;
    indexNumber?: string;
    lectureCode?: string;
    // Permissions
    canViewStructure?: boolean;
    canEditStructure?: boolean;
    canViewStudents?: boolean;
    canEditStudents?: boolean;
    canViewModules?: boolean;
    canEditModules?: boolean;
    canViewInvitations?: boolean;
    canEditInvitations?: boolean;
    canScrape?: boolean;
    canParsePDF?: boolean;
    canManageAdmins?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    type: string;
    role?: Role;
    status?: AccountStatus;
    batch?: string;
    degree?: string;
    indexNumber?: string;
    lectureCode?: string;
    // Permissions
    canViewStructure?: boolean;
    canEditStructure?: boolean;
    canViewStudents?: boolean;
    canEditStudents?: boolean;
    canViewModules?: boolean;
    canEditModules?: boolean;
    canViewInvitations?: boolean;
    canEditInvitations?: boolean;
    canScrape?: boolean;
    canParsePDF?: boolean;
    canManageAdmins?: boolean;
  }
}
