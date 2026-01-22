import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db/prisma";
import { randomBytes } from "crypto";

// POST - Generate reset code for an admin (Super Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const { adminId, expiresInMinutes = 30 } = body;

    if (!adminId) {
      return new NextResponse("Admin ID is required", { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return new NextResponse("Admin not found", { status: 404 });
    }

    if (admin.role === "SUPER_ADMIN") {
      return new NextResponse("Cannot generate reset code for Super Admin", {
        status: 400,
      });
    }

    // Generate 6-character alphanumeric code
    const resetCode = randomBytes(3).toString("hex").toUpperCase();
    const resetCodeExpiresAt = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    );

    await prisma.admin.update({
      where: { id: adminId },
      data: {
        resetCode,
        resetCodeExpiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      resetCode,
      expiresAt: resetCodeExpiresAt,
      adminName: admin.name,
      adminUsername: admin.username,
    });
  } catch (error) {
    console.error("Error generating reset code:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE - Clear reset code (Super Admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return new NextResponse("Admin ID is required", { status: 400 });
    }

    await prisma.admin.update({
      where: { id: adminId },
      data: {
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    });

    return new NextResponse("Reset code cleared", { status: 200 });
  } catch (error) {
    console.error("Error clearing reset code:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
