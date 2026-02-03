import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "@/lib/permissions";
import { parseStudentListPDF } from "@/lib/student-list-parser";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/db/activity.service";

// POST - Parse PDF and optionally save students
export async function POST(request: NextRequest) {
  try {
    // Check for canScrape permission (same as scraper)
    const permResult = await checkPermission("canScrape");
    if (!permResult.authorized) {
      return permResult.response;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const batch = formData.get("batch") as string | null;
    const degree = formData.get("degree") as string | null;
    const action = formData.get("action") as string | null; // "preview" or "save"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the PDF
    const parseResult = await parseStudentListPDF(buffer);

    if (parseResult.students.length === 0) {
      return NextResponse.json(
        { error: "No students found in PDF. Please check the PDF format." },
        { status: 400 },
      );
    }

    // If action is "preview", just return parsed students without saving
    if (action === "preview" || !batch || !degree) {
      return NextResponse.json({
        success: true,
        action: "preview",
        students: parseResult.students,
        count: parseResult.students.length,
        batchInfo: parseResult.batchInfo,
      });
    }

    // Action is "save" - save students to database
    // Find or create the batch
    const batchName = batch.toLowerCase().startsWith("batch")
      ? batch
      : `Batch ${batch}`;

    let batchRecord = await prisma.batch.findFirst({
      where: { name: { equals: batchName, mode: "insensitive" } },
    });

    if (!batchRecord) {
      batchRecord = await prisma.batch.create({
        data: { name: batchName },
      });
    }

    // Find or create the degree
    const degreeName = degree.toUpperCase();
    let degreeRecord = await prisma.degree.findFirst({
      where: {
        name: { equals: degreeName, mode: "insensitive" },
        batchId: batchRecord.id,
      },
    });

    if (!degreeRecord) {
      degreeRecord = await prisma.degree.create({
        data: {
          name: degreeName,
          batchId: batchRecord.id,
        },
      });
    }

    // Save students - skip duplicates based on indexNumber
    const savedStudents: Array<{
      indexNumber: string;
      name: string;
      status: string;
    }> = [];
    const skippedStudents: Array<{
      indexNumber: string;
      name: string;
      reason: string;
    }> = [];

    for (const student of parseResult.students) {
      try {
        // Check if student already exists with this indexNumber (globally unique as per user)
        const existingByIndexNumber = await prisma.student.findFirst({
          where: { indexNumber: student.indexNumber },
        });

        if (existingByIndexNumber) {
          // Student with this registration number already exists - skip
          skippedStudents.push({
            ...student,
            reason: "Already exists",
          });
          continue;
        }

        // Create new student
        await prisma.student.create({
          data: {
            indexNumber: student.indexNumber,
            name: student.name || null,
            degreeId: degreeRecord.id,
          },
        });
        savedStudents.push({ ...student, status: "created" });
      } catch (err) {
        console.error(`Error saving student ${student.indexNumber}:`, err);
        skippedStudents.push({ ...student, reason: String(err) });
      }
    }

    // Log activity
    const user = permResult.session?.user as any;
    await logActivity("STUDENTS_UPLOADED_PDF", {
      adminId: user?.email,
      adminName: user?.name,
      batch: batchName,
      degree: degreeName,
      totalParsed: parseResult.students.length,
      saved: savedStudents.length,
      skipped: skippedStudents.length,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      action: "save",
      message: `Successfully added ${savedStudents.length} students (${skippedStudents.length} skipped - already exist)`,
      students: savedStudents,
      skipped: skippedStudents,
      count: savedStudents.length,
      skippedCount: skippedStudents.length,
      batch: batchName,
      degree: degreeName,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF", details: String(error) },
      { status: 500 },
    );
  }
}
