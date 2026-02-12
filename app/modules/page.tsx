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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import { ORDERED_GRADES } from "@/lib/gpa-calculator";
import { usePublicBatches } from "@/hooks/batch.hooks";
import { useDegrees } from "@/hooks/degree.hooks";

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
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [modules, setModules] = useState<ModuleStats[]>([]);
  const [grouped, setGrouped] = useState<GroupedModules>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch batches and degrees
  const { data: batches = [] } = usePublicBatches();
  const { data: degrees = [] } = useDegrees(selectedBatch || undefined);

  // Fetch modules when batch and degree are selected
  useEffect(() => {
    if (!selectedBatch || !selectedDegree) {
      setModules([]);
      setGrouped({});
      return;
    }

    async function fetchModules() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("batch", selectedBatch);
        params.append("degree", selectedDegree);

        const response = await fetch(
          `/api/modules/statistics?${params.toString()}`,
        );
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
  }, [selectedBatch, selectedDegree]);

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
            Select a batch and degree to view modules with grade distributions
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Batch & Degree</CardTitle>
            <CardDescription>
              Choose a batch and degree to view their modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Batch</Label>
                <Select
                  value={selectedBatch}
                  onValueChange={(v) => {
                    setSelectedBatch(v);
                    setSelectedDegree("");
                  }}
                >
                  <SelectTrigger id="batch">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.name} value={batch.name}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Select
                  value={selectedDegree}
                  onValueChange={setSelectedDegree}
                  disabled={!selectedBatch}
                >
                  <SelectTrigger id="degree">
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((degree) => (
                      <SelectItem key={degree.id} value={degree.name}>
                        {degree.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading modules...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Prompt to select */}
        {!selectedBatch || !selectedDegree ? (
          !loading && (
            <div className="text-center py-12 text-muted-foreground">
              Please select a batch and degree to view modules.
            </div>
          )
        ) : (
          <>
            {/* Summary Cards */}
            {!loading && modules.length > 0 && (
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
            )}

            {/* Modules by Year/Semester */}
            {!loading &&
              Object.entries(grouped).map(([batch, degrees]) =>
                Object.entries(degrees).map(([degree, years]) => (
                  <div key={`${batch}-${degree}`} className="mb-6">
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
                                          <TableHead>
                                            Grade Distribution
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {semesterModules.map((module) => (
                                          <TableRow
                                            key={module.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() =>
                                              router.push(
                                                `/modules/${module.id}`,
                                              )
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
                                                    module.gradeCounts[grade] >
                                                    0,
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
                )),
              )}

            {!loading && modules.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No modules found for {selectedDegree} in {selectedBatch}.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
