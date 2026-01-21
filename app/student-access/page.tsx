"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Clock, AlertTriangle } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { GradeAnalytics } from "@/components/GradeAnalytics";
import { SemesterCard } from "@/components/SemesterCard";
import { type ModuleGrade, gradeToPoints } from "@/lib/gpa-calculator";

interface StudentData {
  indexNumber: string;
  name: string | null;
  photoUrl: string | null;
  batch: string;
  degree: string;
  rank: number;
  cgpa: number;
  totalCredits: number;
  semesters: Array<{
    year: string;
    semester: string;
    sgpa: number;
    credits: number;
    modules: ModuleGrade[];
  }>;
  modules: ModuleGrade[];
}

function StudentAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");

  const [code, setCode] = useState(codeFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const handleSubmit = useCallback(async (submittedCode: string) => {
    if (!submittedCode.trim()) {
      setError("Please enter an invitation code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: submittedCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid invitation code");
        setStudent(null);
        return;
      }

      setStudent(data.student);
      setRemainingTime(data.remainingTime);
      const expiresAtDate = new Date(data.expiresAt);
      setExpiresAt(expiresAtDate);

      // Save session to storage
      sessionStorage.setItem(
        "student_session",
        JSON.stringify({
          student: data.student,
          expiresAt: data.expiresAt,
          remainingTime: data.remainingTime,
        }),
      );
    } catch (err) {
      console.error("Error validating code:", err);
      setError("Failed to validate invitation code");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session storage or auto-submit from URL
  useEffect(() => {
    // 1. Try session storage first
    const savedSession = sessionStorage.getItem("student_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const expiresAt = new Date(session.expiresAt);
        if (new Date() < expiresAt) {
          setStudent(session.student);
          setExpiresAt(expiresAt);
          // Calculate remaining time based on current time
          const now = new Date();
          setRemainingTime(
            Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
          );
          return;
        } else {
          sessionStorage.removeItem("student_session");
        }
      } catch (e) {
        sessionStorage.removeItem("student_session");
      }
    }

    // 2. If no valid session, check URL
    if (codeFromUrl && !student) {
      setCode(codeFromUrl);
      handleSubmit(codeFromUrl);
    }
  }, [codeFromUrl, handleSubmit]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || !student) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.floor(
        (expiresAt.getTime() - now.getTime()) / 1000,
      );

      if (remaining <= 0) {
        setStudent(null);
        setError(
          "Your session has expired. Please request a new invitation link.",
        );
        setRemainingTime(null);
        sessionStorage.removeItem("student_session");
        clearInterval(interval);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, student]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Calculate total points for header
  const totalPoints =
    student?.modules.reduce((acc, module) => {
      const points = gradeToPoints(module.grade);
      return acc + points * module.credits;
    }, 0) || 0;

  // If student data is loaded, show the profile
  if (student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Timer Banner */}
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 z-50">
          <Clock className="h-4 w-4" />
          <span className="font-medium">
            Session expires in:{" "}
            {remainingTime !== null ? formatTime(remainingTime) : "..."}
          </span>
        </div>

        <div className="container mx-auto px-4 py-8 pt-16">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Student Portal
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here is your academic performance overview.
            </p>
          </div>

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
        </div>
      </div>
    );
  }

  // Show code entry form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Student Access</CardTitle>
          <CardDescription>
            Enter your invitation code to view your grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(code);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="code">Invitation Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="e.g., ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "View My Grades"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StudentAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <StudentAccessContent />
    </Suspense>
  );
}
