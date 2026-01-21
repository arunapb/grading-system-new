import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    // Filter parameters
    const action = searchParams.get("action");
    const userType = searchParams.get("userType");
    const success = searchParams.get("success");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const limit = Number.parseInt(searchParams.get("limit") || "100");

    // Build where clause dynamically
    const where: any = {};

    if (action && action !== "all") {
      where.action = action;
    }

    // Filter by userType in JSON details
    if (userType && userType !== "all") {
      where.details = {
        path: ["userType"],
        equals: userType,
      };
    }

    if (success && success !== "all") {
      where.success = success === "true";
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to include the end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lte = end;
      }
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Apply search filter on results if needed (for searching in JSON details)
    let filteredLogs = logs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = logs.filter((log: any) => {
        const detailsStr = JSON.stringify(log.details).toLowerCase();
        const actionStr = log.action.toLowerCase();
        return (
          detailsStr.includes(searchLower) || actionStr.includes(searchLower)
        );
      });
    }

    // Get unique actions for filter dropdown
    const allActions = await prisma.activityLog.groupBy({
      by: ["action"],
      orderBy: { action: "asc" },
    });

    return NextResponse.json({
      logs: filteredLogs,
      actions: allActions.map((a: any) => a.action),
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
