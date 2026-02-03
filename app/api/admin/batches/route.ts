import { NextResponse } from "next/server";
import {
  findOrCreateBatch,
  getBatchesWithStudentCounts,
} from "@/lib/db/batch.service";
import { getAllStudentsWithCGPA } from "@/lib/db/student.service";
import { logActivity } from "@/lib/db/activity.service";
import { getGeoLocation } from "@/lib/geolocation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db/prisma";

import { requireAdminAuth } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    console.log("📦 Fetching available batches from database...");

    const session = await getServerSession(authOptions);
    let adminScope:
      | { allowedBatches: string[]; allowedDegrees: string[] }
      | undefined;
    let accessibleBatchIds = new Set<string>();
    let isRestricted = false;

    if (
      session?.user &&
      ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)
    ) {
      const username = (session.user as any).email;
      if (username) {
        const admin = await prisma.admin.findUnique({
          where: { username },
          select: {
            allowedBatches: { select: { id: true } },
            allowedDegrees: { select: { id: true, batchId: true } },
          },
        });

        if (admin) {
          const batchIds = admin.allowedBatches.map((b) => b.id);
          const degreeIds = admin.allowedDegrees.map((d) => d.id);

          if (batchIds.length > 0 || degreeIds.length > 0) {
            isRestricted = true;
            // Batches explicitly allowed
            batchIds.forEach((id) => accessibleBatchIds.add(id));
            // Batches allowed via degrees
            admin.allowedDegrees.forEach((d) =>
              accessibleBatchIds.add(d.batchId),
            );
          }

          adminScope = {
            allowedBatches: batchIds,
            allowedDegrees: degreeIds,
          };
        }
      }
    }

    let batches = await getBatchesWithStudentCounts();

    // Filter batches if restricted
    if (isRestricted) {
      batches = batches.filter((b) => accessibleBatchIds.has(b.id));
    }

    // Get top students for each batch
    const batchesWithTopStudents = await Promise.all(
      batches.map(
        async (batch: {
          id: string;
          name: string;
          degreeCount: number;
          studentCount: number;
        }) => {
          let topGPA = 0;
          let top3Students: Array<{
            indexNumber: string;
            name: string | null;
            cgpa: number;
          }> = [];

          try {
            const students = await getAllStudentsWithCGPA(
              batch.name,
              undefined,
              adminScope, // Pass scope to filter students potentially?
              // Note: If we already filtered the batch list, we are iterating over allowed batches.
              // But 'allowedDegrees' might further restrict within that batch.
              // So passing adminScope is critical.
            );

            if (students.length > 0) {
              topGPA = students[0].cgpa;
              top3Students = students.slice(0, 3).map((s: any) => ({
                indexNumber: s.indexNumber,
                name: s.name || s.indexNumber,
                cgpa: s.cgpa,
              }));
            }
          } catch (error) {
            console.error(`Error getting students for ${batch.name}:`, error);
          }

          return {
            id: batch.id,
            name: batch.name,
            degrees: batch.degreeCount,
            studentCount: batch.studentCount,
            topGPA,
            top3Students,
          };
        },
      ),
    );

    console.log(`✅ Found ${batches.length} batches`);

    return NextResponse.json({
      success: true,
      batches: batchesWithTopStudents,
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { batchName } = await request.json();

    if (!batchName || typeof batchName !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid batch name" },
        { status: 400 },
      );
    }

    // Create batch in database
    const batch = await findOrCreateBatch(batchName);

    console.log(`✅ Created/found batch: ${batch.name}`);

    console.log(`✅ Created/found batch: ${batch.name}`);

    // Get session for logging
    const session = await getServerSession(authOptions);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown";
    const geo = await getGeoLocation(ip);

    await logActivity("BATCH_CREATED", {
      batchId: batch.id,
      batchName: batch.name,
      createdBy: session?.user?.name || "Unknown",
      role: (session?.user as any)?.role,
      geo,
    });

    return NextResponse.json({
      success: true,
      message: "Batch created successfully",
      batch: {
        id: batch.id,
        name: batch.name,
      },
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
