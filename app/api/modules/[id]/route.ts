import { NextRequest, NextResponse } from "next/server";
import {
  getModuleById,
  deleteModule,
  findOrCreateModule,
} from "@/lib/db/module.service";
import prisma from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    console.log(`📚 Fetching module: ${id}`);

    const module = await getModuleById(id);

    if (!module) {
      return NextResponse.json(
        { success: false, error: "Module not found" },
        { status: 404 },
      );
    }

    console.log(`✅ Found module: ${module.code}`);

    return NextResponse.json({
      success: true,
      module: {
        id: module.id,
        code: module.code,
        name: module.name,
        credits: module.credits,
        semester: module.semester.name,
        year: module.semester.year.name,
        degree: module.semester.year.degree.name,
        batch: module.semester.year.degree.batch.name,
        grades: module.grades.map((g: any) => ({
          id: g.id,
          grade: g.grade,
          gradePoints: g.gradePoints,
          studentIndexNumber: g.student.indexNumber,
          studentName: g.student.name,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching module:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, credits } = body;

    console.log(`✏️ Updating module: ${id}`);

    const existingModule = await getModuleById(id);
    if (!existingModule) {
      return NextResponse.json(
        { success: false, error: "Module not found" },
        { status: 404 },
      );
    }

    const updatedModule = await prisma.module.update({
      where: { id },
      data: {
        name: name || existingModule.name,
        credits: credits !== undefined ? credits : existingModule.credits,
      },
    });

    console.log(`✅ Updated module: ${updatedModule.code}`);

    return NextResponse.json({
      success: true,
      module: updatedModule,
    });
  } catch (error) {
    console.error("❌ Error updating module:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    console.log(`🗑️ Deleting module: ${id}`);

    const existingModule = await getModuleById(id);
    if (!existingModule) {
      return NextResponse.json(
        { success: false, error: "Module not found" },
        { status: 404 },
      );
    }

    await deleteModule(id);

    console.log(`✅ Deleted module: ${existingModule.code}`);

    return NextResponse.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting module:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
