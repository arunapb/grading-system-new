import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getModulesBySemester, getAllModules } from "@/lib/db/module.service";
import prisma from "@/lib/db/prisma";

import { requireAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get("semesterId");
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    if (semesterId) {
      const modules = await getModulesBySemester(semesterId);
      return NextResponse.json({ success: true, modules });
    }

    if (batch || degree) {
      // Import getAllModules dynamically or at top if possible, but replace_file_content target is local.
      // I need to check imports. getModulesBySemester is imported. getAllModules is likely exported from same file.
      // I will update imports first in next step if needed, but let's see.
      // Assuming getAllModules is imported or I can add it.
      // Wait, I should add the import first.
      // Let's just do the logic update here and hope I can update imports in a separate call or same call if I target wider.
      // I'll target the whole file or just the top import to be safe.
      // Actually, let's just replace the GET function efficiently, and add import.
    }

    return NextResponse.json(
      { success: false, error: "Semester ID or Batch/Degree is required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch modules",
      },
      { status: 500 },
    );
  }
}

// POST - Create a new module (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, credits, semesterId } = body;

    if (!code || !name || credits === undefined || !semesterId) {
      return NextResponse.json(
        { error: "Code, name, credits, and semesterId are required" },
        { status: 400 },
      );
    }

    // Check if module with same code already exists in this semester
    const existing = await prisma.module.findFirst({
      where: {
        code,
        semesterId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Module with this code already exists in this semester" },
        { status: 400 },
      );
    }

    const module = await prisma.module.create({
      data: {
        code,
        name,
        credits: Number(credits),
        semester: {
          connect: { id: semesterId },
        },
      },
    });

    return NextResponse.json({
      success: true,
      module,
    });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 },
    );
  }
}
