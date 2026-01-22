import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateStudent, validateLecturer, validateAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/db/activity.service";
import { headers } from "next/headers";

export const authOptions: NextAuthOptions = {
  providers: [
    // Student Login
    CredentialsProvider({
      id: "student",
      name: "Student",
      credentials: {
        batch: { label: "Batch", type: "text" },
        degree: { label: "Degree", type: "text" },
        indexNumber: { label: "Index Number", type: "text" },
      },
      async authorize(credentials) {
        console.log("Student authorize called with:", credentials);

        if (
          !credentials?.batch ||
          !credentials?.degree ||
          !credentials?.indexNumber
        ) {
          console.log("Missing credentials");
          return null;
        }

        const student = await validateStudent(
          credentials.batch,
          credentials.degree,
          credentials.indexNumber,
        );

        console.log("Validation result:", student);

        if (student) {
          return {
            id: student.indexNumber,
            name: student.name,
            type: "student",
            batch: student.batch,
            degree: student.degree,
            indexNumber: student.indexNumber,
          } as any;
        }

        // Log failed student login attempt
        await logActivity(
          "LOGIN_FAILED",
          {
            userType: "student",
            indexNumber: credentials.indexNumber,
            batch: credentials.batch,
            degree: credentials.degree,
            reason: "Invalid credentials or student not approved",
            timestamp: new Date().toISOString(),
          },
          false,
        );

        return null;
      },
    }),
    // Lecturer Login
    CredentialsProvider({
      id: "lecturer",
      name: "Lecturer",
      credentials: {
        code: { label: "Lecture Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.code) {
          return null;
        }

        const isValid = validateLecturer(credentials.code);

        if (isValid) {
          return {
            id: credentials.code,
            name: `Lecturer ${credentials.code}`,
            type: "lecturer",
            lectureCode: credentials.code,
          } as any;
        }

        return null;
      },
    }),
    // Admin Login
    CredentialsProvider({
      id: "admin",
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const admin = await validateAdmin(
          credentials.username,
          credentials.password,
        );

        if (admin) {
          return {
            id: admin.id,
            name: admin.name,
            email: admin.username, // NextAuth expects email field
            type: "admin",
            role: admin.role,
            status: admin.status,
            // Permissions
            canViewStructure: admin.canViewStructure,
            canEditStructure: admin.canEditStructure,
            canViewStudents: admin.canViewStudents,
            canEditStudents: admin.canEditStudents,
            canViewModules: admin.canViewModules,
            canEditModules: admin.canEditModules,
            canViewInvitations: admin.canViewInvitations,
            canEditInvitations: admin.canEditInvitations,
            canScrape: admin.canScrape,
            canParsePDF: admin.canParsePDF,
            canManageAdmins: admin.canManageAdmins,
          } as any;
        }

        // Log failed admin login attempt
        await logActivity(
          "LOGIN_FAILED",
          {
            userType: "admin",
            username: credentials.username,
            reason: "Invalid credentials or admin not approved",
            timestamp: new Date().toISOString(),
          },
          false,
        );

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.type = (user as any).type;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.batch = (user as any).batch;
        token.degree = (user as any).degree;
        token.indexNumber = (user as any).indexNumber;
        token.lectureCode = (user as any).lectureCode;
        // Permissions
        token.canViewStructure = (user as any).canViewStructure;
        token.canEditStructure = (user as any).canEditStructure;
        token.canViewStudents = (user as any).canViewStudents;
        token.canEditStudents = (user as any).canEditStudents;
        token.canViewModules = (user as any).canViewModules;
        token.canEditModules = (user as any).canEditModules;
        token.canViewInvitations = (user as any).canViewInvitations;
        token.canEditInvitations = (user as any).canEditInvitations;
        token.canScrape = (user as any).canScrape;
        token.canParsePDF = (user as any).canParsePDF;
        token.canManageAdmins = (user as any).canManageAdmins;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).type = token.type;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).batch = token.batch;
        (session.user as any).degree = token.degree;
        (session.user as any).indexNumber = token.indexNumber;
        (session.user as any).lectureCode = token.lectureCode;
        // Permissions
        (session.user as any).canViewStructure = token.canViewStructure;
        (session.user as any).canEditStructure = token.canEditStructure;
        (session.user as any).canViewStudents = token.canViewStudents;
        (session.user as any).canEditStudents = token.canEditStudents;
        (session.user as any).canViewModules = token.canViewModules;
        (session.user as any).canEditModules = token.canEditModules;
        (session.user as any).canViewInvitations = token.canViewInvitations;
        (session.user as any).canEditInvitations = token.canEditInvitations;
        (session.user as any).canScrape = token.canScrape;
        (session.user as any).canParsePDF = token.canParsePDF;
        (session.user as any).canManageAdmins = token.canManageAdmins;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      const userType = (user as any).type;
      const role = (user as any).role;

      const headersList = await headers();
      const userAgent = headersList.get("user-agent") || "Unknown";
      const forwardedFor = headersList.get("x-forwarded-for");
      const ip = forwardedFor ? forwardedFor.split(",")[0] : "Unknown";

      await logActivity("USER_LOGIN", {
        userId: user.id,
        userName: user.name,
        userType: userType,
        role: role || userType, // For admins use role, for others use type
        provider: account?.provider,
        userAgent,
        ip,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut({ token }) {
      if (token) {
        await logActivity("USER_LOGOUT", {
          userId: token.sub,
          userName: token.name,
          userType: token.type,
          role: (token as any).role || token.type,
          timestamp: new Date().toISOString(),
        });
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
