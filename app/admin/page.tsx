"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  FolderTree,
  Users,
  TrendingUp,
  FileText,
  Plus,
  Award,
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useAdminStats } from "@/hooks/stats.hooks";

const GRADE_COLORS = {
  "A+": "#10b981",
  A: "#34d399",
  "A-": "#6ee7b7",
  "B+": "#3b82f6",
  B: "#60a5fa",
  "B-": "#93c5fd",
  "C+": "#f59e0b",
  C: "#fbbf24",
  "C-": "#fcd34d",
  "D+": "#ef4444",
  D: "#f87171",
  E: "#dc2626",
};

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats();

  // Prepare grade distribution data for pie chart
  const gradeDistributionData = data?.batches.reduce(
    (acc, batch) => {
      Object.entries(batch.gradeDistribution).forEach(([grade, count]) => {
        acc[grade] = (acc[grade] || 0) + count;
      });
      return acc;
    },
    {} as { [grade: string]: number },
  );

  const pieChartData = gradeDistributionData
    ? Object.entries(gradeDistributionData).map(([grade, count]) => ({
        name: grade,
        value: count,
        fill: GRADE_COLORS[grade as keyof typeof GRADE_COLORS] || "#94a3b8",
      }))
    : [];

  // Prepare batch comparison data for bar chart
  const batchChartData =
    data?.batches.map((batch) => ({
      name: batch.name,
      students: batch.studentCount,
      avgCGPA: parseFloat(batch.averageCGPA.toFixed(2)),
      topGPA: parseFloat(batch.topGPA.toFixed(2)),
    })) || [];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive analytics and system management
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/batches">
          <Button
            className="w-full h-auto py-4 flex-col gap-2"
            variant="outline"
          >
            <Plus className="h-5 w-5" />
            <span>Add Batch</span>
          </Button>
        </Link>
        <Link href="/admin/upload">
          <Button
            className="w-full h-auto py-4 flex-col gap-2"
            variant="outline"
          >
            <FileText className="h-5 w-5" />
            <span>Upload PDFs</span>
          </Button>
        </Link>
        <Link href="/admin/batches">
          <Button
            className="w-full h-auto py-4 flex-col gap-2"
            variant="outline"
          >
            <FolderTree className="h-5 w-5" />
            <span>View Structure</span>
          </Button>
        </Link>
        <Link href="/admin/statistics">
          <Button
            className="w-full h-auto py-4 flex-col gap-2"
            variant="outline"
          >
            <TrendingUp className="h-5 w-5" />
            <span>View Statistics</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : data ? (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Batches
                  </CardTitle>
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.overall.totalBatches}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.overall.totalStudents}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average CGPA
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {data.overall.averageCGPA.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total PDFs
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.overall.totalPDFs}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Batch Comparison Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Batch Performance Comparison</CardTitle>
                <CardDescription>
                  Student count and average CGPA by batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    students: {
                      label: "Students",
                      color: "hsl(var(--chart-1))",
                    },
                    avgCGPA: {
                      label: "Avg CGPA",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={batchChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      yAxisId="left"
                      dataKey="students"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="avgCGPA"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Grade Distribution</CardTitle>
                <CardDescription>
                  Distribution of grades across all batches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={Object.fromEntries(
                    Object.keys(GRADE_COLORS).map((grade) => [
                      grade,
                      {
                        label: grade,
                        color: GRADE_COLORS[grade as keyof typeof GRADE_COLORS],
                      },
                    ]),
                  )}
                  className="h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Students Section */}
          {data.topStudentsGlobal && data.topStudentsGlobal.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top Performing Students
                </CardTitle>
                <CardDescription>
                  Highest CGPA across all batches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topStudentsGlobal.slice(0, 10).map((student, index) => (
                    <div
                      key={student.indexNumber}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                                ? "bg-gray-400 text-white"
                                : index === 2
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {student.name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.indexNumber}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {student.cgpa.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
