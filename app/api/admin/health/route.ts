import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActivityLogs } from "@/lib/db/activity.service";

interface SystemHealth {
  database: {
    connected: boolean;
    totalBatches: number;
    totalDegrees: number;
    totalStudents: number;
    totalModules: number;
    totalGrades: number;
  };
  parsing: {
    totalParsed: number;
    totalFailed: number;
    successRate: number;
  };
  recentErrors: Array<{
    timestamp: string;
    action: string;
    error: string;
  }>;
  recentActivity: Array<{
    timestamp: string;
    action: string;
    details: any;
  }>;
}

export async function GET() {
  try {
    // Test database connection and get counts
    let connected = false;
    let totalBatches = 0;
    let totalDegrees = 0;
    let totalStudents = 0;
    let totalModules = 0;
    let totalGrades = 0;

    try {
      [totalBatches, totalDegrees, totalStudents, totalModules, totalGrades] =
        await Promise.all([
          prisma.batch.count(),
          prisma.degree.count(),
          prisma.student.count(),
          prisma.module.count(),
          prisma.studentGrade.count(),
        ]);
      connected = true;
    } catch (dbError) {
      console.error("Database connection error:", dbError);
    }

    // Get parsing stats from activity logs
    let totalParsed = 0;
    let totalFailed = 0;

    try {
      const [parsedLogs, failedLogs] = await Promise.all([
        prisma.activityLog.count({
          where: { action: "PDF_UPLOADED", success: true },
        }),
        prisma.activityLog.count({
          where: { action: "PDF_UPLOAD_FAILED" },
        }),
      ]);
      totalParsed = parsedLogs;
      totalFailed = failedLogs;
    } catch {
      // Ignore errors
    }

    const successRate =
      totalParsed + totalFailed > 0
        ? (totalParsed / (totalParsed + totalFailed)) * 100
        : 0;

    // Get recent activity logs from database
    const logs = await getActivityLogs(20);

    // Extract recent errors
    const recentErrors = logs
      .filter((log) => !log.success)
      .slice(0, 10)
      .map((log) => ({
        timestamp: log.createdAt.toISOString(),
        action: log.action,
        error:
          (log.details as any)?.error ||
          (log.details as any)?.message ||
          "Unknown error",
      }));

    // Recent successful activity
    const recentActivity = logs
      .filter((log) => log.success)
      .slice(0, 10)
      .map((log) => ({
        timestamp: log.createdAt.toISOString(),
        action: log.action,
        details: log.details,
      }));

    const health: SystemHealth = {
      database: {
        connected,
        totalBatches,
        totalDegrees,
        totalStudents,
        totalModules,
        totalGrades,
      },
      parsing: {
        totalParsed,
        totalFailed,
        successRate,
      },
      recentErrors,
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error("Error fetching system health:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
