import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hash } from "bcryptjs";
import prisma from "@/lib/db/prisma";

// GET all admins (Super Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        resetCode: true,
        resetCodeExpiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST - Create new admin (Super Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const { name, username, password } = body;

    if (!name || !username || !password) {
      return new NextResponse("Name, username, and password are required", {
        status: 400,
      });
    }

    // Check if username exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      return new NextResponse("Username already exists", { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin with PENDING status (needs approval)
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: "ADMIN",
        status: "APPROVED", // Auto-approve when Super Admin creates
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newAdmin);
  } catch (error) {
    console.error("Error creating admin:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE - Remove admin (Super Admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Admin ID is required", { status: 400 });
    }

    // Prevent deleting self or other super admins
    const adminToDelete = await prisma.admin.findUnique({
      where: { id },
    });

    if (!adminToDelete) {
      return new NextResponse("Admin not found", { status: 404 });
    }

    if (adminToDelete.role === "SUPER_ADMIN") {
      return new NextResponse("Cannot delete a Super Admin", { status: 400 });
    }

    await prisma.admin.delete({
      where: { id },
    });

    return new NextResponse("Admin deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH - Update admin status or details (Super Admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const { id, status, name, username, password } = body;

    if (!id) {
      return new NextResponse("Admin ID is required", { status: 400 });
    }

    const adminToUpdate = await prisma.admin.findUnique({
      where: { id },
    });

    if (!adminToUpdate) {
      return new NextResponse("Admin not found", { status: 404 });
    }

    // Prevent modifying Super Admin status
    if (adminToUpdate.role === "SUPER_ADMIN" && status) {
      return new NextResponse("Cannot change Super Admin status", {
        status: 400,
      });
    }

    const updateData: any = {};

    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (username) {
      // Check if new username is taken
      const existing = await prisma.admin.findUnique({ where: { username } });
      if (existing && existing.id !== id) {
        return new NextResponse("Username already taken", { status: 400 });
      }
      updateData.username = username;
    }
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error("Error updating admin:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
