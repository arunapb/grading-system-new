import { NextRequest, NextResponse } from "next/server";
import { getAllStudentsWithCGPA } from "@/lib/db/student.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    console.log(
      `👥 Fetching students from database... (batch: ${batch || "all"}, degree: ${degree || "all"})`,
    );

    const students = await getAllStudentsWithCGPA(
      batch || undefined,
      degree || undefined,
    );

    console.log(`✅ Found ${students.length} students`);

    return NextResponse.json({
      success: true,
      count: students.length,
      students,
      context: batch && degree ? { batch, degree } : null,
    });
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
