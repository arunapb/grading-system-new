import { NextResponse } from "next/server";
import {
  findOrCreateDegree,
  getDegreeByNameAndBatch,
} from "@/lib/db/degree.service";
import { getBatchByName, findOrCreateBatch } from "@/lib/db/batch.service";

import { requireAdminAuth } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { batch, degreeName } = await request.json();

    if (!batch || !degreeName) {
      return NextResponse.json(
        { success: false, error: "Batch and degree name are required" },
        { status: 400 },
      );
    }

    console.log(`🎓 Creating degree: ${degreeName} in batch: ${batch}`);

    // Check if degree already exists
    const existingDegree = await getDegreeByNameAndBatch(degreeName, batch);
    if (existingDegree) {
      return NextResponse.json(
        { success: false, error: "Degree already exists" },
        { status: 400 },
      );
    }

    // Get or create batch first
    const batchRecord = await findOrCreateBatch(batch);

    // Create degree
    const degree = await findOrCreateDegree(degreeName, batchRecord.id);

    console.log(`✅ Created degree: ${degree.name} (${degree.id})`);

    return NextResponse.json({
      success: true,
      message: "Degree created successfully",
      degree: {
        id: degree.id,
        name: degree.name,
        batchId: degree.batchId,
      },
    });
  } catch (error) {
    console.error("Error creating degree:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
