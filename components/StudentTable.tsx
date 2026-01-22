"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Eye, Download, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getGPAColor, getGPALabel, formatGPA } from "@/lib/gpa-calculator";
import { StudentAvatar } from "@/components/StudentAvatar";
import { useStudents } from "@/hooks/student.hooks";

interface StudentSummary {
  indexNumber: string;
  name: string | null;
  photoUrl: string | null;
  cgpa: number;
  totalCredits: number;
  moduleCount: number;
}

interface StudentTableProps {
  batch?: string;
  degree?: string;
}

type SortField = "indexNumber" | "cgpa" | "moduleCount";
type SortOrder = "asc" | "desc";

export function StudentTable({ batch, degree }: StudentTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sortField, setSortField] = useState<SortField>("cgpa");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students, isLoading, error } = useStudents(batch, degree);

  // Calculate ranks based on CGPA (highest CGPA = rank 1)
  // Students with same CGPA get the same rank
  const studentsWithRank = useMemo(() => {
    if (!students) return [];
    const sorted = [...students].sort((a, b) => b.cgpa - a.cgpa);
    let currentRank = 1;
    return sorted.map((student, index) => {
      // If not the first student and CGPA is different from previous, update rank
      if (index > 0 && student.cgpa !== sorted[index - 1].cgpa) {
        currentRank = index + 1;
      }
      return {
        ...student,
        rank: currentRank,
      };
    });
  }, [students]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = studentsWithRank.filter(
      (student) =>
        student.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.name &&
          student.name.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [studentsWithRank, sortField, sortOrder, searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "cgpa" ? "desc" : "asc");
    }
  };

  const handleViewStudent = (indexNumber: string) => {
    router.push(`${pathname}/${indexNumber}`);
  };

  const handleDownloadPDF = async (indexNumber: string) => {
    try {
      // Fetch full student details
      const response = await fetch(`/api/students/${indexNumber}`);
      const data = await response.json();

      if (data.success && data.student) {
        // Dynamically import the PDF generator to avoid SSR issues
        const { generateStudentPDF } = await import("@/lib/pdf-generator");
        generateStudentPDF(data.student);
      } else {
        alert("Failed to fetch student details");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  const getGPABadgeVariant = (cgpa: number) => {
    if (cgpa >= 3.7) return "success";
    if (cgpa >= 3.0) return "default";
    if (cgpa >= 2.0) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Failed to load students
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by index number or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedStudents.length} of {students?.length || 0}{" "}
          students
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("indexNumber")}
                  className="h-8 -ml-3"
                >
                  Student
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("cgpa")}
                  className="h-8 -ml-3"
                >
                  CGPA
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("moduleCount")}
                  className="h-8 -ml-3"
                >
                  Modules
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Total Credits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedStudents.map((student) => (
                <TableRow
                  key={student.indexNumber}
                  className="hover:bg-accent cursor-pointer"
                >
                  <TableCell>
                    <StudentAvatar
                      name={student.name}
                      photoUrl={student.photoUrl}
                      indexNumber={student.indexNumber}
                      size="md"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {student.rank === 1 && "🥇"}
                        {student.rank === 2 && "🥈"}
                        {student.rank === 3 && "🥉"}
                      </span>
                      <span className="font-semibold">{student.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {student.name && student.name !== "Top Links" ? (
                        <>
                          <div className="font-semibold">{student.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {student.indexNumber}
                          </div>
                        </>
                      ) : (
                        <div className="font-medium font-mono">
                          {student.indexNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-lg font-bold ${getGPAColor(student.cgpa)}`}
                    >
                      {formatGPA(student.cgpa)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getGPABadgeVariant(student.cgpa)}>
                      {getGPALabel(student.cgpa)}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.moduleCount}</TableCell>
                  <TableCell>{student.totalCredits}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleViewStudent(student.indexNumber)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDownloadPDF(student.indexNumber)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
