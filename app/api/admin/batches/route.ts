import { NextResponse } from "next/server";
import {
  findOrCreateBatch,
  getBatchesWithStudentCounts,
} from "@/lib/db/batch.service";
import { getAllStudentsWithCGPA } from "@/lib/db/student.service";

import { requireAdminAuth } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    console.log("📦 Fetching available batches from database...");

    const batches = await getBatchesWithStudentCounts();

    // Get top students for each batch
    const batchesWithTopStudents = await Promise.all(
      batches.map(
        async (batch: {
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
            const students = await getAllStudentsWithCGPA(batch.name);

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
