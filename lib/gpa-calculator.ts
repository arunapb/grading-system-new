/**
 * Grade to Grade Point mapping
 * Based on standard university grading system
 */
export const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  D: 1.0,
  F: 0.0,
  I: 0.0,
  P: 0.0,
  N: 0.0,
  W: 0.0,
};

/**
 * Explicit grade order for sorting/display
 * Ensures A+ comes before A, and D comes before I/F
 */
export const ORDERED_GRADES = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "E",
  "I",
  "F",
] as const;

/**
 * Get the sort priority of a grade (higher index = lower priority, so we invert or just use index)
 * Returns a number for sorting. Lower number = higher priority to match existing sorts that might use indexes,
 * or we can define consistent behavior.
 * Let's use: Higher value = Higher Priority (A+ > A) to match typical `b - a` numeric sorts.
 */
export function getGradePriority(grade: string): number {
  const index = ORDERED_GRADES.indexOf(grade as any);
  if (index === -1) return -1;
  // Invert index so 0 (A+) becomes highest value
  return ORDERED_GRADES.length - index;
}

export interface ModuleGrade {
  moduleCode: string;
  moduleName: string;
  grade: string;
  credits: number;
  gradePoints: number;
  year: string;
  semester: string;
}

/**
 * Convert a grade letter to grade points
 */
export function gradeToPoints(grade: string): number {
  const normalizedGrade = grade.toUpperCase().trim();
  return GRADE_POINTS[normalizedGrade] ?? 0.0;
}

/**
 * Calculate SGPA (Semester Grade Point Average)
 * SGPA = Σ(gradePoint * credits) / Σ(credits)
 */
export function calculateSGPA(modules: ModuleGrade[]): number {
  if (modules.length === 0) return 0;

  let totalPoints = 0;
  let totalCredits = 0;

  for (const module of modules) {
    const points = gradeToPoints(module.grade);
    totalPoints += points * module.credits;
    totalCredits += module.credits;
  }

  return totalCredits > 0
    ? parseFloat((totalPoints / totalCredits).toFixed(2))
    : 0;
}

/**
 * Calculate CGPA (Cumulative Grade Point Average)
 * CGPA = Σ(gradePoint * credits for all modules) / Σ(all credits)
 */
export function calculateCGPA(allModules: ModuleGrade[]): number {
  // CGPA is essentially SGPA calculated across all semesters
  return calculateSGPA(allModules);
}

/**
 * Get color class for GPA value
 */
export function getGPAColor(gpa: number): string {
  if (gpa >= 3.7) return "text-green-600";
  if (gpa >= 3.0) return "text-blue-600";
  if (gpa >= 2.0) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get performance label for GPA
 */
export function getGPALabel(gpa: number): string {
  if (gpa >= 3.7) return "Excellent";
  if (gpa >= 3.0) return "Good";
  if (gpa >= 2.0) return "Satisfactory";
  return "Needs Improvement";
}

/**
 * Get predicted class based on GPA
 * 3.70 or above - First Class
 * 3.30 – 3.69 - Second Class – Upper Division
 * 3.00 – 3.29 - Second Class – Lower Division
 * 2.00 – 2.99 - General
 */
export function getPredictedClass(gpa: number): string {
  if (gpa >= 3.7) return "First Class";
  if (gpa >= 3.3) return "Second Class – Upper Division";
  if (gpa >= 3.0) return "Second Class – Lower Division";
  if (gpa >= 2.0) return "General";
  if (gpa >= 2.0) return "General";
  return "N/A";
}

/**
 * Format GPA for display (standardized to 2 decimal places)
 */
export function formatGPA(gpa: number): string {
  if (isNaN(gpa)) return "0.00";
  return gpa.toFixed(2);
}
