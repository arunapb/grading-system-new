"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award } from "lucide-react";
import { formatGPA } from "@/lib/gpa-calculator";

interface BatchStatsCardProps {
  name: string;
  studentCount: number;
  averageCGPA: number;
  topGPA: number;
  degrees: number;
  onClick?: () => void;
}

export function BatchStatsCard({
  name,
  studentCount,
  averageCGPA,
  topGPA,
  degrees,
  onClick,
}: BatchStatsCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{degrees} degrees</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Students:</span>
          <span className="font-semibold">{studentCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Avg CGPA:</span>
          <span className="font-semibold">{formatGPA(averageCGPA)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Top CGPA:</span>
          <span className="font-semibold text-green-600">
            {formatGPA(topGPA)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
