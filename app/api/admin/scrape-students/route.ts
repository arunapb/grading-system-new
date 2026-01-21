import { NextResponse } from "next/server";
import { scrapeStudentProfiles } from "@/lib/student-scraper";
import { getBatchByName, findOrCreateBatch } from "@/lib/db/batch.service";
import {
  getDegreeByNameAndBatch,
  findOrCreateDegree,
} from "@/lib/db/degree.service";
import { findOrCreateStudent } from "@/lib/db/student.service";

export async function POST(request: Request) {
  try {
    const { degree, batchNumber } = await request.json();

    if (!degree || !batchNumber) {
      return NextResponse.json(
        { success: false, error: "Degree and batch number are required" },
        { status: 400 },
      );
    }

    // Validate degree
    const validDegrees = ["it", "itm", "ai"];
    if (!validDegrees.includes(degree.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid degree. Must be IT, ITM, or AI" },
        { status: 400 },
      );
    }

    // Scrape student profiles
    const result = await scrapeStudentProfiles(
      degree.toLowerCase(),
      batchNumber,
    );

    if (result.success) {
      const batchName = `Batch ${batchNumber}`;
      let batch: any = await getBatchByName(batchName);
      if (!batch) {
        batch = await findOrCreateBatch(batchName);
      }

      const degreeName = degree.toUpperCase();
      let degreeObj: any = await getDegreeByNameAndBatch(degreeName, batch.id);
      if (!degreeObj) {
        degreeObj = await findOrCreateDegree(degreeName, batch.id);
      }

      // Update database with scraped data
      let updatedCount = 0;

      // Import Cloudinary upload function dynamically to avoid issues if not configured
      const { uploadFromUrl, isCloudinaryConfigured } =
        await import("@/lib/cloudinary");
      const hasCloudinary = isCloudinaryConfigured();

      for (const student of result.students) {
        // Prepare photo URL
        let finalPhotoUrl = student.photoUrl;

        // Upload to Cloudinary if configured and photo exists
        if (
          hasCloudinary &&
          finalPhotoUrl &&
          finalPhotoUrl.startsWith("http")
        ) {
          try {
            const uploadResult = await uploadFromUrl(finalPhotoUrl, {
              folder: `grading-system/students/${batchNumber}/${degree}`,
              publicId: student.indexNumber,
            });
            finalPhotoUrl = uploadResult.url;
          } catch (uploadError) {
            console.error(
              `Failed to upload photo for ${student.indexNumber}:`,
              uploadError,
            );
            // Keep original URL if upload fails
          }
        }

        // Try to update existing student or create new one
        try {
          if (degreeObj) {
            // Check if student exists (by index number)
            // We use findOrCreateStudent which upserts
            await findOrCreateStudent(
              student.indexNumber,
              degreeObj.id,
              student.name,
              finalPhotoUrl || undefined,
            );
            updatedCount++;
          }
        } catch (dbError) {
          console.error(
            `Failed to update student ${student.indexNumber}:`,
            dbError,
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully scraped ${result.count} students and updated ${updatedCount} records in database`,
        count: result.count,
        dbUpdated: updatedCount,
        students: result.students,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to scrape student profiles",
        },
        { status: 500 },
      );
    }
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
