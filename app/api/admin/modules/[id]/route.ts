import { NextResponse } from "next/server";
import { updateModule, deleteModule } from "@/lib/db/module.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedModule = await updateModule(id, body);

    return NextResponse.json({
      success: true,
      module: updatedModule,
    });
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update module",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    await deleteModule(id);

    return NextResponse.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete module",
      },
      { status: 500 },
    );
  }
}
