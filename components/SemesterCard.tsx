"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { ChevronDown, ChevronUp, BookOpen, Award, Pencil } from "lucide-react";
import {
  getGradeBadgeVariant,
  getGPAColor,
  formatGPA,
} from "@/lib/gpa-calculator";
import type { ModuleGrade } from "@/lib/gpa-calculator";

export interface SemesterData {
  year: string;
  semester: string;
  sgpa: number;
  credits: number;
  modules: ModuleGrade[];
}

interface SemesterCardProps {
  semester: SemesterData;
  onEdit?: (module: ModuleGrade) => void;
}

export function SemesterCard({ semester, onEdit }: SemesterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ... existing helper

  const isEditable = (grade: string) => {
    // Logic: PENDING or < C (C- is 1.7, C is 2.0)
    // Including C- as it is technically less than C "2.0".
    return ["PENDING", "D", "I", "F", "C-", "N", "W"].includes(
      grade.toUpperCase(),
    );
  };

  return (
    <Card className="border shadow-sm">
      {/* ... Header ... */}
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {semester.year} - Semester {semester.semester}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {semester.modules.length} modules
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  {semester.credits} credits
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                SGPA
              </p>
              <p
                className={`text-2xl font-semibold tabular-nums ${getGPAColor(semester.sgpa)}`}
              >
                {formatGPA(semester.sgpa)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold whitespace-nowrap">
                      Code
                    </TableHead>
                    <TableHead className="font-semibold min-w-[200px]">
                      Module Name
                    </TableHead>
                    <TableHead className="font-semibold">Grade</TableHead>
                    <TableHead className="font-semibold text-right">
                      Credits
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Points
                    </TableHead>
                    {onEdit && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semester.modules.map((module, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium text-sm whitespace-nowrap">
                        {module.moduleCode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {module.moduleName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getGradeBadgeVariant(module.grade)}
                          className="font-medium"
                        >
                          {module.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {module.credits}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold tabular-nums ${getGPAColor(module.gradePoints)}`}
                        >
                          {module.gradePoints.toFixed(1)}
                        </span>
                      </TableCell>
                      {onEdit && (
                        <TableCell>
                          {isEditable(module.grade) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => onEdit(module)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
