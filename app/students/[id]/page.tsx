"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StudentHeader } from "@/components/StudentHeader";
import { SemesterCard } from "@/components/SemesterCard";
import { GradeAnalytics } from "@/components/GradeAnalytics";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Download } from "lucide-react";
import { type ModuleGrade, gradeToPoints } from "@/lib/gpa-calculator";
import { useStudent } from "@/hooks/student.hooks";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // Use Custom Hook
  const { data: student, isLoading, error } = useStudent(id);

  const handleDownloadPDF = async () => {
    if (!student) return;

    try {
      // Dynamically import the PDF generator to avoid SSR issues
      const { generateStudentPDF } = await import("@/lib/pdf-generator");
      generateStudentPDF(student);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  // Calculate total points
  const totalPoints =
    student?.modules.reduce((acc: number, module: ModuleGrade) => {
      const points = gradeToPoints(module.grade);
      return acc + points * module.credits;
    }, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">
            Loading student details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium mb-4">
            {error instanceof Error ? error.message : "Student not found"}
          </p>
          <Button onClick={() => router.push("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button and Download */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/students">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Button>
          </Link>
          <Button onClick={handleDownloadPDF} variant="default">
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Student Profile
          </h1>
          <p className="text-muted-foreground">
            Academic performance and module details
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Student Header */}
        <div className="mb-8">
          <StudentHeader
            indexNumber={student.indexNumber}
            rank={student.rank}
            name={student.name}
            photoUrl={student.photoUrl}
            cgpa={student.cgpa}
            totalCredits={student.totalCredits}
            moduleCount={student.modules.length}
            totalPoints={totalPoints}
          />
        </div>

        {/* Grade Analytics */}
        {student.modules.length > 0 && (
          <div className="mb-8">
            <GradeAnalytics
              modules={student.modules}
              semesters={student.semesters}
            />
          </div>
        )}

        {/* Semester Cards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            Academic Performance by Semester
          </h2>
          <div className="grid gap-4">
            {student.semesters.map((semester, idx) => (
              <SemesterCard key={idx} semester={semester} />
            ))}
          </div>
        </div>

        {student.semesters.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No semester data available for this student.
          </div>
        )}
      </div>
    </div>
  );
}
