"use client";

import { useAdminStudent } from "@/hooks/student.hooks";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Loader2,
  ArrowLeft,
  User,
  GraduationCap,
  Mail,
  Calendar,
  BookOpen,
  Award,
} from "lucide-react";

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: student, isLoading, error } = useAdminStudent(id);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-red-600">
            Error loading student
          </h1>
        </div>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "Student not found"}
        </p>
      </div>
    );
  }

  const getClassPrediction = (cgpa: number) => {
    if (cgpa >= 3.7) return { class: "First Class", color: "bg-green-600" };
    if (cgpa >= 3.3) return { class: "Second Upper", color: "bg-blue-600" };
    if (cgpa >= 3.0) return { class: "Second Lower", color: "bg-yellow-600" };
    if (cgpa >= 2.0) return { class: "Pass", color: "bg-orange-600" };
    return { class: "Fail", color: "bg-red-600" };
  };

  const prediction = getClassPrediction(student.cgpa);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="font-mono">{student.indexNumber}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Student Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Full Name</p>
                <p className="text-sm text-muted-foreground">{student.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Degree Program</p>
                <p className="text-sm text-muted-foreground">
                  {student.degree}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Batch</p>
                <p className="text-sm text-muted-foreground">{student.batch}</p>
              </div>
            </div>

            {student.email && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {student.email}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current CGPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                {student.cgpa.toFixed(4)}
                <Badge className={prediction.color}>{prediction.class}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{student.totalCredits}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed Credits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Semesters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {student.semesters.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Found</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Academic History */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Academic History
        </h2>

        {student.semesters.map((semester: any) => (
          <Card key={semester.id}>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{semester.name}</CardTitle>
                  <CardDescription>
                    GPA:{" "}
                    <span className="font-semibold text-foreground">
                      {semester.gpa.toFixed(2)}
                    </span>{" "}
                    • Credits: {semester.semTotalCredits}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module Code</TableHead>
                    <TableHead>Module Name</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semester.modules.map((module: any) => (
                    <TableRow key={module.code}>
                      <TableCell className="font-mono text-sm font-medium">
                        {module.code}
                      </TableCell>
                      <TableCell>{module.name}</TableCell>
                      <TableCell className="text-right">
                        {module.credits}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            ["A+", "A", "A-"].includes(module.grade)
                              ? "default"
                              : ["B+", "B", "B-"].includes(module.grade)
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {module.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {module.points.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
