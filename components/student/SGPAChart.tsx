"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGPA } from "@/lib/gpa-calculator";

interface SemesterData {
  year: string;
  semester: string;
  sgpa: number;
  credits: number;
}

interface SGPAChartProps {
  semesters: SemesterData[];
  cgpa: number;
}

export function SGPAChart({ semesters, cgpa }: SGPAChartProps) {
  // Format data for chart
  const data = semesters.map((sem) => {
    // Extract numbers from "Year 1" and "Semester 1"
    const y = sem.year.match(/\d+/)?.[0] || "?";
    const s = sem.semester.match(/\d+/)?.[0] || "?";
    return {
      name: `Y${y}S${s}`,
      fullLabel: `${sem.year} - ${sem.semester}`,
      sgpa: sem.sgpa,
    };
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Academic Performance Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 4]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border text-popover-foreground p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-semibold mb-1">
                          {payload[0].payload.fullLabel}
                        </p>
                        <p className="text-primary font-bold">
                          SGPA: {formatGPA(Number(payload[0].value))}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={cgpa}
                label={{
                  value: `CGPA: ${formatGPA(cgpa)}`,
                  position: "right",
                  fill: "#8884d8",
                  fontSize: 12,
                }}
                stroke="#8884d8"
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="sgpa"
                stroke="#2563eb"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
