import { NextRequest, NextResponse } from "next/server";
import { getAllStudentsWithCGPA } from "@/lib/db/student.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    // Check for Admin Session to apply scoping
    const session = await getServerSession(authOptions);
    let adminScope:
      | { allowedBatches: string[]; allowedDegrees: string[] }
      | undefined;

    if (
      session?.user &&
      ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)
    ) {
      // Fetch fresh permissions from DB
      // We need the admin ID. If not in session, we use email/username.
      const username = (session.user as any).email;
      if (username) {
        const admin = await prisma.admin.findUnique({
          where: { username },
          select: {
            allowedBatches: { select: { id: true } },
            allowedDegrees: { select: { id: true } },
          },
        });

        if (admin) {
          adminScope = {
            allowedBatches: admin.allowedBatches.map((b) => b.id),
            allowedDegrees: admin.allowedDegrees.map((d) => d.id),
          };
        }
      }
    }

    console.log(
      `👥 Fetching students from database... (batch: ${batch || "all"}, degree: ${degree || "all"})`,
    );

    const students = await getAllStudentsWithCGPA(
      batch || undefined,
      degree || undefined,
      adminScope,
    );

    console.log(`✅ Found ${students.length} students`);

    return NextResponse.json({
      success: true,
      count: students.length,
      students,
      context: batch && degree ? { batch, degree } : null,
    });
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
