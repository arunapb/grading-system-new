"use client";

import { useParams } from "next/navigation";
import { StudentTable } from "@/components/StudentTable";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Users, TrendingUp, Award, BookOpen, Layers } from "lucide-react";
import { useStudents } from "@/hooks/student.hooks";
import { formatGPA } from "@/lib/gpa-calculator";

export default function StudentsPage() {
  const params = useParams();
  const batch = decodeURIComponent(params.batch as string);
  const degree = decodeURIComponent(params.degree as string);

  const { data: students, isLoading, error } = useStudents(batch, degree);

  const batchNumber = batch.replace(/\D/g, "");

  const avgCGPA =
    students && students.length > 0
      ? students.reduce((sum, s) => sum + s.cgpa, 0) / students.length
      : 0;

  const totalCredits =
    students && students.length > 0
      ? Math.max(...students.map((s) => s.totalCredits))
      : 0;

  const totalModules =
    students && students.length > 0
      ? Math.max(...students.map((s) => s.moduleCount || 0))
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: `Batch ${batchNumber}`, href: `/${batch}` },
            { label: degree },
            { label: "Students" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Students</h1>
                <p className="text-muted-foreground mt-1">
                  Batch {batchNumber} • {degree} • View academic performance
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Statistics Cards */}
        {!isLoading && !error && students && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                <div className="text-3xl font-bold">{students.length}</div>
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
                  {formatGPA(avgCGPA)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top CGPA
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {students.length > 0 ? formatGPA(students[0].cgpa) : "-"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total GPA Credits
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {totalCredits} / 135
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Modules
                  </CardTitle>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {totalModules}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              Browse all students, view their CGPA, and access detailed academic
              records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-muted-foreground">
                  Loading students...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive font-medium">
                  Error: Failed to fetch students
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <StudentTable batch={batch} degree={degree} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
