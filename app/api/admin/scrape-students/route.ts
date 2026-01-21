import { NextResponse } from "next/server";
import { scrapeStudentProfiles } from "@/lib/student-scraper";
import { getBatchByName, findOrCreateBatch } from "@/lib/db/batch.service";
import {
  getDegreeByNameAndBatch,
  findOrCreateDegree,
} from "@/lib/db/degree.service";
import {
  findOrCreateStudent,
  findStudentsByIndexNumbers,
  bulkCreateStudents,
} from "@/lib/db/student.service";

// Batch concurrency for optimized uploads
const UPLOAD_BATCH_SIZE = 5;

async function uploadBatch(
  students: any[],
  degreeId: string,
  batchNumber: string,
  degree: string,
  uploadFromUrl: any,
) {
  const results = await Promise.allSettled(
    students.map(async (student) => {
      if (student.photoUrl && student.photoUrl.startsWith("http")) {
        try {
          const uploadResult = await uploadFromUrl(student.photoUrl, {
            folder: `grading-system/students/${batchNumber}/${degree}`,
            publicId: student.indexNumber,
          });

          await findOrCreateStudent(
            student.indexNumber,
            degreeId,
            student.name,
            uploadResult.url,
          );

          return { indexNumber: student.indexNumber, success: true };
        } catch (error) {
          console.error(
            `Failed to upload photo for ${student.indexNumber}:`,
            error,
          );
          return { indexNumber: student.indexNumber, success: false };
        }
      }
      return { indexNumber: student.indexNumber, skipped: true };
    }),
  );

  return results.filter(
    (r) => r.status === "fulfilled" && (r.value as any).success,
  ).length;
}

export async function POST(request: Request) {
  try {
    const { degree, batchNumber } = await request.json();

    if (!degree || !batchNumber) {
      return NextResponse.json(
        { success: false, error: "Degree and batch number are required" },
        { status: 400 },
      );
    }

    const validDegrees = ["it", "itm", "ai"];
    if (!validDegrees.includes(degree.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid degree. Must be IT, ITM, or AI" },
        { status: 400 },
      );
    }

    // Stream response for progress tracking
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendProgress = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Start the async process
    (async () => {
      try {
        // Step 1: Scraping
        await sendProgress({
          step: "scraping",
          message: "Scraping student profiles from UOM...",
        });

        const result = await scrapeStudentProfiles(
          degree.toLowerCase(),
          batchNumber,
        );

        if (!result.success) {
          await sendProgress({
            step: "error",
            message: result.error || "Failed to scrape",
          });
          await writer.close();
          return;
        }

        await sendProgress({
          step: "scraped",
          message: `Found ${result.count} students`,
          count: result.count,
          students: result.students,
        });

        // Step 2: Get/Create batch and degree
        await sendProgress({
          step: "setup",
          message: "Setting up database records...",
        });

        const batchName = `Batch ${batchNumber}`;
        let batch: any = await getBatchByName(batchName);
        if (!batch) {
          batch = await findOrCreateBatch(batchName);
        }

        const degreeName = degree.toUpperCase();
        let degreeObj: any = await getDegreeByNameAndBatch(
          degreeName,
          batch.name,
        );
        if (!degreeObj) {
          degreeObj = await findOrCreateDegree(degreeName, batch.id);
        }

        if (!degreeObj || !degreeObj.id) {
          await sendProgress({
            step: "error",
            message: `Invalid degree object for ${degree.toUpperCase()}`,
          });
          await writer.close();
          return;
        }

        // Step 3: Create all students in DB (without photos) - fast operation
        await sendProgress({
          step: "saving",
          message: "Saving student records to database...",
        });

        // OPTIMIZED: Bulk Process Students
        const allIndexNumbers = result.students.map((s) => s.indexNumber);

        // 1. Query existing students with names
        const existingStudents = await findStudentsByIndexNumbers(
          allIndexNumbers,
          degreeObj.id,
        );
        const existingMap = new Map(
          existingStudents.map((s) => [s.indexNumber, s]),
        );

        // 2. Identify missing students
        const missingStudents = result.students
          .filter((s) => !existingMap.has(s.indexNumber))
          .map((s) => ({
            indexNumber: s.indexNumber,
            degreeId: degreeObj.id,
            name: s.name,
          }));

        // 3. Create missing students in batch
        if (missingStudents.length > 0) {
          await bulkCreateStudents(missingStudents);
        }

        // 4. Update existing students if name changed
        const updates = result.students.filter((s) => {
          const existing = existingMap.get(s.indexNumber);
          return existing && existing.name !== s.name;
        });

        if (updates.length > 0) {
          await Promise.all(
            updates.map((s) =>
              findOrCreateStudent(s.indexNumber, degreeObj.id, s.name),
            ),
          );
        }

        await sendProgress({
          step: "saved",
          message: `Saved ${result.students.length} students to database`,
          dbSaved: result.students.length,
        });

        // Step 4: Upload photos in controlled batches
        const { uploadFromUrl, isCloudinaryConfigured } =
          await import("@/lib/cloudinary");
        const hasCloudinary = isCloudinaryConfigured();

        if (!hasCloudinary) {
          await sendProgress({
            step: "complete",
            message: "Completed (Cloudinary not configured - photos skipped)",
            totalCount: result.count,
            photosUploaded: 0,
          });
          await writer.close();
          return;
        }

        await sendProgress({
          step: "uploading",
          message: "Starting photo uploads...",
          progress: 0,
        });

        let totalUploaded = 0;
        const studentsWithPhotos = result.students.filter(
          (s) => s.photoUrl && s.photoUrl.startsWith("http"),
        );
        const totalToUpload = studentsWithPhotos.length;

        // Process in batches for controlled concurrency
        for (let i = 0; i < studentsWithPhotos.length; i += UPLOAD_BATCH_SIZE) {
          const batch = studentsWithPhotos.slice(i, i + UPLOAD_BATCH_SIZE);
          const batchSuccess = await uploadBatch(
            batch,
            degreeObj.id,
            batchNumber,
            degree,
            uploadFromUrl,
          );

          totalUploaded += batchSuccess;
          const progress = Math.round(
            ((i + batch.length) / totalToUpload) * 100,
          );

          await sendProgress({
            step: "uploading",
            message: `Uploading photos... ${i + batch.length}/${totalToUpload}`,
            progress,
            uploaded: totalUploaded,
            total: totalToUpload,
          });
        }

        await sendProgress({
          step: "complete",
          message: `Successfully scraped ${result.count} students and uploaded ${totalUploaded} photos!`,
          totalCount: result.count,
          photosUploaded: totalUploaded,
          students: result.students,
        });

        await writer.close();
      } catch (error) {
        console.error("Error in scrape process:", error);
        await sendProgress({
          step: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in scrape-students API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
