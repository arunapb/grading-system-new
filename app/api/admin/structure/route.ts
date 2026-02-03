import { NextResponse } from "next/server";
import { getBatchByName } from "@/lib/db/batch.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getAdminScope } from "@/lib/permissions";

interface Semester {
  id: string;
  name: string;
  number: number;
  modules?: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
  }>;
}

interface Year {
  id: string;
  name: string;
  number: number;
  semesters: Semester[];
}

interface Degree {
  id: string;
  name: string;
  years: Year[];
}

interface BatchStructure {
  batch: string;
  batchId: string;
  degrees: Degree[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchName = searchParams.get("batch");

    if (!batchName) {
      return NextResponse.json(
        { success: false, error: "Batch name is required" },
        { status: 400 },
      );
    }

    console.log(`📂 Fetching structure for batch: ${batchName}`);

    const batch = await getBatchByName(batchName);

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 },
      );
    }

    // Get admin scope for filtering
    const session = await getServerSession(authOptions);
    const adminScope = await getAdminScope(session);

    // Filter degrees based on admin scope
    let filteredDegrees = batch.degrees;

    if (adminScope) {
      const { allowedBatches, allowedDegrees } = adminScope;

      // If admin has access to this batch, show all its degrees
      const hasBatchAccess = allowedBatches.includes(batch.id);

      if (!hasBatchAccess) {
        // Filter to only allowed degrees
        filteredDegrees = batch.degrees.filter((degree: any) =>
          allowedDegrees.includes(degree.id),
        );
      }

      // If no access to batch and no degrees match, deny access
      if (!hasBatchAccess && filteredDegrees.length === 0) {
        return NextResponse.json(
          { success: false, error: "Access denied - batch not in your scope" },
          { status: 403 },
        );
      }
    }

    const structure: BatchStructure = {
      batch: batch.name,
      batchId: batch.id,
      degrees: filteredDegrees.map((degree: any) => ({
        id: degree.id,
        name: degree.name,
        years: degree.years.map((year: any) => ({
          id: year.id,
          name: year.name,
          number: year.number,
          semesters: year.semesters.map((semester: any) => ({
            id: semester.id,
            name: semester.name,
            number: semester.number,
          })),
        })),
      })),
    };

    console.log(
      `✅ Found ${structure.degrees.length} degrees in batch ${batchName}`,
    );

    return NextResponse.json({
      success: true,
      structure,
    });
  } catch (error) {
    console.error("Error fetching structure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
