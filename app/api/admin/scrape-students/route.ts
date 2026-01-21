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
      let degreeObj: any = await getDegreeByNameAndBatch(
        degreeName,
        batch.name,
      ); // Fixed: Pass batch.name
      if (!degreeObj) {
        console.log(`Degree ${degreeName} not found, creating...`);
        degreeObj = await findOrCreateDegree(degreeName, batch.id);
      }

      console.log(
        `Using Degree: ${degreeObj?.name} (ID: ${degreeObj?.id}) for Batch: ${batch?.name} (ID: ${batch?.id})`,
      );

      if (!degreeObj || !degreeObj.id) {
        throw new Error(`Invalid degree object for ${degree.toUpperCase()}`);
      }

      // Update database with scraped data
      let updatedCount = 0;

      // Import Cloudinary upload function dynamically to avoid issues if not configured
      const { uploadFromUrl, isCloudinaryConfigured } =
        await import("@/lib/cloudinary");
      const hasCloudinary = isCloudinaryConfigured();

      // 1. Initial creation of all students in database (without photos)
      console.log(
        `🚀 Starting database update for ${result.students.length} students...`,
      );
      await Promise.all(
        result.students.map(async (student) => {
          try {
            await findOrCreateStudent(
              student.indexNumber,
              degreeObj.id,
              student.name,
            );
          } catch (dbError) {
            console.error(
              `Failed to create student ${student.indexNumber}:`,
              dbError,
            );
          }
        }),
      );

      // 2. Upload photos to Cloudinary and update database in parallel
      console.log(`📸 Starting parallel image upload and DB update...`);
      const photoUploadTasks = result.students.map(async (student) => {
        let finalPhotoUrl = student.photoUrl;

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

            // Update student with the Cloudinary URL
            await findOrCreateStudent(
              student.indexNumber,
              degreeObj.id,
              student.name,
              uploadResult.url,
            );

            return { indexNumber: student.indexNumber, success: true };
          } catch (uploadError) {
            console.error(
              `Failed to upload/update photo for ${student.indexNumber}:`,
              uploadError,
            );
            return { indexNumber: student.indexNumber, success: false };
          }
        }
        return { indexNumber: student.indexNumber, skipped: true };
      });

      // We wait for all photo tasks to settle to ensure we give a comprehensive result,
      // but the response could also be sent earlier if we use a background job/waitUntil.
      // Next.js standard API routes will wait for Promise.all, so this is still faster than sequential.
      const uploadResults = await Promise.allSettled(photoUploadTasks);
      const successfulUploads = uploadResults.filter(
        (r) => r.status === "fulfilled" && (r.value as any).success,
      ).length;

      return NextResponse.json({
        success: true,
        message: `Successfully scraped ${result.count} students. DB initialized and ${successfulUploads} photos updated in background.`,
        count: result.count,
        dbUpdated: result.students.length,
        photosUpdated: successfulUploads,
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
