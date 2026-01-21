import { NextResponse } from "next/server";
import { getAllBatches } from "@/lib/db/batch.service";

export async function GET() {
  try {
    const batches = await getAllBatches();
    const batchNames = batches.map((b: any) => b.name).sort();
    return NextResponse.json({ batches: batchNames });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json({ batches: [] }, { status: 500 });
  }
}
