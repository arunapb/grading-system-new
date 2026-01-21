import pdf from "pdf-parse";

export interface GradeRecord {
  indexNumber: string;
  grade: string;
}

function cleanText(raw: string): string {
  return raw
    .replace(/[\u200B\u200C\u200D\uFEFF\u2060\u00AD]/g, "")
    .replace(/[‐-‒–—−]/g, "-")
    .replace(/[＋]/g, "+")
    .replace(/\s+/g, " ");
}

export interface PDFParseResult {
  moduleCode?: string;
  moduleName?: string;
  records: GradeRecord[];
}

export async function parseResultPDF(
  pdfBuffer: Buffer,
): Promise<PDFParseResult> {
  try {
    const data = await pdf(pdfBuffer);
    const cleaned = cleanText(data.text);

    // Extract Module Info
    // Pattern matches: "IS3001 - Scientific Communication"
    // We look for 2-4 uppercase letters followed by digits, then hyphen, then name
    const modulePattern =
      /\b((?:IN|IS|CM)\d{4})\s*-\s*([A-Za-z0-9\s&()]+?)(?=\s+(?:Index|Grade|\d{6}[A-Z]))/i;
    const moduleMatch = modulePattern.exec(cleaned);

    let moduleCode: string | undefined;
    let moduleName: string | undefined;

    if (moduleMatch) {
      moduleCode = moduleMatch[1].toUpperCase();
      moduleName = moduleMatch[2].trim();
      console.log("FOUND MODULE:", moduleCode, moduleName);
    }

    const pattern = /(\d{6}[A-Z])([A-D][+\-]?|[EF]|I)/g;

    const records: GradeRecord[] = [];
    let match;

    while ((match = pattern.exec(cleaned)) !== null) {
      records.push({
        indexNumber: match[1],
        grade: match[2],
      });
    }

    return {
      moduleCode,
      moduleName,
      records,
    };
  } catch (err) {
    console.error("PDF parse error:", err);
    throw err;
  }
}
