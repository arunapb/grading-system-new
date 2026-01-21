"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GraduationCap, Plus, Trash2, Edit } from "lucide-react";
import { useStudentsWithCGPA } from "@/hooks/student.hooks";
import { usePublicBatches } from "@/hooks/batch.hooks";
import { useDegrees } from "@/hooks/degree.hooks";

const VALID_GRADES = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "E",
  "F",
  "I",
  "W",
  "X",
];

interface Module {
  id: string;
  code: string;
  name: string;
}

export default function ManualGradesPage() {
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [grade, setGrade] = useState("");

  // Fetch batches, degrees, and students
  const { data: batches = [] } = usePublicBatches();
  const { data: degrees = [] } = useDegrees(selectedBatch);
  const { data: students = [] } = useStudentsWithCGPA(
    selectedBatch,
    selectedDegree,
  );

  // Fetch modules for selected degree
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ["modules", selectedBatch, selectedDegree],
    queryFn: async () => {
      if (!selectedBatch || !selectedDegree) return [];
      const res = await fetch(
        `/api/modules?batch=${encodeURIComponent(selectedBatch)}&degree=${encodeURIComponent(selectedDegree)}`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.modules || [];
    },
    enabled: !!selectedBatch && !!selectedDegree,
  });

  // Fetch grades for selected student
  const { data: studentGrades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ["student-grades", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const res = await fetch(`/api/admin/grades?studentId=${selectedStudent}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedStudent,
  });

  // Add/update grade mutation
  const gradeMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      moduleId: string;
      grade: string;
    }) => {
      const res = await fetch("/api/admin/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add grade");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-grades", selectedStudent],
      });
      setSelectedModule("");
      setGrade("");
      toast.success("Grade saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete grade mutation
  const deleteMutation = useMutation({
    mutationFn: async (gradeId: string) => {
      const res = await fetch(`/api/admin/grades?id=${gradeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete grade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-grades", selectedStudent],
      });
      toast.success("Grade deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedModule || !grade) {
      toast.error("Please fill in all fields");
      return;
    }
    gradeMutation.mutate({
      studentId: selectedStudent,
      moduleId: selectedModule,
      grade: grade,
    });
  };

  const selectedStudentData = students.find(
    (s: any) => s.id === selectedStudent,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          Manual Grade Entry
        </h1>
        <p className="text-muted-foreground">
          Add or edit student grades manually
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Grade Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add/Update Grade
            </CardTitle>
            <CardDescription>
              Select a student and module, then enter the grade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Select
                    value={selectedBatch}
                    onValueChange={(v) => {
                      setSelectedBatch(v);
                      setSelectedDegree("");
                      setSelectedStudent("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b: any) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Select
                    value={selectedDegree}
                    onValueChange={(v) => {
                      setSelectedDegree(v);
                      setSelectedStudent("");
                    }}
                    disabled={!selectedBatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((d: any) => (
                        <SelectItem key={d.name} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  disabled={!selectedDegree}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.indexNumber} - {s.name || "No name"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                    disabled={!selectedStudent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.code} - {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select
                    value={grade}
                    onValueChange={setGrade}
                    disabled={!selectedModule}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  gradeMutation.isPending ||
                  !selectedStudent ||
                  !selectedModule ||
                  !grade
                }
              >
                {gradeMutation.isPending ? "Saving..." : "Save Grade"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Student Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Student Grades
            </CardTitle>
            <CardDescription>
              {selectedStudentData
                ? `Grades for ${selectedStudentData.indexNumber}`
                : "Select a student to view grades"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a student to view and manage their grades
              </div>
            ) : gradesLoading ? (
              <div className="text-center py-8">Loading grades...</div>
            ) : studentGrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No grades found for this student
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentGrades.map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{g.module?.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {g.module?.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{g.grade}</Badge>
                      </TableCell>
                      <TableCell>{g.gradePoints?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(g.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
