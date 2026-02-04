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

    // Global batch/degree (if provided)
    const globalBatchName = batch
      ? batch.toLowerCase().startsWith("batch")
        ? batch
        : `Batch ${batch}`
      : null;
    const globalDegreeName = degree ? degree.toUpperCase() : null;

    // Cache likely batches/degrees to reduce DB calls
    const batchCache = new Map<string, any>();
    const degreeCache = new Map<string, any>(); // key: "degreeName-batchId"

    // Helper to get or create batch
    const getBatch = async (name: string) => {
      if (batchCache.has(name)) return batchCache.get(name);

      let record = await prisma.batch.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });

      if (!record) {
        record = await prisma.batch.create({
          data: { name },
        });
      }

      batchCache.set(name, record);
      return record;
    };

    // Helper to get or create degree
    const getDegree = async (name: string, batchId: string) => {
      const key = `${name}-${batchId}`;
      if (degreeCache.has(key)) return degreeCache.get(key);

      let record = await prisma.degree.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          batchId: batchId,
        },
      });

      if (!record) {
        record = await prisma.degree.create({
          data: {
            name,
            batchId,
          },
        });
      }
      degreeCache.set(key, record);
      return record;
    };

    // Save students - skip duplicates based on indexNumber
    const savedStudents: Array<{
      indexNumber: string;
      name: string;
      status: string;
      batch?: string;
      degree?: string;
    }> = [];
    const skippedStudents: Array<{
      indexNumber: string;
      name: string;
      reason: string;
    }> = [];

    for (const student of parseResult.students) {
      try {
        // Determine Batch
        let batchName = globalBatchName;
        if (!batchName) {
          // Infer batch from first 2 digits of index number (e.g. "240..." -> "Batch 24")
          // Assuming index is at least 2 chars
          const prefix = student.indexNumber.substring(0, 2);
          if (/^\d{2}$/.test(prefix)) {
            batchName = `Batch ${prefix}`;
          } else {
            throw new Error(
              `Could not infer batch for index ${student.indexNumber}`,
            );
          }
        }

        // Determine Degree
        let degreeName = globalDegreeName;
        if (!degreeName) {
          // Infer from mapping
          // 240, 241, 242 -> IT
          const prefix3 = student.indexNumber.substring(0, 3);
          if (["240", "241", "242"].includes(prefix3)) {
            degreeName = "IT";
          } else {
            // Fallback or error?
            // User only specified IT mapping.
            // We'll mark as skipped if unknown to be safe.
            throw new Error(
              `Could not infer degree for index ${student.indexNumber} (prefix ${prefix3})`,
            );
          }
        }

        // Get DB records
        const batchRecord = await getBatch(batchName);
        const degreeRecord = await getDegree(degreeName, batchRecord.id);

        // Check if student already exists
        const existingByIndexNumber = await prisma.student.findFirst({
          where: { indexNumber: student.indexNumber },
        });

        if (existingByIndexNumber) {
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
            degreeId: degreeRecord.id, // Use inferred or global degree
          },
        });
        savedStudents.push({
          ...student,
          status: "created",
          batch: batchName,
          degree: degreeName,
        });
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
      batch: globalBatchName || "Mixed/Auto",
      degree: globalDegreeName || "Mixed/Auto",
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
      batch: globalBatchName || "Mixed/Auto",
      degree: globalDegreeName || "Mixed/Auto",
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF", details: String(error) },
      { status: 500 },
    );
  }
}
