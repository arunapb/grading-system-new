import prisma from "./prisma";

export async function logActivity(
  action: string,
  details: any,
  success: boolean = true,
) {
  try {
    return await prisma.activityLog.create({
      data: {
        action,
        details,
        success,
      },
    });
  } catch (error) {
    console.error("Failed to log activity to database:", error);
    // Don't throw - logging failure shouldn't break the app
    return null;
  }
}

export async function getActivityLogs(limit: number = 50) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getActivityLogsByAction(
  action: string,
  limit: number = 50,
) {
  return prisma.activityLog.findMany({
    where: { action },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function clearActivityLogs() {
  return prisma.activityLog.deleteMany({});
}
