import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "@/lib/permissions";
import { parseStudentListPDF } from "@/lib/student-list-parser";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/db/activity.service";
import {
  inferDegreeFromIndex,
  inferBatchFromIndex,
  DegreePrefixMap,
} from "@/lib/degree-mapping";

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
    const degreePrefixMapRaw = formData.get("degreePrefixMap") as string | null;
    const manualDegreeAssignmentsRaw = formData.get(
      "manualDegreeAssignments",
    ) as string | null;

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

    // Parse degree prefix map (if provided)
    let degreePrefixMap: DegreePrefixMap = {};
    if (degreePrefixMapRaw) {
      try {
        degreePrefixMap = JSON.parse(degreePrefixMapRaw);
      } catch {
        return NextResponse.json(
          { error: "Invalid degree prefix map format" },
          { status: 400 },
        );
      }
    }

    // Parse manual degree assignments (if provided)
    let manualDegreeAssignments: Record<
      string,
      { degreeName: string; batchName: string }
    > = {};
    if (manualDegreeAssignmentsRaw) {
      try {
        manualDegreeAssignments = JSON.parse(manualDegreeAssignmentsRaw);
      } catch {
        return NextResponse.json(
          { error: "Invalid manual degree assignments format" },
          { status: 400 },
        );
      }
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

    // If action is "preview", return parsed students with inferred degree/batch info
    if (action === "preview") {
      const studentsWithInference = parseResult.students.map((student) => {
        const inferredBatch = inferBatchFromIndex(student.indexNumber);

        // Use global degree if provided, otherwise try prefix map
        let inferredDegree: string | null = null;
        if (degree) {
          inferredDegree = degree.toUpperCase();
        } else {
          inferredDegree = inferDegreeFromIndex(
            student.indexNumber,
            degreePrefixMap,
          );
        }

        return {
          ...student,
          inferredBatch: batch
            ? batch.toLowerCase().startsWith("batch")
              ? batch
              : `Batch ${batch}`
            : inferredBatch,
          inferredDegree,
        };
      });

      return NextResponse.json({
        success: true,
        action: "preview",
        students: studentsWithInference,
        count: studentsWithInference.length,
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
        // 1. Determine batch name
        let batchName = globalBatchName;
        if (!batchName) {
          // Check manual assignment first
          const manual = manualDegreeAssignments[student.indexNumber];
          if (manual?.batchName) {
            batchName = manual.batchName.toLowerCase().startsWith("batch")
              ? manual.batchName
              : `Batch ${manual.batchName}`;
          } else {
            // Infer batch from first 2 digits of index number
            batchName = inferBatchFromIndex(student.indexNumber);
            if (!batchName) {
              throw new Error(
                `Could not infer batch for index ${student.indexNumber}`,
              );
            }
          }
        }

        // 2. Determine degree name
        let degreeName: string | null = globalDegreeName;
        if (!degreeName) {
          // Check manual assignment first
          const manual = manualDegreeAssignments[student.indexNumber];
          if (manual?.degreeName) {
            degreeName = manual.degreeName.toUpperCase();
          } else {
            // Try prefix map inference
            degreeName = inferDegreeFromIndex(
              student.indexNumber,
              degreePrefixMap,
            );
            // If still null, degree stays null — student saved without degree
          }
        }

        // Get batch record (always required)
        const batchRecord = await getBatch(batchName);

        // Get degree record (optional — can be null)
        let degreeId: string | null = null;
        if (degreeName) {
          const degreeRecord = await getDegree(degreeName, batchRecord.id);
          degreeId = degreeRecord.id;
        }

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
        if (degreeId) {
          await prisma.student.create({
            data: {
              indexNumber: student.indexNumber,
              name: student.name || null,
              degree: { connect: { id: degreeId } },
            },
          });
        } else {
          await prisma.student.create({
            data: {
              indexNumber: student.indexNumber,
              name: student.name || null,
              degreeId: null,
            },
          });
        }
        savedStudents.push({
          ...student,
          status: "created",
          batch: batchName,
          degree: degreeName || "Unassigned",
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
