import { NextResponse } from "next/server";
import { findOrCreateYear, getYearsByDegree } from "@/lib/db/year.service";
import { getDegreeByNameAndBatch } from "@/lib/db/degree.service";

import { requireAdminAuth } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { batch, degree, yearName } = await request.json();

    if (!batch || !degree || !yearName) {
      return NextResponse.json(
        { success: false, error: "Batch, degree, and year name are required" },
        { status: 400 },
      );
    }

    console.log(`📅 Creating year: ${yearName} in ${degree} (${batch})`);

    // Get the degree record
    const degreeRecord = await getDegreeByNameAndBatch(degree, batch);
    if (!degreeRecord) {
      return NextResponse.json(
        { success: false, error: "Degree not found" },
        { status: 404 },
      );
    }

    // Check if year already exists
    const existingYears = await getYearsByDegree(degreeRecord.id);
    const yearMatch = yearName.match(/Year\s+(\d+)/i);
    const yearNumber = yearMatch ? parseInt(yearMatch[1]) : 1;

    if (existingYears.some((y: any) => y.number === yearNumber)) {
      return NextResponse.json(
        { success: false, error: "Year already exists" },
        { status: 400 },
      );
    }

    // Create year
    const year = await findOrCreateYear(yearName, yearNumber, degreeRecord.id);

    console.log(`✅ Created year: ${year.name} (${year.id})`);

    return NextResponse.json({
      success: true,
      message: "Year created successfully",
      year: {
        id: year.id,
        name: year.name,
        number: year.number,
        degreeId: year.degreeId,
      },
    });
  } catch (error) {
    console.error("Error creating year:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
