import fs from 'fs';
import path from 'path';

export interface PDFInfo {
    pdfPath: string;
    outputPath: string;
    hasOutput: boolean;
    year: string;
    semester: string;
    filename: string;
    moduleCode: string;
    moduleName: string;
    credits: number | null;
}

export interface ModuleMetadata {
    moduleCode: string;
    moduleName: string;
    credits: number;
    year: string;
    semester: string;
}

/**
 * Recursively scan directory for PDF files
 * @param basePath - Base path to scan (defaults to data directory)
 * @param currentPath - Current relative path being scanned
 * @param batch - Optional batch context (e.g., "batch 21")
 * @param degree - Optional degree context (e.g., "IT")
 */
export function scanPDFDirectory(
    basePath?: string,
    currentPath: string = '',
    batch?: string,
    degree?: string
): PDFInfo[] {
    const results: PDFInfo[] = [];

    // If batch and degree are provided, use input/[batch]/[degree] path
    // Otherwise, use the legacy data path for backward compatibility
    let scanPath: string;
    if (batch && degree) {
        scanPath = path.join(process.cwd(), 'data', 'input', batch, degree, currentPath);
    } else if (basePath) {
        scanPath = path.join(basePath, currentPath);
    } else {
        scanPath = path.join(process.cwd(), 'data', currentPath);
    }

    // Log the exact scanning path (only at the root level)
    if (currentPath === '') {
        console.log(`📂 Scanning path: ${scanPath}`);
    }

    if (!fs.existsSync(scanPath)) {
        console.warn(`⚠️ Path does not exist: ${scanPath}`);
        return results;
    }

    const entries = fs.readdirSync(scanPath, { withFileTypes: true });

    for (const entry of entries) {
        const relativePath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
            // Recursively scan subdirectories
            results.push(...scanPDFDirectory(basePath, relativePath, batch, degree));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
            // Found a PDF file
            const { year, semester } = extractMetadata(relativePath);
            const outputPath = getOutputPath(relativePath, batch, degree);
            const hasOutput = fs.existsSync(outputPath);
            const moduleCode = extractModuleCode(entry.name);
            const moduleName = extractModuleName(entry.name);

            results.push({
                pdfPath: relativePath.replace(/\\/g, '/'),
                outputPath: outputPath.replace(/\\/g, '/'),
                hasOutput,
                year,
                semester,
                filename: entry.name,
                moduleCode,
                moduleName,
                credits: null, // Will be loaded from metadata
            });
        }
    }

    return results;
}

/**
 * Extract year and semester from folder path ONLY (not from filename)
 * e.g., "Year 1/Semester 2/file.pdf" -> { year: "Year 1", semester: "2" }
 */
export function extractMetadata(relativePath: string): { year: string; semester: string } {
    const parts = relativePath.split(/[\\\/]/);

    // Remove the last part (filename) to only check directory structure
    const directoryParts = parts.slice(0, -1);

    let year = 'Unknown';
    let semester = 'Unknown';

    for (const part of directoryParts) {
        if (part.match(/Year\s+\d+/i)) {
            year = part;
        }
        if (part.match(/Semester\s+(\d+)/i)) {
            // Extract only the numeric value (1 or 2) from folder name
            const match = part.match(/Semester\s+(\d+)/i);
            semester = match ? match[1] : 'Unknown';
        }
    }

    return { year, semester };
}

/**
 * Get output path for a PDF file
 * @param relativePath - Relative path of the PDF file
 * @param batch - Optional batch context
 * @param degree - Optional degree context
 * 
 * Examples:
 * - With context: getOutputPath("Year 1/Semester 1/file.pdf", "batch 21", "IT")
 *   -> "data/output/batch 21/IT/Year 1/Semester 1/file.pdf.json"
 * - Legacy: getOutputPath("Year 1/Semester 1/file.pdf")
 *   -> "data/output/Year 1/Semester 1/file.pdf.json"
 */
export function getOutputPath(relativePath: string, batch?: string, degree?: string): string {
    const dataDir = path.join(process.cwd(), 'data');

    if (batch && degree) {
        // New structure: data/output/[batch]/[degree]/[relativePath].json
        return path.join(dataDir, 'output', batch, degree, relativePath + '.json');
    } else {
        // Legacy structure: data/output/[relativePath].json
        return path.join(dataDir, 'output', relativePath + '.json');
    }
}

/**
 * Ensure output directory exists
 */
export function ensureOutputDirectory(outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
}

/**
 * Check if output JSON exists
 */
export function checkOutputExists(outputPath: string): boolean {
    return fs.existsSync(outputPath);
}

/**
 * Extract module code from filename
 * Pattern: (IN|CM|IS)\d{4}
 * e.g., "IN1311_Digital System Design.pdf" -> "IN1311"
 */
export function extractModuleCode(filename: string): string {
    const match = filename.match(/(IN|CM|IS)\d{4}/i);
    return match ? match[0].toUpperCase() : 'Unknown';
}

/**
 * Extract module name from filename
 * Assumes format: CODE_Module Name_Other Info.pdf
 * e.g., "IN1311_Digital System Design_Intake 2021.pdf" -> "Digital System Design"
 */
export function extractModuleName(filename: string): string {
    // Remove .pdf extension
    const withoutExt = filename.replace(/\.pdf$/i, '');

    // Split by underscore and get the second part (module name)
    const parts = withoutExt.split('_');

    if (parts.length >= 2) {
        // Return second part as module name
        return parts[1].trim();
    }

    // Fallback: return filename without extension
    return withoutExt;
}
