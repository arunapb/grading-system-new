import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { moduleId, moduleCode, moduleName, credits } = body;

    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: "Missing moduleId parameter" },
        { status: 400 },
      );
    }

    console.log(`✏️ Updating metadata for module: ${moduleId}`);

    // Check if module exists
    const existingModule = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!existingModule) {
      return NextResponse.json(
        { success: false, error: "Module not found" },
        { status: 404 },
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (moduleCode !== undefined) updateData.code = moduleCode;
    if (moduleName !== undefined) updateData.name = moduleName;
    if (credits !== undefined) updateData.credits = credits;

    // Update module in database
    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: updateData,
    });

    console.log(`✅ Updated metadata for ${updatedModule.code}`);

    return NextResponse.json({
      success: true,
      message: "Metadata updated successfully",
      module: {
        id: updatedModule.id,
        code: updatedModule.code,
        name: updatedModule.name,
        credits: updatedModule.credits,
      },
    });
  } catch (error) {
    console.error("❌ Error updating metadata:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
