"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ModuleGrade } from "@/lib/gpa-calculator";
import { gradeToPoints } from "@/lib/gpa-calculator";

interface GradeAnalyticsProps {
  modules: ModuleGrade[];
  semesters: Array<{
    year: string;
    semester: string;
    sgpa: number;
    credits: number;
  }>;
}

export function GradeAnalytics({ modules, semesters }: GradeAnalyticsProps) {
  // Grade distribution data
  const gradeDistribution = modules.reduce(
    (acc, module) => {
      const grade = module.grade;
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const gradeDistributionData = Object.entries(gradeDistribution)
    .map(([grade, count]) => ({
      grade,
      count,
      gradePoint: gradeToPoints(grade),
    }))
    .sort((a, b) => b.gradePoint - a.gradePoint);

  // SGPA progression over semesters
  const sgpaProgressionData = semesters.map((sem) => ({
    name: `Y${sem.year} S${sem.semester}`,
    sgpa: parseFloat(sem.sgpa.toFixed(4)),
    credits: sem.credits,
  }));

  // Top performing modules (A+, A, A-)
  const topPerformingModules = modules
    .filter((m) => ["A+", "A", "A-"].includes(m.grade))
    .sort((a, b) => gradeToPoints(b.grade) - gradeToPoints(a.grade));

  // All modules sorted by grade point for "Best Grade" calculation
  const sortedModules = [...modules].sort(
    (a, b) => gradeToPoints(b.grade) - gradeToPoints(a.grade),
  );

  // Colors for charts
  const GRADE_COLORS: Record<string, string> = {
    "A+": "#10b981",
    A: "#22c55e",
    "A-": "#84cc16",
    "B+": "#eab308",
    B: "#f59e0b",
    "B-": "#f97316",
    "C+": "#ef4444",
    C: "#dc2626",
    "C-": "#b91c1c",
    "D+": "#991b1b",
    D: "#7f1d1d",
    E: "#450a0a",
  };

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Grade Analytics</h2>

      {/* Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>
              Breakdown of grades across all modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Number of Modules">
                  {gradeDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={GRADE_COLORS[entry.grade] || "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SGPA Progression */}
        <Card>
          <CardHeader>
            <CardTitle>SGPA Progression</CardTitle>
            <CardDescription>
              Academic performance over semesters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sgpaProgressionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 4.0]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sgpa"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="SGPA"
                  dot={{ fill: "#8b5cf6", r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Modules</CardTitle>
          <CardDescription>Modules with A+, A, or A- grades</CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformingModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformingModules.map((module, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-semibold text-sm">{module.moduleCode}</p>
                    <p
                      className="text-xs text-muted-foreground truncate"
                      title={module.moduleName}
                    >
                      {module.moduleName}
                    </p>
                  </div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: GRADE_COLORS[module.grade] }}
                  >
                    {module.grade}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No top performing modules found yet. Keep working hard!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{modules.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {modules.filter((m) => m.grade.startsWith("A")).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Grade Point
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {(
                modules.reduce((sum, m) => sum + gradeToPoints(m.grade), 0) /
                modules.length
              ).toFixed(4)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {sortedModules[0]?.grade || "-"}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Grade Count Details */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Summary</CardTitle>
          <CardDescription>
            Detailed count of each grade obtained
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {gradeDistributionData.map((data) => (
              <div
                key={data.grade}
                className="flex flex-col items-center justify-center p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50"
              >
                <span
                  className="text-2xl font-bold mb-1"
                  style={{ color: GRADE_COLORS[data.grade] || "#6b7280" }}
                >
                  {data.grade}
                </span>
                <span className="text-sm text-muted-foreground">
                  {data.count} {data.count === 1 ? "Module" : "Modules"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
