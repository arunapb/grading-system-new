import fs from "fs";
import path from "path";
import {
  calculateCGPA,
  calculateSGPA,
  gradeToPoints,
  ModuleGrade,
} from "./gpa-calculator";
import { getStudentProfile } from "./profile-store";

export interface StudentSummary {
  indexNumber: string;
  name: string | null;
  photoUrl: string | null;
  cgpa: number;
  totalCredits: number;
  moduleCount: number;
}

export interface SemesterData {
  year: string;
  semester: string;
  sgpa: number;
  credits: number;
  modules: ModuleGrade[];
}

export interface StudentDetails {
  indexNumber: string;
  rank: number;
  name: string | null;
  photoUrl: string | null;
  cgpa: number;
  totalCredits: number;
  semesters: SemesterData[];
  modules: ModuleGrade[];
}

interface ParsedModuleJSON {
  moduleCode: string;
  moduleName: string;
  credits: number;
  year: string;
  semester: string;
  students: Array<{
    indexNumber: string;
    grade: string;
  }>;
}

/**
 * Read and parse all JSON files from output directory
 * @param batch - Optional batch context (e.g., "batch 21")
 * @param degree - Optional degree context (e.g., "IT")
 */
function readAllModuleData(
  batch?: string,
  degree?: string,
): ParsedModuleJSON[] {
  const dataDir = path.join(process.cwd(), "data");
  let outputDir: string;

  if (batch && degree) {
    // Specific batch and degree: data/output/[batch]/[degree]
    outputDir = path.join(dataDir, "output", batch, degree);
  } else if (batch) {
    // All degrees in a batch: data/output/[batch]
    outputDir = path.join(dataDir, "output", batch);
  } else {
    // Legacy structure: data/output
    outputDir = path.join(dataDir, "output");
  }

  if (!fs.existsSync(outputDir)) {
    console.warn(`⚠️ Output directory does not exist: ${outputDir}`);
    return [];
  }

  const modules: ParsedModuleJSON[] = [];

  // Recursively find all JSON files
  function findJSONFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findJSONFiles(fullPath));
      } else if (
        entry.name.endsWith(".json") &&
        !entry.name.includes("metadata") &&
        !entry.name.includes("profiles")
      ) {
        results.push(fullPath);
      }
    }

    return results;
  }

  const jsonFiles = findJSONFiles(outputDir);

  for (const filePath of jsonFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);

      // Validate structure
      if (data.moduleCode && data.students && Array.isArray(data.students)) {
        modules.push(data);
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
  }

  console.log(
    `📚 Loaded ${modules.length} module JSON files from ${outputDir}`,
  );
  return modules;
}

/**
 * Aggregate all student data from module JSONs
 * @param batch - Optional batch context
 * @param degree - Optional degree context
 */
export function aggregateStudentData(
  batch?: string,
  degree?: string,
): Map<string, ModuleGrade[]> {
  const moduleData = readAllModuleData(batch, degree);
  const studentMap = new Map<string, ModuleGrade[]>();

  for (const module of moduleData) {
    for (const student of module.students) {
      const moduleGrade: ModuleGrade = {
        moduleCode: module.moduleCode,
        moduleName: module.moduleName,
        grade: student.grade,
        credits: module.credits || 0,
        gradePoints: gradeToPoints(student.grade),
        year: module.year,
        semester: module.semester,
        id: `${module.moduleCode}-${student.indexNumber}`,
      };

      if (!studentMap.has(student.indexNumber)) {
        studentMap.set(student.indexNumber, []);
      }

      studentMap.get(student.indexNumber)!.push(moduleGrade);
    }
  }

  console.log(`👥 Found ${studentMap.size} unique students`);
  return studentMap;
}

/**
 * Get all students with their CGPA and profile data
 * @param batch - Optional batch context
 * @param degree - Optional degree context
 */
export function getAllStudents(
  batch?: string,
  degree?: string,
): StudentSummary[] {
  const studentMap = aggregateStudentData(batch, degree);
  const students: StudentSummary[] = [];

  for (const [indexNumber, modules] of Array.from(studentMap.entries())) {
    const cgpa = calculateCGPA(modules);
    const totalCredits = modules.reduce(
      (sum: number, m: ModuleGrade) => sum + m.credits,
      0,
    );
    const profile = getStudentProfile(indexNumber, batch, degree);

    students.push({
      indexNumber,
      name: profile?.name || null,
      photoUrl: profile?.photoUrl || null,
      cgpa,
      totalCredits,
      moduleCount: modules.length,
    });
  }

  // Sort by CGPA descending
  students.sort((a, b) => b.cgpa - a.cgpa);

  return students;
}

/**
 * Get detailed information for a specific student with profile data
 * @param indexNumber - Student index number
 * @param batch - Optional batch context
 * @param degree - Optional degree context
 */
export function getStudentDetails(
  indexNumber: string,
  batch?: string,
  degree?: string,
): StudentDetails | null {
  const studentMap = aggregateStudentData(batch, degree);
  const modules = studentMap.get(indexNumber);

  if (!modules) {
    return null;
  }

  // Group modules by semester
  const semesterMap = new Map<string, ModuleGrade[]>();

  for (const module of modules) {
    const key = `${module.year}|${module.semester}`;
    if (!semesterMap.has(key)) {
      semesterMap.set(key, []);
    }
    semesterMap.get(key)!.push(module);
  }

  // Create semester data
  const semesters: SemesterData[] = [];

  for (const [key, semesterModules] of Array.from(semesterMap.entries())) {
    const [year, semester] = key.split("|");
    const sgpa = calculateSGPA(semesterModules);
    const credits = semesterModules.reduce(
      (sum: number, m: ModuleGrade) => sum + m.credits,
      0,
    );

    semesters.push({
      year,
      semester,
      sgpa,
      credits,
      modules: semesterModules,
    });
  }

  // Sort semesters by year and semester
  semesters.sort((a, b) => {
    const yearCompare = a.year.localeCompare(b.year);
    if (yearCompare !== 0) return yearCompare;
    return a.semester.localeCompare(b.semester);
  });

  const cgpa = calculateCGPA(modules);
  const totalCredits = modules.reduce(
    (sum: number, m: ModuleGrade) => sum + m.credits,
    0,
  );
  const profile = getStudentProfile(indexNumber, batch, degree);

  // Calculate rank by comparing with all students
  const allStudents = getAllStudents(batch, degree);
  const rank = allStudents.findIndex((s) => s.indexNumber === indexNumber) + 1;

  return {
    indexNumber,
    rank,
    name: profile?.name || null,
    photoUrl: profile?.photoUrl || null,
    cgpa,
    totalCredits,
    semesters,
    modules,
  };
}

/**
 * Calculate CGPA for all students (utility function)
 */
export function calculateAllStudentsCGPA(): Record<string, number> {
  const studentMap = aggregateStudentData();
  const cgpaMap: Record<string, number> = {};

  for (const [indexNumber, modules] of Array.from(studentMap.entries())) {
    cgpaMap[indexNumber] = calculateCGPA(modules);
  }

  return cgpaMap;
}
