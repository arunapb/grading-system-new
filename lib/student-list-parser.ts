import pdf from "pdf-parse";

export interface StudentRecord {
  indexNumber: string;
  name: string;
}

export interface StudentListParseResult {
  students: StudentRecord[];
  batchInfo?: string;
}

/**
 * Clean text by removing invisible characters and normalizing spaces
 */
function cleanText(raw: string): string {
  return raw
    .replace(/[\u200B\u200C\u200D\uFEFF\u2060\u00AD]/g, "")
    .replace(/[‐-‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse a student list PDF (Academic Advisor List format)
 * Extracts registration numbers (e.g., 214010B) and student names
 */
export async function parseStudentListPDF(
  pdfBuffer: Buffer,
): Promise<StudentListParseResult> {
  try {
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // Try to extract batch info from title
    const batchMatch = /Batch\s*(\d+)/i.exec(text);
    const batchInfo = batchMatch ? `Batch ${batchMatch[1]}` : undefined;

    // Split into lines for easier processing
    const lines = text.split("\n").map((l) => cleanText(l));

    const students: StudentRecord[] = [];
    const seenIndexNumbers = new Set<string>();

    // Pattern for registration numbers: 6 digits followed by a letter (e.g., 214010B, 215006C)
    const regNoPattern = /(\d{6}[A-Z])/g;

    // Process line by line to find reg numbers and associated names
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Find all registration numbers in this line
      let match;
      while ((match = regNoPattern.exec(line)) !== null) {
        const indexNumber = match[1];

        // Skip if we've already seen this index number
        if (seenIndexNumbers.has(indexNumber)) continue;
        seenIndexNumbers.add(indexNumber);

        // Try to extract the name that follows the registration number
        // The pattern in the PDF is: [number] [RegNo] [NAME] [Gender]
        // Example: "1 214010B AMARASENA B.H.L.M. F"

        const afterRegNo = line.substring(match.index + match[0].length).trim();

        // Extract name: starts with uppercase letters, may contain spaces, periods, dots
        // Stop at single letter (gender indicator like M, F)
        const nameMatch =
          /^([A-Z][A-Z\s.]+?)(?:\s+[MF]\s*$|\s+[MF]\s+|\s*$)/.exec(afterRegNo);

        let name = "";
        if (nameMatch) {
          name = nameMatch[1].trim();
        } else {
          // Fallback: just take everything after the reg number
          // Remove common suffixes like M, F (gender)
          name = afterRegNo
            .replace(/\s+[MF]\s*$/i, "")
            .replace(/\s+[MF]\s+/i, " ")
            .trim();
        }

        // Only add if we got a reasonable name (at least 2 characters)
        if (name.length >= 2) {
          students.push({
            indexNumber,
            name: name.replace(/\s+/g, " ").trim(),
          });
        } else {
          // Still add with index number as placeholder
          students.push({
            indexNumber,
            name: "",
          });
        }
      }
    }

    // If line-by-line didn't work well, try a different approach:
    // Look for patterns like: digit(s) followed by RegNo followed by NAME
    if (students.length === 0) {
      const fullText = cleanText(text);
      const globalPattern =
        /(\d{6}[A-Z])\s+([A-Z][A-Z.\s]+?)(?=\s+[MF]\s|\s+\d{6}[A-Z]|\s*$)/g;

      let globalMatch;
      while ((globalMatch = globalPattern.exec(fullText)) !== null) {
        const indexNumber = globalMatch[1];
        const name = globalMatch[2].trim();

        if (!seenIndexNumbers.has(indexNumber)) {
          seenIndexNumbers.add(indexNumber);
          students.push({ indexNumber, name });
        }
      }
    }

    console.log(`📄 Parsed ${students.length} students from PDF`);

    return {
      students,
      batchInfo,
    };
  } catch (err) {
    console.error("PDF parse error:", err);
    throw err;
  }
}
