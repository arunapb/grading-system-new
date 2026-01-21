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
    const body = await req.json();
    const { pdfPath, credits, moduleCode, moduleName, batch, degree } = body;

    if (!pdfPath) {
      return NextResponse.json(
        { success: false, error: "Missing pdfPath parameter" },
        { status: 400 },
      );
    }

    if (credits === undefined || credits === null) {
      return NextResponse.json(
        { success: false, error: "Missing credits parameter" },
        { status: 400 },
      );
    }

    if (!batch || !degree) {
      return NextResponse.json(
        { success: false, error: "Missing batch or degree parameter" },
        { status: 400 },
      );
    }

    console.log(
      `📄 Parsing PDF: ${pdfPath} (batch: ${batch}, degree: ${degree})`,
    );

    const dataDir = path.join(process.cwd(), "data");
    const fullPdfPath = path.join(dataDir, "input", batch, degree, pdfPath);

    console.log(`📂 Full PDF path: ${fullPdfPath}`);

    // Check if PDF exists
    if (!fs.existsSync(fullPdfPath)) {
      console.error(`❌ PDF not found at: ${fullPdfPath}`);
      return NextResponse.json(
        { success: false, error: `PDF file not found at: ${fullPdfPath}` },
        { status: 404 },
      );
    }

    // Read PDF
    const pdfBuffer = fs.readFileSync(fullPdfPath);

    // Parse PDF to extract student records
    const { records } = await parseResultPDF(pdfBuffer);

    // Get metadata (year and semester from path)
    const { year, semester } = extractMetadata(pdfPath);

    // Extract year and semester numbers
    const yearMatch = year.match(/Year\s+(\d+)/i);
    const semesterMatch = semester.match(/(\d+)/);
    const yearNumber = yearMatch ? parseInt(yearMatch[1]) : 1;
    const semesterNumber = semesterMatch ? parseInt(semesterMatch[1]) : 1;

    // Save to database
    console.log(`💾 Saving to database...`);

    // 1. Create/find batch
    const batchRecord = await findOrCreateBatch(batch);
    console.log(`✅ Batch: ${batchRecord.name} (${batchRecord.id})`);

    // 2. Create/find degree
    const degreeRecord = await findOrCreateDegree(degree, batchRecord.id);
    console.log(`✅ Degree: ${degreeRecord.name} (${degreeRecord.id})`);

    // 3. Create/find year
    const yearRecord = await findOrCreateYear(
      year,
      yearNumber,
      degreeRecord.id,
    );
    console.log(`✅ Year: ${yearRecord.name} (${yearRecord.id})`);

    // 4. Create/find semester
    const semesterRecord = await findOrCreateSemester(
      `Semester ${semesterNumber}`,
      semesterNumber,
      yearRecord.id,
    );
    console.log(`✅ Semester: ${semesterRecord.name} (${semesterRecord.id})`);

    // 5. Create/find module
    const moduleRecord = await findOrCreateModule(
      moduleCode || "Unknown",
      moduleName || "Unknown",
      credits,
      semesterRecord.id,
    );
    console.log(
      `✅ Module: ${moduleRecord.code} - ${moduleRecord.name} (${moduleRecord.id})`,
    );

    // Load student profiles for this batch/degree
    const profiles = loadStudentProfiles(batch, degree);

    // 6. Create students and grades
    let savedCount = 0;
    for (const record of records) {
      // Get profile info if available
      const profile = profiles[record.indexNumber];
      const name = profile?.name;
      const photoUrl = profile?.photoUrl; // This is a relative path like "photos/xxxxx.png"

      const student = await findOrCreateStudent(
        record.indexNumber,
        degreeRecord.id,
        name || undefined,
        photoUrl || undefined,
      );
      await upsertGrade(student.id, moduleRecord.id, record.grade);
      savedCount++;
    }
    console.log(`✅ Saved ${savedCount} student grades`);

    // Log activity
    await logActivity("PDF_UPLOADED", {
      filename: path.basename(pdfPath),
      batch,
      degree,
      year,
      semester: `Semester ${semesterNumber}`,
      moduleCode,
      moduleName,
      studentCount: records.length,
    });

    console.log(`✅ Saved ${records.length} records to database`);

    return NextResponse.json({
      success: true,
      recordCount: records.length,
      moduleCode,
      moduleName,
      credits,
      savedToDatabase: true,
    });
  } catch (error) {
    console.error("❌ Error parsing PDF:", error);

    // Log failed activity
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
