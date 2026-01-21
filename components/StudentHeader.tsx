"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getGPAColor,
  getGPALabel,
  getPredictedClass,
} from "@/lib/gpa-calculator";
import {
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { StudentAvatar } from "@/components/StudentAvatar";

interface StudentHeaderProps {
  indexNumber: string;
  rank: number;
  name?: string | null;
  photoUrl?: string | null;
  cgpa: number;
  totalCredits: number;
  moduleCount: number;
  totalPoints: number;
}

export function StudentHeader({
  indexNumber,
  rank,
  name,
  photoUrl,
  cgpa,
  totalCredits,
  moduleCount,
  totalPoints,
}: StudentHeaderProps) {
  const getGPABadgeVariant = (cgpa: number) => {
    if (cgpa >= 3.7) return "success";
    if (cgpa >= 3.0) return "default";
    if (cgpa >= 2.0) return "secondary";
    return "destructive";
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <StudentAvatar
            name={name}
            photoUrl={photoUrl}
            indexNumber={indexNumber}
            size="lg"
          />
          <div className="flex-1 space-y-3 w-full">
            <div>
              {name && name !== "Top Links" ? (
                <>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {name}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    {indexNumber}
                  </p>
                </>
              ) : (
                <h2 className="text-2xl font-semibold font-mono text-foreground">
                  {indexNumber}
                </h2>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Badge variant={getGPABadgeVariant(cgpa)} className="font-medium">
                {getGPALabel(cgpa)}
              </Badge>
              <Badge variant="outline" className="font-medium">
                {getPredictedClass(cgpa)}
              </Badge>
            </div>
          </div>
          <div className="text-center sm:text-right w-full sm:w-auto mt-4 sm:mt-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Cumulative GPA
            </p>
            <p
              className={`text-4xl font-bold tabular-nums ${getGPAColor(cgpa)}`}
            >
              {cgpa.toFixed(4)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Rank
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-center sm:text-left">
              {rank}
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Modules
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-center sm:text-left">
              {moduleCount}
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Credits
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-center sm:text-left">
              {totalCredits}
              <span className="text-sm text-muted-foreground font-normal ml-1">
                / 135
              </span>
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Points
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-center sm:text-left">
              {totalPoints.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
