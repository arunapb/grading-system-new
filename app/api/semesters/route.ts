import { NextRequest, NextResponse } from "next/server";
import {
  getSemestersByYear,
  findOrCreateSemester,
} from "@/lib/db/semester.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const yearId = searchParams.get("yearId");

    if (!yearId) {
      return NextResponse.json(
        { success: false, error: "yearId is required" },
        { status: 400 },
      );
    }

    console.log(`📆 Fetching semesters for year: ${yearId}`);

    const semesters = await getSemestersByYear(yearId);

    console.log(`✅ Found ${semesters.length} semesters`);

    return NextResponse.json({
      success: true,
      count: semesters.length,
      semesters: semesters.map((s: any) => ({
        id: s.id,
        name: s.name,
        number: s.number,
        moduleCount: s.modules.length,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching semesters:", error);
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
    const { name, number, yearId } = body;

    if (!name || number === undefined || !yearId) {
      return NextResponse.json(
        {
          success: false,
          error: "name, number, and yearId are required",
        },
        { status: 400 },
      );
    }

    console.log(`📝 Creating semester: ${name}`);

    const semester = await findOrCreateSemester(name, number, yearId);

    console.log(`✅ Created semester: ${semester.name} (${semester.id})`);

    return NextResponse.json({
      success: true,
      semester: {
        id: semester.id,
        name: semester.name,
        number: semester.number,
        yearId: semester.yearId,
      },
    });
  } catch (error) {
    console.error("❌ Error creating semester:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
