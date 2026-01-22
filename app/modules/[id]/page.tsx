import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  Book,
  Users,
  BarChart3,
  GraduationCap,
  Clock,
} from "lucide-react";
import { ModuleStudentsTable } from "@/components/ModuleStudentsTable";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

async function getModuleDetails(id: string) {
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      semester: {
        include: {
          year: {
            include: {
              degree: {
                include: {
                  batch: true,
                },
              },
            },
          },
        },
      },
      grades: {
        include: {
          student: {
            select: {
              id: true,
              indexNumber: true,
              name: true,
            },
          },
        },
        orderBy: {
          student: {
            indexNumber: "asc",
          },
        },
      },
    },
  });

  return module;
}

function calculateGradeStats(
  grades: Array<{ grade: string; gradePoints: number }>,
) {
  const gradeOrder = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D",
    "I",
    "F",
    "P",
    "N",
    "W",
    "PENDING",
  ];

  const gradeCounts: Record<string, number> = {};
  let totalGradePoints = 0;
  let validGradesCount = 0;

  for (const g of grades) {
    gradeCounts[g.grade] = (gradeCounts[g.grade] || 0) + 1;
    if (g.gradePoints > 0) {
      totalGradePoints += g.gradePoints;
      validGradesCount++;
    }
  }

  const distribution: GradeDistribution[] = gradeOrder
    .filter((grade) => gradeCounts[grade])
    .map((grade) => ({
      grade,
      count: gradeCounts[grade],
      percentage: (gradeCounts[grade] / grades.length) * 100,
    }));

  const averageGPA =
    validGradesCount > 0 ? totalGradePoints / validGradesCount : 0;
  const passCount = grades.filter((g) => g.gradePoints >= 2.0).length;
  const failCount = grades.filter(
    (g) => g.gradePoints > 0 && g.gradePoints < 2.0,
  ).length;
  const pendingCount = grades.filter((g) => g.grade === "PENDING").length;

  return { distribution, averageGPA, passCount, failCount, pendingCount };
}

export default async function ModuleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const module = await getModuleDetails(id);

  if (!module) {
    notFound();
  }

  const { distribution, averageGPA, passCount, failCount, pendingCount } =
    calculateGradeStats(
      module.grades.map((g) => ({
        grade: g.grade,
        gradePoints: g.gradePoints,
      })),
    );

  const totalStudents = module.grades.length;
  const gradedStudents = totalStudents - pendingCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/modules">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Modules
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Book className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {module.code}
              </h1>
              <p className="text-lg text-muted-foreground">{module.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">
              {module.semester.year.degree.batch.name}
            </Badge>
            <Badge variant="outline">{module.semester.year.degree.name}</Badge>
            <Badge variant="outline">{module.semester.year.name}</Badge>
            <Badge variant="outline">{module.semester.name}</Badge>
            <Badge variant="secondary">{module.credits} Credits</Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {gradedStudents} graded, {pendingCount} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average GPA</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageGPA.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Based on {gradedStudents} graded students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {gradedStudents > 0
                  ? ((passCount / gradedStudents) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {passCount} passed, {failCount} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {pendingCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting grade submission
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grade Distribution */}
        {distribution.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>
                Breakdown of grades for this module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {distribution.map((item) => (
                  <div key={item.grade} className="flex items-center gap-4">
                    <div className="w-12 font-mono font-semibold">
                      {item.grade}
                    </div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.grade === "PENDING"
                            ? "bg-amber-500"
                            : item.grade.startsWith("A")
                              ? "bg-green-500"
                              : item.grade.startsWith("B")
                                ? "bg-blue-500"
                                : item.grade.startsWith("C")
                                  ? "bg-yellow-500"
                                  : item.grade === "P"
                                    ? "bg-green-500"
                                    : ["N", "W"].includes(item.grade)
                                      ? "bg-slate-500"
                                      : "bg-red-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-sm">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students</CardTitle>
            <CardDescription>
              All students with grades for this module
            </CardDescription>
          </CardHeader>
          <CardContent>
            {module.grades.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No students enrolled in this module yet.
              </p>
            ) : (
              <ModuleStudentsTable grades={module.grades} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
