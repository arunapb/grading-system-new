"use client";

import { useState, useEffect, useCallback } from "react";
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
import { StudentAvatar } from "@/components/StudentAvatar";
import { SGPAChart } from "@/components/student/SGPAChart";

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
    modules: Array<{
      moduleCode: string;
      moduleName: string;
      grade: string;
      credits: number;
      gradePoints: number;
    }>;
  }>;
}

import { Suspense } from "react";

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
      handleSubmit(codeFromUrl);
    }
  }, [codeFromUrl, handleSubmit]); // Removed 'student' dependency to avoid re-runs when student is set

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

  // If student data is loaded, show the profile
  if (student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 p-4">
        {/* Timer Banner */}
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 z-50">
          <Clock className="h-4 w-4" />
          <span className="font-medium">
            Session expires in:{" "}
            {remainingTime !== null ? formatTime(remainingTime) : "..."}
          </span>
        </div>

        <div className="pt-12 max-w-4xl mx-auto">
          {/* Student Header */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <StudentAvatar
                  name={student.name}
                  photoUrl={student.photoUrl}
                  indexNumber={student.indexNumber}
                  size="2xl"
                />
              </div>
              <CardTitle className="text-2xl">
                {student.name || student.indexNumber}
              </CardTitle>
              <CardDescription>
                {student.indexNumber} • {student.batch} • {student.degree}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {student.cgpa.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">CGPA</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    #{student.rank}
                  </div>
                  <div className="text-sm text-muted-foreground">Rank</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {student.totalCredits}
                  </div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Chart */}
          <SGPAChart semesters={student.semesters} cgpa={student.cgpa} />

          {/* Semesters */}
          {student.semesters.map((semester, idx) => (
            <Card key={idx} className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>
                    {semester.year} - {semester.semester}
                  </span>
                  <span className="text-primary">
                    SGPA: {semester.sgpa.toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Code</th>
                        <th className="text-left py-2">Module</th>
                        <th className="text-center py-2">Credits</th>
                        <th className="text-center py-2">Grade</th>
                        <th className="text-center py-2">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semester.modules.map((module, midx) => (
                        <tr key={midx} className="border-b last:border-0">
                          <td className="py-2 font-mono">
                            {module.moduleCode}
                          </td>
                          <td className="py-2">{module.moduleName}</td>
                          <td className="py-2 text-center">{module.credits}</td>
                          <td className="py-2 text-center font-bold">
                            {module.grade}
                          </td>
                          <td className="py-2 text-center">
                            {module.gradePoints.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
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
