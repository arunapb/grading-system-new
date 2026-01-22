"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import { ORDERED_GRADES } from "@/lib/gpa-calculator";

interface ModuleStats {
  id: string;
  code: string;
  name: string;
  credits: number;
  totalStudents: number;
  gradeCounts: Record<string, number>;
  semester: string;
  semesterNumber: number;
  year: string;
  yearNumber: number;
  degree: string;
  batch: string;
}

interface GroupedModules {
  [batch: string]: {
    [degree: string]: {
      [year: string]: {
        [semester: string]: ModuleStats[];
      };
    };
  };
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-500",
  A: "bg-green-500",
  "A-": "bg-lime-500",
  "B+": "bg-yellow-500",
  B: "bg-amber-500",
  "B-": "bg-orange-500",
  "C+": "bg-red-400",
  C: "bg-red-500",
  "C-": "bg-red-600",
  "D+": "bg-rose-600",
  D: "bg-rose-700",
  E: "bg-gray-500",
  I: "bg-gray-400",
  F: "bg-gray-600",
};

export default function ModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleStats[]>([]);
  const [grouped, setGrouped] = useState<GroupedModules>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      try {
        const response = await fetch("/api/modules/statistics");
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to fetch modules");
          return;
        }

        setModules(data.modules);
        setGrouped(data.grouped);
      } catch (err) {
        setError("Failed to load modules");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalModules = modules.length;
  const totalStudentGrades = modules.reduce(
    (sum, m) => sum + m.totalStudents,
    0,
  );
  const totalAGrades = modules.reduce(
    (sum, m) =>
      sum +
      (m.gradeCounts["A+"] || 0) +
      (m.gradeCounts["A"] || 0) +
      (m.gradeCounts["A-"] || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Module Statistics
          </h1>
          <p className="text-muted-foreground">
            Overview of all modules with grade distributions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-500" />
                {totalModules}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-green-500" />
                {totalStudentGrades.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                A Grades (A+, A, A-)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2 text-emerald-600">
                <GraduationCap className="h-6 w-6" />
                {totalAGrades.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules by Batch/Degree/Year/Semester */}
        {Object.entries(grouped).map(([batch, degrees]) => (
          <div key={batch} className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{batch}</h2>

            {Object.entries(degrees).map(([degree, years]) => (
              <div key={degree} className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-muted-foreground">
                  {degree}
                </h3>

                {Object.entries(years)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([year, semesters]) => (
                    <div key={year} className="mb-4">
                      {Object.entries(semesters)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([semester, semesterModules]) => (
                          <Card key={semester} className="mb-4">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                {year} - {semester}
                              </CardTitle>
                              <CardDescription>
                                {semesterModules.length} modules
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Code</TableHead>
                                      <TableHead>Name</TableHead>
                                      <TableHead className="text-center">
                                        Credits
                                      </TableHead>
                                      <TableHead className="text-center">
                                        Students
                                      </TableHead>
                                      <TableHead>Grade Distribution</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {semesterModules.map((module) => (
                                      <TableRow
                                        key={module.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() =>
                                          router.push(`/modules/${module.id}`)
                                        }
                                      >
                                        <TableCell className="font-mono font-medium text-primary">
                                          {module.code}
                                        </TableCell>
                                        <TableCell>{module.name}</TableCell>
                                        <TableCell className="text-center">
                                          {module.credits}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Badge variant="secondary">
                                            {module.totalStudents}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex flex-wrap gap-1">
                                            {ORDERED_GRADES.filter(
                                              (grade) =>
                                                module.gradeCounts[grade] > 0,
                                            ).map((grade) => (
                                              <Badge
                                                key={grade}
                                                className={`${GRADE_COLORS[grade]} text-white text-xs`}
                                              >
                                                {grade}:{" "}
                                                {module.gradeCounts[grade]}
                                              </Badge>
                                            ))}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}

        {modules.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No modules found.
          </div>
        )}
      </div>
    </div>
  );
}
