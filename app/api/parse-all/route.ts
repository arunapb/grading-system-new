import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseResultPDF } from "@/lib/parser";
import {
  scanPDFDirectory,
  ensureOutputDirectory,
  getOutputPath,
} from "@/lib/fs-utils";

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Starting batch PDF parsing...");

    const dataDir = path.join(process.cwd(), "data");
    const allPDFs = scanPDFDirectory(dataDir);

    // Filter PDFs that don't have output yet
    const missingPDFs = allPDFs.filter((pdf: any) => !pdf.hasOutput);

    console.log(`📊 Found ${missingPDFs.length} PDFs without output`);

    const results = [];
    const errors = [];

    for (const pdf of missingPDFs) {
      try {
        console.log(`📄 Processing: ${pdf.pdfPath}`);

        const fullPdfPath = path.join(dataDir, pdf.pdfPath);
        const pdfBuffer = fs.readFileSync(fullPdfPath);

        // Parse PDF
        const records = await parseResultPDF(pdfBuffer);

        // Get output path
        const outputPath = getOutputPath(dataDir, pdf.pdfPath);

        // Ensure output directory exists
        ensureOutputDirectory(outputPath);

        // Save JSON
        fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

        results.push({
          pdfPath: pdf.pdfPath,
          recordCount: records.length,
          outputPath: outputPath.replace(/\\/g, "/"),
        });

        console.log(
          `✅ Processed: ${pdf.filename} (${records.length} records)`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({
          pdfPath: pdf.pdfPath,
          error: errorMessage,
        });
        console.error(`❌ Error processing ${pdf.filename}:`, errorMessage);
      }
    }

    console.log(
      `🎉 Batch processing complete: ${results.length} succeeded, ${errors.length} failed`,
    );

    return NextResponse.json({
      success: true,
      totalProcessed: results.length,
      totalErrors: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("❌ Error in batch processing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
