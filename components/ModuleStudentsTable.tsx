"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentGrade {
  id: string;
  grade: string;
  gradePoints: number;
  student: {
    id: string;
    indexNumber: string;
    name: string | null;
  };
}

interface ModuleStudentsTableProps {
  grades: StudentGrade[];
}

type SortField = "indexNumber" | "name" | "grade" | "points";
type SortDirection = "asc" | "desc";

export function ModuleStudentsTable({
  grades: initialGrades,
}: ModuleStudentsTableProps) {
  const [sortField, setSortField] = useState<SortField>("indexNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedGrades = [...initialGrades].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "indexNumber":
        return (
          a.student.indexNumber.localeCompare(b.student.indexNumber) * direction
        );
      case "name":
        return (
          (a.student.name || "").localeCompare(b.student.name || "") * direction
        );
      case "grade":
        // Custom sort for grades? Or alphabetical?
        // Let's use grade points for grade sorting implicitly, or alphabetical if points equal
        if (a.gradePoints !== b.gradePoints) {
          // Sort by points (usually high to low for 'asc' grade? No, A is high points)
          // If user wants Grade ASC (A -> F), points should be DESC
          // Let's just sort by points directly
          return (a.gradePoints - b.gradePoints) * direction;
        }
        return a.grade.localeCompare(b.grade) * direction;
      case "points":
        return (a.gradePoints - b.gradePoints) * direction;
      default:
        return 0;
    }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort("indexNumber")}
              className="hover:bg-transparent px-0 font-semibold"
            >
              Index Number
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort("name")}
              className="hover:bg-transparent px-0 font-semibold"
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort("grade")}
              className="hover:bg-transparent px-0 font-semibold"
            >
              Grade
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>Grade Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedGrades.map((grade) => (
          <TableRow key={grade.id}>
            <TableCell className="font-mono">
              {grade.student.indexNumber}
            </TableCell>
            <TableCell>{grade.student.name || "—"}</TableCell>
            <TableCell>
              <Badge
                variant={grade.grade === "PENDING" ? "secondary" : "default"}
                className={
                  grade.grade === "PENDING"
                    ? "bg-amber-100 text-amber-800"
                    : grade.grade.startsWith("A")
                      ? "bg-green-100 text-green-800"
                      : grade.grade.startsWith("B")
                        ? "bg-blue-100 text-blue-800"
                        : grade.grade === "P"
                          ? "bg-green-100 text-green-800"
                          : ["N", "W"].includes(grade.grade)
                            ? "bg-slate-100 text-slate-800"
                            : ""
                }
              >
                {grade.grade}
              </Badge>
            </TableCell>
            <TableCell>
              {grade.grade === "PENDING" ? "—" : grade.gradePoints.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
