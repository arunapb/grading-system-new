import { NextResponse } from "next/server";
import { updateModule, deleteModule } from "@/lib/db/module.service";
import prisma from "@/lib/db/prisma";
import { findSemesterByYearAndSemesterNumber } from "@/lib/db/semester.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: {
      code?: string;
      name?: string;
      credits?: number;
      semesterId?: string;
    } = {};

    if (body.code !== undefined) updateData.code = body.code;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.credits !== undefined) updateData.credits = body.credits;

    if (body.yearNumber !== undefined && body.semesterNumber !== undefined) {
      const current = await prisma.module.findUnique({
        where: { id },
        include: { semester: { include: { year: true } } },
      });
      if (!current) {
        return NextResponse.json(
          { success: false, error: "Module not found" },
          { status: 404 },
        );
      }
      const degreeId = current.semester.year.degreeId;
      const semester = await findSemesterByYearAndSemesterNumber(
        degreeId,
        body.yearNumber,
        body.semesterNumber,
      );
      if (!semester) {
        return NextResponse.json(
          { success: false, error: "Target semester not found" },
          { status: 404 },
        );
      }
      updateData.semesterId = semester.id;
    }

    const updatedModule = await updateModule(id, updateData);

    return NextResponse.json({
      success: true,
      module: updatedModule,
    });
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update module",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    await deleteModule(id);

    return NextResponse.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete module",
      },
      { status: 500 },
    );
  }
}
