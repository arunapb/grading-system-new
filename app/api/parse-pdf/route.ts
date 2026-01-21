import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseResultPDF } from "@/lib/parser";
import { extractMetadata } from "@/lib/fs-utils";
import { findOrCreateBatch } from "@/lib/db/batch.service";
import { findOrCreateDegree } from "@/lib/db/degree.service";
import { findOrCreateYear } from "@/lib/db/year.service";
import { findOrCreateSemester } from "@/lib/db/semester.service";
import { findOrCreateModule } from "@/lib/db/module.service";
import { findOrCreateStudent } from "@/lib/db/student.service";
import { upsertGrade } from "@/lib/db/grade.service";
import { logActivity } from "@/lib/db/activity.service";
import { loadStudentProfiles } from "@/lib/profile-store";

export async function POST(req: NextRequest) {
  try {
    let pdfBuffer: Buffer | null = null;
    let filename: string = "";
    let batch: string = "";
    let degree: string = "";
    let credits: number = 2.5;
    let moduleCode: string | undefined;
    let moduleName: string | undefined;

    // Check content type to determine how to handle request
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get("file") as File;
      batch = formData.get("batch") as string;
      degree = formData.get("degree") as string;
      credits = parseFloat((formData.get("credits") as string) || "2.5");
      moduleCode = (formData.get("moduleCode") as string) || undefined;
      moduleName = (formData.get("moduleName") as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file uploaded" },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      pdfBuffer = Buffer.from(bytes);
      filename = file.name;
    } else {
      // Handle JSON body (existing usage)
      const body = await req.json();
      const { pdfPath } = body;
      batch = body.batch;
      degree = body.degree;
      credits = body.credits;
      moduleCode = body.moduleCode;
      moduleName = body.moduleName;

      if (!pdfPath) {
        return NextResponse.json(
          { success: false, error: "Missing pdfPath parameter" },
          { status: 400 },
        );
      }

      // Check if it's a URL
      if (pdfPath.startsWith("http://") || pdfPath.startsWith("https://")) {
        console.log(`🌐 Fetching PDF from URL: ${pdfPath}`);
        const fetchRes = await fetch(pdfPath);
        if (!fetchRes.ok) {
          throw new Error(
            `Failed to fetch PDF from URL: ${fetchRes.statusText}`,
          );
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
        filename = path.basename(new URL(pdfPath).pathname);
      } else {
        // Assume local file path (Development mostly)
        const dataDir = path.join(process.cwd(), "data");
        const fullPdfPath = path.join(dataDir, "input", batch, degree, pdfPath);

        console.log(`📂 Checking local path: ${fullPdfPath}`);

        if (!fs.existsSync(fullPdfPath)) {
          // Verify we are not in environment where we expect files to be missing
          console.error(`❌ PDF not found at: ${fullPdfPath}`);
          return NextResponse.json(
            {
              success: false,
              error: `PDF file not found. In production/serverless, files are not persisted locally. Please upload the file directly.`,
              isMissingFile: true,
            },
            { status: 404 },
          );
        }

        pdfBuffer = fs.readFileSync(fullPdfPath);
        filename = pdfPath;
      }
    }

    if (!batch || !degree) {
      return NextResponse.json(
        { success: false, error: "Missing batch or degree parameter" },
        { status: 400 },
      );
    }

    if (!pdfBuffer) {
      return NextResponse.json(
        { success: false, error: "Failed to obtain PDF content" },
        { status: 500 },
      );
    }

    // Parse PDF to extract student records
    const { records } = await parseResultPDF(pdfBuffer);

    // Get metadata (try from filename/path first)
    // If uploaded directly, we might rely on provided inputs or filename
    const { year, semester } = extractMetadata(filename);

    const yearMatch = year.match(/Year\s+(\d+)/i);
    const semesterMatch = semester.match(/(\d+)/);
    const yearNumber = yearMatch ? parseInt(yearMatch[1]) : 1;
    const semesterNumber = semesterMatch ? parseInt(semesterMatch[1]) : 1;

    // Save to database
    console.log(`💾 Saving to database...`);

    // 1. Create/find batch
    const batchRecord = await findOrCreateBatch(batch);

    // 2. Create/find degree
    const degreeRecord = await findOrCreateDegree(degree, batchRecord.id);

    // 3. Create/find year
    const yearRecord = await findOrCreateYear(
      year,
      yearNumber,
      degreeRecord.id,
    );

    // 4. Create/find semester
    const semesterRecord = await findOrCreateSemester(
      `Semester ${semesterNumber}`,
      semesterNumber,
      yearRecord.id,
    );

    // 5. Create/find module
    const effectiveModuleCode = moduleCode || "Unknown";
    const effectiveModuleName = moduleName || "Unknown";

    const moduleRecord = await findOrCreateModule(
      effectiveModuleCode,
      effectiveModuleName,
      credits,
      semesterRecord.id,
    );

    // Load student profiles for this batch/degree
    const profiles = loadStudentProfiles(batch, degree);

    // 6. Create students and grades
    let savedCount = 0;
    for (const record of records) {
      // Get profile info if available
      const profile = profiles[record.indexNumber];
      const name = profile?.name;
      const photoUrl = profile?.photoUrl;

      const student = await findOrCreateStudent(
        record.indexNumber,
        degreeRecord.id,
        name || undefined,
        photoUrl || undefined,
      );
      await upsertGrade(student.id, moduleRecord.id, record.grade);
      savedCount++;
    }

    // Log activity
    await logActivity("PDF_UPLOADED", {
      filename: filename,
      batch,
      degree,
      year,
      semester: `Semester ${semesterNumber}`,
      moduleCode: effectiveModuleCode,
      moduleName: effectiveModuleName,
      studentCount: records.length,
    });

    return NextResponse.json({
      success: true,
      recordCount: records.length,
      moduleCode: effectiveModuleCode,
      moduleName: effectiveModuleName,
      credits,
      savedToDatabase: true,
    });
  } catch (error) {
    console.error("❌ Error parsing PDF:", error);

    await logActivity(
      "PDF_UPLOAD_FAILED",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      false,
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
