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
import { ChevronDown, ChevronUp, BookOpen, Award } from "lucide-react";
import { getGPAColor } from "@/lib/gpa-calculator";
import type { ModuleGrade } from "@/lib/gpa-calculator";

interface SemesterData {
  year: string;
  semester: string;
  sgpa: number;
  credits: number;
  modules: ModuleGrade[];
}

interface SemesterCardProps {
  semester: SemesterData;
}

export function SemesterCard({ semester }: SemesterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getGradeBadgeVariant = (grade: string) => {
    if (grade.startsWith("A")) return "success";
    if (grade.startsWith("B")) return "default";
    if (grade.startsWith("C")) return "secondary";
    return "destructive";
  };

  return (
    <Card className="border shadow-sm">
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
                {semester.sgpa.toFixed(4)}
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
