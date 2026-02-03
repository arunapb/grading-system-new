import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "@/lib/permissions";
import prisma from "@/lib/db/prisma";

// GET - Get students filtered by batch and degree (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check for canViewStudents permission
    const permResult = await checkPermission("canViewStudents");
    if (!permResult.authorized) {
      return permResult.response;
    }

    const { searchParams } = new URL(request.url);
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    // Fetch admin's scope restrictions
    const user = permResult.session.user as any;
    let adminScope:
      | { allowedBatches: string[]; allowedDegrees: string[] }
      | undefined;

    // Only apply scope for non-super admins
    if (user.role !== "SUPER_ADMIN") {
      const admin = await prisma.admin.findUnique({
        where: { username: user.email },
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

    // Build where clause
    const where: any = {};

    // Apply batch/degree filter from query params
    if (batch && degree) {
      where.degree = {
        name: degree,
        batch: {
          name: batch,
        },
      };
    } else if (batch) {
      where.degree = {
        batch: {
          name: batch,
        },
      };
    } else if (degree) {
      where.degree = {
        name: degree,
      };
    }

    // Apply admin scope restrictions
    if (adminScope) {
      const { allowedBatches, allowedDegrees } = adminScope;
      const hasBatches = allowedBatches && allowedBatches.length > 0;
      const hasDegrees = allowedDegrees && allowedDegrees.length > 0;

      if (hasBatches || hasDegrees) {
        // Use AND logic: Student must be in an allowed batch AND an allowed degree
        // If admin only has batch restrictions, apply batch filter
        // If admin only has degree restrictions, apply degree filter
        // If admin has both, apply both filters (AND)
        const scopeConditions: any[] = [];

        if (hasBatches) {
          scopeConditions.push({ degree: { batchId: { in: allowedBatches } } });
        }
        if (hasDegrees) {
          scopeConditions.push({ degreeId: { in: allowedDegrees } });
        }

        // Combine with existing where clause using AND (all conditions must match)
        if (!where.AND) {
          where.AND = [];
        }
        where.AND.push(...scopeConditions);
      } else {
        // Admin has scope defined but no allowed batches/degrees -> return nothing

        where.AND = [{ id: "__BLOCK_ALL__" }];
      }
    } else {
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        indexNumber: true,
        name: true,
        photoUrl: true,
        degree: {
          select: {
            name: true,
            batch: {
              select: {
                name: true,
              },
            },
          },
        },
        grades: {
          select: {
            gradePoints: true,
            grade: true,
            module: {
              select: {
                credits: true,
              },
            },
          },
        },
      },
      orderBy: {
        indexNumber: "asc",
      },
    });

    // Calculate CGPA for each student
    const studentsWithCGPA = students.map((student: any) => {
      // Logic copied from gpa-calculator.ts / student.service.ts
      // Filter out non-GPA grades (P, N, W)
      const validGrades = student.grades.filter((g: any) => {
        const gradeLetter = g.grade?.toUpperCase().trim() || "";
        return !["P", "N", "W", "PENDING"].includes(gradeLetter);
      });

      const totalCredits = validGrades.reduce(
        (sum: number, g: any) => sum + g.module.credits,
        0,
      );

      const totalPoints = validGrades.reduce(
        (sum: number, g: any) => sum + (g.gradePoints ?? 0) * g.module.credits,
        0,
      );

      const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

      return {
        id: student.id,
        indexNumber: student.indexNumber,
        name: student.name,
        photoUrl: student.photoUrl,
        cgpa: Math.round(cgpa * 10000) / 10000,
        totalCredits,
        batch: student.degree.batch.name,
        degree: student.degree.name,
        moduleCount: student.grades.length, // Add module count for display
      };
    });

    return NextResponse.json({
      success: true,
      students: studentsWithCGPA,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
