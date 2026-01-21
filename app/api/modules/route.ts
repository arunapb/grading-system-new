import { NextRequest, NextResponse } from "next/server";
import { getAllModules, findOrCreateModule } from "@/lib/db/module.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const batch = searchParams.get("batch");
    const degree = searchParams.get("degree");
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");

    console.log(
      `📚 Fetching modules (batch: ${batch || "all"}, degree: ${degree || "all"}, year: ${year || "all"}, semester: ${semester || "all"})`,
    );

    const yearNumber = year ? parseInt(year) : undefined;
    const semesterNumber = semester ? parseInt(semester) : undefined;

    const modules = await getAllModules(
      batch || undefined,
      degree || undefined,
      yearNumber,
      semesterNumber,
    );

    console.log(`✅ Found ${modules.length} modules`);

    return NextResponse.json({
      success: true,
      count: modules.length,
      modules: modules.map((m: any) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        credits: m.credits,
        gradeCount: m._count.grades,
        semester: m.semester.name,
        year: m.semester.year.name,
        degree: m.semester.year.degree.name,
        batch: m.semester.year.degree.batch.name,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching modules:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, credits, semesterId } = body;

    if (!code || !name || credits === undefined || !semesterId) {
      return NextResponse.json(
        {
          success: false,
          error: "code, name, credits, and semesterId are required",
        },
        { status: 400 },
      );
    }

    console.log(`📝 Creating module: ${code} - ${name}`);

    const module = await findOrCreateModule(code, name, credits, semesterId);

    console.log(`✅ Created module: ${module.code} (${module.id})`);

    return NextResponse.json({
      success: true,
      module: {
        id: module.id,
        code: module.code,
        name: module.name,
        credits: module.credits,
        semesterId: module.semesterId,
      },
    });
  } catch (error) {
    console.error("❌ Error creating module:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
