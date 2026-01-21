import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

interface StudentProfile {
  indexNumber: string;
  name: string;
  photoUrl: string | null;
}

interface ScrapeResult {
  success: boolean;
  students: StudentProfile[];
  count: number;
  error?: string;
}

/**
 * Scrape student profiles from UOM website
 * @param degree - Degree program (it, itm, ai)
 * @param batchNumber - Batch number (e.g., 21, 22)
 */
export async function scrapeStudentProfiles(
  degree: string,
  batchNumber: string,
): Promise<ScrapeResult> {
  try {
    const url = `https://uom.lk/student/${degree.toLowerCase()}-batch-${batchNumber}.php`;

    console.log(`🌐 Fetching student data from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        students: [],
        count: 0,
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();
    const students = parseStudentData(html, degree, batchNumber);

    console.log(`✅ Found ${students.length} students`);

    // Download photos and save profiles
    const batch = `batch ${batchNumber}`;
    const degreeUpper = degree.toUpperCase();

    // await downloadPhotos(students, batch, degreeUpper)
    // await saveProfiles(students, batch, degreeUpper)

    return {
      success: true,
      students,
      count: students.length,
    };
  } catch (error) {
    console.error("❌ Scraping error:", error);
    return {
      success: false,
      students: [],
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Parse HTML to extract student information
 * Structure: Table with images in one row, then "Reg. No XXXXXX<br>NAME" in cells of next row
 */
function parseStudentData(
  html: string,
  degree: string,
  batchNumber: string,
): StudentProfile[] {
  const $ = cheerio.load(html);
  const students: StudentProfile[] = [];

  // Find all table rows
  $("tbody tr").each((index, row) => {
    const cells = $(row).find("td");

    // Process rows that contain "Reg. No"
    cells.each((cellIndex, cell) => {
      const cellText = $(cell).text();

      // Check if this cell contains registration number
      if (cellText.includes("Reg. No")) {
        // Extract registration number and name
        // Format: "Reg. No  215001G\n AADHIL M.H.M."
        const regNoMatch = cellText.match(/Reg\.\s*No\s+(\d{6}[A-Z])/i);

        if (regNoMatch) {
          const indexNumber = regNoMatch[1];

          // Extract name (text after the reg number)
          const afterRegNo = cellText.substring(
            cellText.indexOf(indexNumber) + indexNumber.length,
          );
          const name = afterRegNo.trim();

          // Try to find the photo URL from the previous row
          let photoUrl: string | null = null;

          // Look for image in the same column position in previous rows
          const prevRow = $(row).prev("tr");
          if (prevRow.length > 0) {
            const prevCell = prevRow.find("td").eq(cellIndex);
            const img = prevCell.find("img");
            if (img.length > 0) {
              const src = img.attr("src");
              if (src) {
                // Convert relative URL to absolute
                photoUrl = src.startsWith("http")
                  ? src
                  : `https://uom.lk/student/${src}`;
              }
            }
          }

          students.push({
            indexNumber,
            name: name || indexNumber,
            photoUrl,
          });
        }
      }
    });
  });

  console.log(`✅ Parsed ${students.length} students`);
  return students;
}

/**
 * Download student photos
 */
async function downloadPhotos(
  students: StudentProfile[],
  batch: string,
  degree: string,
): Promise<void> {
  const photoDir = path.join(
    process.cwd(),
    "data",
    "Students",
    batch,
    degree,
    "photos",
  );
  await fs.mkdir(photoDir, { recursive: true });

  console.log(`📸 Downloading photos to: ${photoDir}`);

  let downloaded = 0;
  let skipped = 0;

  for (const student of students) {
    if (!student.photoUrl) {
      skipped++;
      continue;
    }

    try {
      const response = await fetch(student.photoUrl);

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const photoPath = path.join(photoDir, `${student.indexNumber}.png`);
        await fs.writeFile(photoPath, Buffer.from(buffer));

        // Update photo URL to relative path
        student.photoUrl = `photos/${student.indexNumber}.png`;
        downloaded++;
      } else {
        student.photoUrl = null;
        skipped++;
      }
    } catch (error) {
      student.photoUrl = null;
      skipped++;
    }

    // Add delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`✅ Downloaded ${downloaded} photos, skipped ${skipped}`);
}

/**
 * Save student profiles to JSON file
 */
async function saveProfiles(
  students: StudentProfile[],
  batch: string,
  degree: string,
): Promise<void> {
  const profilesDir = path.join(
    process.cwd(),
    "data",
    "Students",
    batch,
    degree,
  );
  await fs.mkdir(profilesDir, { recursive: true });

  const profilesPath = path.join(profilesDir, "student-profiles.json");

  // Convert array to object with index number as key
  const profilesObj: Record<string, { name: string; photoUrl: string | null }> =
    {};

  for (const student of students) {
    profilesObj[student.indexNumber] = {
      name: student.name,
      photoUrl: student.photoUrl,
    };
  }

  await fs.writeFile(
    profilesPath,
    JSON.stringify(profilesObj, null, 2),
    "utf-8",
  );

  console.log(`💾 Saved ${students.length} profiles to: ${profilesPath}`);
}
