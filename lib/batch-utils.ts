import fs from "fs";
import path from "path";

export interface BatchInfo {
  name: string;
  path: string;
  degrees: string[];
}

export interface DegreeInfo {
  name: string;
  path: string;
  hasData: boolean;
}

export interface BatchDegreeContext {
  batch: string;
  degree: string;
  inputPath: string;
  outputPath: string;
}

/**
 * Scan data/input directory for available batches
 * Returns list of batch folder names (e.g., ["batch 20", "batch 21", "batch 22"])
 */
export function scanAvailableBatches(): string[] {
  const inputDir = path.join(process.cwd(), "data", "input");

  if (!fs.existsSync(inputDir)) {
    console.warn("⚠️ Input directory does not exist:", inputDir);
    return [];
  }

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  const batches = entries
    .filter(
      (entry: any) =>
        entry.isDirectory() && entry.name.toLowerCase().startsWith("batch"),
    )
    .map((entry: any) => entry.name)
    .sort((a, b) => {
      // Extract batch numbers for proper sorting
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    });

  console.log(`📦 Found ${batches.length} batches:`, batches);
  return batches;
}

/**
 * Scan for available degrees in a specific batch
 * Returns list of degree folder names that exist (e.g., ["IT", "ITM", "AI"])
 */
export function scanAvailableDegrees(batch: string): string[] {
  const batchDir = path.join(process.cwd(), "data", "input", batch);

  if (!fs.existsSync(batchDir)) {
    console.warn(`⚠️ Batch directory does not exist: ${batchDir}`);
    return [];
  }

  const entries = fs.readdirSync(batchDir, { withFileTypes: true });
  const validDegrees = ["IT", "ITM", "AI"];

  const degrees = entries
    .filter(
      (entry: any) =>
        entry.isDirectory() && validDegrees.includes(entry.name.toUpperCase()),
    )
    .map((entry: any) => entry.name.toUpperCase())
    .sort();

  console.log(`🎓 Found ${degrees.length} degrees in ${batch}:`, degrees);
  return degrees;
}

/**
 * Get batch information including available degrees
 */
export function getBatchInfo(batch: string): BatchInfo | null {
  const batchPath = path.join(process.cwd(), "data", "input", batch);

  if (!fs.existsSync(batchPath)) {
    return null;
  }

  const degrees = scanAvailableDegrees(batch);

  return {
    name: batch,
    path: batchPath,
    degrees,
  };
}

/**
 * Get all batches with their degree information
 */
export function getAllBatchesInfo(): BatchInfo[] {
  const batches = scanAvailableBatches();
  return batches
    .map((batch: string) => getBatchInfo(batch))
    .filter((info): info is BatchInfo => info !== null);
}

/**
 * Get degree information for a specific batch/degree combination
 */
export function getDegreeInfo(
  batch: string,
  degree: string,
): DegreeInfo | null {
  const degreePath = path.join(process.cwd(), "data", "input", batch, degree);

  if (!fs.existsSync(degreePath)) {
    return null;
  }

  // Check if there's any data (Year folders)
  const entries = fs.readdirSync(degreePath, { withFileTypes: true });
  const hasData = entries.some(
    (entry: any) =>
      entry.isDirectory() && entry.name.toLowerCase().startsWith("year"),
  );

  return {
    name: degree,
    path: degreePath,
    hasData,
  };
}

/**
 * Get context paths for a specific batch/degree combination
 */
export function getBatchDegreeContext(
  batch: string,
  degree: string,
): BatchDegreeContext {
  const inputPath = path.join(process.cwd(), "data", "input", batch, degree);
  const outputPath = path.join(process.cwd(), "data", "output", batch, degree);

  return {
    batch,
    degree,
    inputPath,
    outputPath,
  };
}

/**
 * Validate if a batch/degree combination exists
 */
export function validateBatchDegree(batch: string, degree: string): boolean {
  const context = getBatchDegreeContext(batch, degree);
  return fs.existsSync(context.inputPath);
}

/**
 * Count students in a batch/degree by scanning output JSON files
 */
export function countStudentsInContext(batch: string, degree: string): number {
  const context = getBatchDegreeContext(batch, degree);

  if (!fs.existsSync(context.outputPath)) {
    return 0;
  }

  const studentSet = new Set<string>();

  // Recursively find all JSON files
  function findJSONFiles(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        findJSONFiles(fullPath);
      } else if (
        entry.name.endsWith(".json") &&
        !entry.name.includes("metadata")
      ) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const data = JSON.parse(content);

          if (data.students && Array.isArray(data.students)) {
            data.students.forEach((student: any) => {
              if (student.indexNumber) {
                studentSet.add(student.indexNumber);
              }
            });
          }
        } catch (error) {
          console.error(`Error reading ${fullPath}:`, error);
        }
      }
    }
  }

  findJSONFiles(context.outputPath);
  return studentSet.size;
}

/**
 * Get batch display name (e.g., "batch 21" -> "Batch 21")
 */
export function formatBatchName(batch: string): string {
  return batch
    .split(" ")
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

/**
 * Get degree display name with full form
 */
export function formatDegreeName(degree: string): {
  short: string;
  full: string;
} {
  const degreeMap: Record<string, string> = {
    IT: "Information Technology",
    ITM: "Information Technology Management",
    AI: "Artificial Intelligence",
  };

  return {
    short: degree.toUpperCase(),
    full: degreeMap[degree.toUpperCase()] || degree,
  };
}
