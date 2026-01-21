import { NextResponse } from "next/server";
import {
  findOrCreateSemester,
  getSemestersByYear,
} from "@/lib/db/semester.service";
import { getYearsByDegree } from "@/lib/db/year.service";
import { getDegreeByNameAndBatch } from "@/lib/db/degree.service";

export async function POST(request: Request) {
  try {
    const { batch, degree, year, semesterName } = await request.json();

    if (!batch || !degree || !year || !semesterName) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch, degree, year, and semester name are required",
        },
        { status: 400 },
      );
    }

    console.log(
      `📆 Creating semester: ${semesterName} in ${year}, ${degree} (${batch})`,
    );

    // Get the degree record
    const degreeRecord = await getDegreeByNameAndBatch(degree, batch);
    if (!degreeRecord) {
      return NextResponse.json(
        { success: false, error: "Degree not found" },
        { status: 404 },
      );
    }

    // Get the year record
    const years = await getYearsByDegree(degreeRecord.id);
    const yearMatch = year.match(/Year\s+(\d+)/i);
    const yearNumber = yearMatch ? parseInt(yearMatch[1]) : 1;
    const yearRecord = years.find((y: any) => y.number === yearNumber);

    if (!yearRecord) {
      return NextResponse.json(
        { success: false, error: "Year not found" },
        { status: 404 },
      );
    }

    // Check if semester already exists
    const existingSemesters = await getSemestersByYear(yearRecord.id);
    const semesterMatch = semesterName.match(/Semester\s+(\d+)/i);
    const semesterNumber = semesterMatch ? parseInt(semesterMatch[1]) : 1;

    if (existingSemesters.some((s: any) => s.number === semesterNumber)) {
      return NextResponse.json(
        { success: false, error: "Semester already exists" },
        { status: 400 },
      );
    }

    // Create semester
    const semester = await findOrCreateSemester(
      semesterName,
      semesterNumber,
      yearRecord.id,
    );

    console.log(`✅ Created semester: ${semester.name} (${semester.id})`);

    return NextResponse.json({
      success: true,
      message: "Semester created successfully",
      semester: {
        id: semester.id,
        name: semester.name,
        number: semester.number,
        yearId: semester.yearId,
      },
    });
  } catch (error) {
    console.error("Error creating semester:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
