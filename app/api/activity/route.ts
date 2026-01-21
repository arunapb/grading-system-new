import { NextRequest, NextResponse } from "next/server";
import {
  getActivityLogs,
  getActivityLogsByAction,
  clearActivityLogs,
} from "@/lib/db/activity.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");

    console.log(
      `📜 Fetching activity logs (limit: ${limit}, action: ${action || "all"})`,
    );

    let logs;

    if (action) {
      logs = await getActivityLogsByAction(action, limit);
    } else {
      logs = await getActivityLogs(limit);
    }

    console.log(`✅ Found ${logs.length} activity logs`);

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        success: log.success,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching activity logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("🗑️ Clearing activity logs");

    const result = await clearActivityLogs();

    console.log(`✅ Cleared ${result.count} activity logs`);

    return NextResponse.json({
      success: true,
      message: "Activity logs cleared",
      count: result.count,
    });
  } catch (error) {
    console.error("❌ Error clearing activity logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
