import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateStudent, validateLecturer, validateAdmin } from "@/lib/auth";

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
          } as any;
        }

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
      }
      return session;
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
