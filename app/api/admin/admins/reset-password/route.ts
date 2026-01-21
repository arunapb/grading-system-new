import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db/prisma";

// POST - Reset password using OTP code (Public route)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, resetCode, newPassword } = body;

    if (!username || !resetCode || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Username, reset code, and new password are required",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid username or reset code" },
        { status: 400 },
      );
    }

    // Check if reset code matches and is not expired
    if (!admin.resetCode || admin.resetCode !== resetCode.toUpperCase()) {
      return NextResponse.json(
        { success: false, error: "Invalid reset code" },
        { status: 400 },
      );
    }

    if (!admin.resetCodeExpiresAt || admin.resetCodeExpiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Reset code has expired" },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password and clear reset code
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
