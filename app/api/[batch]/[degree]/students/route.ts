import { NextResponse } from "next/server";
import { getAllStudentsWithCGPA } from "@/lib/db/student.service";

interface RouteParams {
  params: Promise<{
    batch: string;
    degree: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { batch, degree } = await params;
    const decodedBatch = decodeURIComponent(batch);
    const decodedDegree = decodeURIComponent(degree);

    // Fetch students with CGPA for the specific batch and degree
    // This function returns { indexNumber, name, photoUrl, cgpa, totalCredits, moduleCount, batch, degree }
    const students = await getAllStudentsWithCGPA(decodedBatch, decodedDegree);

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch students",
      },
      { status: 500 },
    );
  }
}
