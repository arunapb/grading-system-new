import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createInvitation,
  getAllInvitations,
  deleteInvitation,
} from "@/lib/db/invitation.service";

// GET - List all invitations (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await getAllInvitations();
    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error getting invitations:", error);
    return NextResponse.json(
      { error: "Failed to get invitations" },
      { status: 500 },
    );
  }
}

// POST - Create a new invitation (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, expiresInMinutes = 60, maxUses = 1 } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    const invitation = await createInvitation(
      studentId,
      expiresInMinutes,
      maxUses,
    );

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}

// DELETE - Delete an invitation (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 },
      );
    }

    await deleteInvitation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 },
    );
  }
}
