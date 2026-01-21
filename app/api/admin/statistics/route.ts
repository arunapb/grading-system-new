import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAllStudentsWithCGPA } from "@/lib/db/student.service";
import { getAllBatches } from "@/lib/db/batch.service";

interface GradeDistribution {
  [grade: string]: number;
}

interface BatchStats {
  name: string;
  studentCount: number;
  averageCGPA: number;
  topGPA: number;
  degrees: number;
  topStudents: Array<{
    indexNumber: string;
    name: string | null;
    cgpa: number;
  }>;
  gradeDistribution: GradeDistribution;
}

export async function GET() {
  try {
    console.log("📊 Fetching admin statistics from database...");

    // Get all batches
    const batches = await getAllBatches();
    const batchNames = batches.map((b: any) => b.name);

    // Get global student count and average
    const allStudents = await getAllStudentsWithCGPA();
    const totalStudents = allStudents.length;
    const averageCGPA =
      totalStudents > 0
        ? allStudents.reduce((sum: number, s: any) => sum + s.cgpa, 0) /
          totalStudents
        : 0;

    // Get top 10 students globally
    const topStudentsGlobal = allStudents.slice(0, 10).map((s: any) => ({
      indexNumber: s.indexNumber,
      name: s.name,
      cgpa: s.cgpa,
      totalCredits: s.totalCredits,
      moduleCount: s.moduleCount,
    }));

    // Count total modules (as proxy for PDFs)
    const totalModules = await prisma.module.count();

    // Get stats for each batch
    const batchStats: BatchStats[] = [];

    for (const batchName of batchNames) {
      // Get degree count for this batch
      const degreeCount = await prisma.degree.count({
        where: { batch: { name: batchName } },
      });

      // Get students for this batch
      const batchStudents = await getAllStudentsWithCGPA(batchName);

      if (batchStudents.length === 0) {
        batchStats.push({
          name: batchName,
          studentCount: 0,
          averageCGPA: 0,
          topGPA: 0,
          degrees: degreeCount,
          topStudents: [],
          gradeDistribution: {},
        });
        continue;
      }

      const batchAvgCGPA =
        batchStudents.reduce((sum: number, s: any) => sum + s.cgpa, 0) /
        batchStudents.length;
      const topGPA = batchStudents[0]?.cgpa || 0;

      // Get top 3 students for this batch
      const topStudents = batchStudents.slice(0, 3).map((s: any) => ({
        indexNumber: s.indexNumber,
        name: s.name,
        cgpa: s.cgpa,
      }));

      // Get grade distribution from database
      const gradeDistribution: GradeDistribution = {};
      const grades = await prisma.studentGrade.groupBy({
        by: ["grade"],
        where: {
          student: {
            degree: {
              batch: { name: batchName },
            },
          },
        },
        _count: {
          grade: true,
        },
      });

      for (const g of grades) {
        gradeDistribution[g.grade] = g._count.grade;
      }

      batchStats.push({
        name: batchName,
        studentCount: batchStudents.length,
        averageCGPA: batchAvgCGPA,
        topGPA,
        degrees: degreeCount,
        topStudents,
        gradeDistribution,
      });
    }

    console.log(`✅ Statistics fetched for ${batchNames.length} batches`);

    return NextResponse.json({
      success: true,
      overall: {
        totalBatches: batchNames.length,
        totalStudents,
        averageCGPA,
        totalPDFs: totalModules, // Using module count as proxy
      },
      batches: batchStats,
      topStudentsGlobal,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
