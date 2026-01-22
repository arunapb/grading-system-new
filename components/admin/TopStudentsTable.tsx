"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { formatGPA } from "@/lib/gpa-calculator";

interface TopStudent {
  indexNumber: string;
  name: string | null;
  cgpa: number;
  totalCredits?: number;
  moduleCount?: number;
}

interface TopStudentsTableProps {
  students: TopStudent[];
  showBatch?: boolean;
}

export function TopStudentsTable({
  students,
  showBatch = false,
}: TopStudentsTableProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No student data available
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Index Number</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">CGPA</TableHead>
            {students[0]?.totalCredits !== undefined && (
              <TableHead className="text-right">Credits</TableHead>
            )}
            {students[0]?.moduleCount !== undefined && (
              <TableHead className="text-right">Modules</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => (
            <TableRow key={student.indexNumber}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  )}
                  {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                  {index === 2 && (
                    <Trophy className="h-4 w-4 text-orange-600" />
                  )}
                  <span className="font-medium">{index + 1}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {student.indexNumber}
              </TableCell>
              <TableCell className="font-medium">
                {student.name || (
                  <span className="text-muted-foreground italic">Unknown</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={student.cgpa >= 3.7 ? "default" : "secondary"}
                  className={student.cgpa >= 3.7 ? "bg-green-600" : ""}
                >
                  {formatGPA(student.cgpa)}
                </Badge>
              </TableCell>
              {student.totalCredits !== undefined && (
                <TableCell className="text-right text-sm text-muted-foreground">
                  {student.totalCredits}
                </TableCell>
              )}
              {student.moduleCount !== undefined && (
                <TableCell className="text-right text-sm text-muted-foreground">
                  {student.moduleCount}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
