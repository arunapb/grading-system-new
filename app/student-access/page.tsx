"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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

  // Edit State
  const [editingModule, setEditingModule] = useState<ModuleGrade | null>(null);
  const [newGrade, setNewGrade] = useState<string>("");
  const [updating, setUpdating] = useState(false);

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

      console.log("Received student data:", data.student);
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

  const handleEdit = (module: ModuleGrade) => {
    console.log("Editing module:", module);
    setEditingModule(module);
    setNewGrade(module.grade); // Default to current
  };

  const submitGradeUpdate = async () => {
    if (!editingModule || !newGrade) return;

    setUpdating(true);
    try {
      // Use current code state or session code
      const currentCode = code || codeFromUrl;

      const payload = {
        code: currentCode, // Authenticate with the session code
        moduleId: editingModule.id, // Ensure this is the correct ID from the ModuleGrade object
        grade: newGrade,
      };
      console.log("Submitting payload:", payload);

      const response = await fetch("/api/student-access/update-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Grade updated successfully");
        // Update local state temporarily
        setStudent((prev) => {
          if (!prev) return null;
          // Update the specific module in the flat list
          const updatedModules = prev.modules.map((m) =>
            m.id === editingModule.id
              ? {
                  ...m,
                  grade: newGrade,
                  gradePoints: gradeToPoints(newGrade),
                }
              : m,
          );

          // We should ideally recalculate GPA/Semesters here, but re-fetching is safer and easier
          // given the complexity of grouping logic on frontend vs backend.
          return prev;
        });

        // Trigger a re-fetch of student data to ensure all GPAs and structures are perfectly recalculated
        // We can reuse handleSubmit with the known code
        if (currentCode) {
          handleSubmit(currentCode);
        }

        setEditingModule(null);
      } else {
        toast.error(data.error || "Failed to update grade");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update grade");
    } finally {
      setUpdating(false);
    }
  };

  // Check session storage or auto-submit from URL
  useEffect(() => {
    // If student is already loaded, we don't need to check session or URL
    if (student) return;

    // 1. Try session storage first
    const savedSession = sessionStorage.getItem("student_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const expiresAt = new Date(session.expiresAt);
        if (new Date() < expiresAt) {
          setStudent(session.student);
          setExpiresAt(expiresAt);

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
    if (codeFromUrl) {
      setCode(codeFromUrl);
      handleSubmit(codeFromUrl);
    }
    // We only want this to run on mount or when codeFromUrl changes.
    // We strictly depend on `codeFromUrl` and `handleSubmit`.
    // We include `student` in the dependency array to satisfy linter, but we exit early if `student` exists.
    // However, if `setStudent` causes a re-render, `student` becomes TRUTHY, so we hit the `if (student) return;`
    // and STOP the loop.
  }, [codeFromUrl, handleSubmit, student]);

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
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1.5 sm:py-2 px-2 sm:px-4 flex flex-wrap items-center justify-center gap-1 sm:gap-2 z-50 text-xs sm:text-base text-center">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
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
                cgpa={student.cgpa}
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
                <SemesterCard
                  key={idx}
                  semester={semester}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingModule}
          onOpenChange={(open) => !open && setEditingModule(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Grade</DialogTitle>
              <DialogDescription>
                Update your grade for {editingModule?.moduleCode} -{" "}
                {editingModule?.moduleName}. Only passing grades (C- and above)
                are permanent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Grade</Label>
                <Select value={newGrade} onValueChange={setNewGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
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
                    ].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingModule(null)}>
                Cancel
              </Button>
              <Button onClick={submitGradeUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Grade"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
