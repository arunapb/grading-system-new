import { NextRequest, NextResponse } from "next/server";
import { getYearsByDegree, findOrCreateYear } from "@/lib/db/year.service";
import { getDegreeByNameAndBatch } from "@/lib/db/degree.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const degreeId = searchParams.get("degreeId");
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    if (!degreeId && (!batch || !degree)) {
      return NextResponse.json(
        {
          success: false,
          error: "Either degreeId or both batch and degree are required",
        },
        { status: 400 },
      );
    }

    let targetDegreeId = degreeId;

    if (!targetDegreeId && batch && degree) {
      const degreeRecord = await getDegreeByNameAndBatch(degree, batch);
      if (!degreeRecord) {
        return NextResponse.json(
          { success: false, error: "Degree not found" },
          { status: 404 },
        );
      }
      targetDegreeId = degreeRecord.id;
    }

    console.log(`📅 Fetching years for degree: ${targetDegreeId}`);

    const years = await getYearsByDegree(targetDegreeId!);

    console.log(`✅ Found ${years.length} years`);

    return NextResponse.json({
      success: true,
      count: years.length,
      years: years.map((y: any) => ({
        id: y.id,
        name: y.name,
        number: y.number,
        semesterCount: y.semesters.length,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching years:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, number, degreeId } = body;

    if (!name || number === undefined || !degreeId) {
      return NextResponse.json(
        {
          success: false,
          error: "name, number, and degreeId are required",
        },
        { status: 400 },
      );
    }

    console.log(`📝 Creating year: ${name}`);

    const year = await findOrCreateYear(name, number, degreeId);

    console.log(`✅ Created year: ${year.name} (${year.id})`);

    return NextResponse.json({
      success: true,
      year: {
        id: year.id,
        name: year.name,
        number: year.number,
        degreeId: year.degreeId,
      },
    });
  } catch (error) {
    console.error("❌ Error creating year:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
