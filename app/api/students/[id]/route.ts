import { NextRequest, NextResponse } from "next/server";
import { getStudentDetails } from "@/lib/db/student.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: indexNumber } = await params;

    // Get batch and degree from query parameters
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");

    console.log(
      `👤 Fetching details for student: ${indexNumber} (batch: ${batch || "all"}, degree: ${degree || "all"})`,
    );

    const student = await getStudentDetails(
      indexNumber,
      batch || undefined,
      degree || undefined,
    );

    if (!student) {
      console.log(`❌ Student ${indexNumber} not found`);
      return NextResponse.json(
        {
          success: false,
          error: "Student not found",
        },
        { status: 404 },
      );
    }

    console.log(
      `✅ Found student ${indexNumber} with ${student.modules.length} modules`,
    );

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("❌ Error fetching student details:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 },
    );
  }
}
