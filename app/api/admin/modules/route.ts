import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getModulesBySemester } from "@/lib/db/module.service";
import prisma from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get("semesterId");

    if (!semesterId) {
      return NextResponse.json(
        { success: false, error: "Semester ID is required" },
        { status: 400 },
      );
    }

    const modules = await getModulesBySemester(semesterId);

    return NextResponse.json({
      success: true,
      modules,
    });
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
