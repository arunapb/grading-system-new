import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/db/activity.service";

interface DeleteRequest {
  moduleIds?: string[];
  // Legacy support
  files?: Array<{
    batch: string;
    degree: string;
    year: string;
    semester: string;
    filename: string;
  }>;
}

interface DeleteResult {
  id: string;
  moduleCode: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DeleteRequest = await request.json();

    // Support both new moduleIds and legacy files format
    let moduleIdsToDelete: string[] = [];

    if (body.moduleIds && Array.isArray(body.moduleIds)) {
      moduleIdsToDelete = body.moduleIds;
    } else if (body.files && Array.isArray(body.files)) {
      // Legacy: find modules by path info
      for (const file of body.files) {
        const module = await prisma.module.findFirst({
          where: {
            code: file.filename.replace(".pdf", ""),
            semester: {
              year: {
                degree: {
                  name: file.degree,
                  batch: { name: file.batch },
                },
              },
            },
          },
        });
        if (module) {
          moduleIdsToDelete.push(module.id);
        }
      }
    }

    if (moduleIdsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: "No modules specified for deletion" },
        { status: 400 },
      );
    }

    const results: DeleteResult[] = [];
    let deletedCount = 0;
    let failedCount = 0;

    for (const moduleId of moduleIdsToDelete) {
      try {
        // Get module info before deleting
        const module = await prisma.module.findUnique({
          where: { id: moduleId },
          include: {
            semester: {
              include: {
                year: {
                  include: {
                    degree: {
                      include: {
                        batch: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!module) {
          results.push({
            id: moduleId,
            moduleCode: "unknown",
            success: false,
            error: "Module not found",
          });
          failedCount++;
          continue;
        }

        // Delete module (cascade will delete grades)
        await prisma.module.delete({
          where: { id: moduleId },
        });

        // Log activity
        await logActivity(
          "MODULE_DELETED",
          {
            moduleId,
            moduleCode: module.code,
            moduleName: module.name,
            batch: module.semester.year.degree.batch.name,
            degree: module.semester.year.degree.name,
            year: module.semester.year.name,
            semester: module.semester.name,
          },
          true,
        );

        results.push({
          id: moduleId,
          moduleCode: module.code,
          success: true,
        });
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting module ${moduleId}:`, error);
        results.push({
          id: moduleId,
          moduleCode: "unknown",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failedCount++;

        // Log failed deletion
        await logActivity(
          "MODULE_DELETE_FAILED",
          {
            moduleId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          false,
        );
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
