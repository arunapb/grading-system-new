import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { parseResultPDF } from "@/lib/parser";
import { logActivity } from "@/lib/db/activity.service";
import { findOrCreateBatch } from "@/lib/db/batch.service";
import { findOrCreateDegree } from "@/lib/db/degree.service";
import { findOrCreateYear } from "@/lib/db/year.service";
import { findOrCreateSemester } from "@/lib/db/semester.service";
import { findOrCreateModule } from "@/lib/db/module.service";
import { findOrCreateStudent } from "@/lib/db/student.service";
import { upsertGrade } from "@/lib/db/grade.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

interface UploadResult {
  filename: string;
  success: boolean;
  error?: string;
  parsed?: boolean;
  studentCount?: number;
  savedToDatabase?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const batch = formData.get("batch") as string;
    const degree = formData.get("degree") as string;
    const year = formData.get("year") as string;
    const semester = formData.get("semester") as string;
    const credits = parseFloat(formData.get("credits") as string) || 3;
    const files = formData.getAll("files") as File[];

    // Validation
    if (!batch || !degree || !year || !semester) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 },
      );
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { success: false, error: `${file.name} is not a PDF file` },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `${file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          },
          { status: 400 },
        );
      }
    }

    // Prepare directories for file storage
    const inputDir = path.join(
      process.cwd(),
      "data",
      "input",
      batch,
      degree,
      year,
      semester,
    );
    await fs.mkdir(inputDir, { recursive: true });

    // Create database structure
    const batchRecord = await findOrCreateBatch(batch);
    const degreeRecord = await findOrCreateDegree(degree, batchRecord.id);

    // Parse year and semester numbers
    const yearMatch = year.match(/Year\s+(\d+)/i);
    const yearNumber = yearMatch ? parseInt(yearMatch[1]) : 1;
    const yearRecord = await findOrCreateYear(
      year,
      yearNumber,
      degreeRecord.id,
    );

    const semesterMatch = semester.match(/Semester\s+(\d+)/i);
    const semesterNumber = semesterMatch ? parseInt(semesterMatch[1]) : 1;
    const semesterRecord = await findOrCreateSemester(
      semester,
      semesterNumber,
      yearRecord.id,
    );

    const results: UploadResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process each file
    for (const file of files) {
      try {
        // Save file
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(inputDir, file.name);
        await fs.writeFile(filePath, buffer);

        // Parse PDF
        let parsed = false;
        let studentCount = 0;
        let savedToDatabase = false;

        try {
          const students = await parseResultPDF(buffer);

          if (students && students.length > 0) {
            parsed = true;
            studentCount = students.length;

            // Extract module info from filename
            const moduleCode =
              file.name.replace(".pdf", "").replace(/[^a-zA-Z0-9]/g, "_") ||
              "Unknown";
            const moduleName = file.name.replace(".pdf", "");

            // Create module in database
            const moduleRecord = await findOrCreateModule(
              moduleCode,
              moduleName,
              credits,
              semesterRecord.id,
            );

            // Save students and grades to database
            for (const student of students) {
              const studentRecord = await findOrCreateStudent(
                student.indexNumber,
                degreeRecord.id,
              );
              await upsertGrade(
                studentRecord.id,
                moduleRecord.id,
                student.grade,
              );
            }

            savedToDatabase = true;
          }
        } catch (parseError) {
          console.error(`Parse error for ${file.name}:`, parseError);
        }

        results.push({
          filename: file.name,
          success: true,
          parsed,
          studentCount,
          savedToDatabase,
        });
        successCount++;

        // Log activity to database
        await logActivity(
          "PDF_UPLOADED",
          {
            filename: file.name,
            batch,
            degree,
            year,
            semester,
            parsed,
            studentCount,
            savedToDatabase,
          },
          true,
        );
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        results.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: successCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
