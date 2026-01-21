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

    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
