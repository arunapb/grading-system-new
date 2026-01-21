"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  TrendingUp,
  FileText,
  Loader2,
} from "lucide-react";
import { BatchStatsCard } from "@/components/admin/BatchStatsCard";
import { TopStudentsTable } from "@/components/admin/TopStudentsTable";
import { GradeDistributionChart } from "@/components/admin/GradeDistributionChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminStats } from "@/hooks/stats.hooks";

export default function StatisticsPage() {
  const { data, isLoading } = useAdminStats();
  const [selectedBatch, setSelectedBatch] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-8 text-muted-foreground">
          Failed to load statistics
        </div>
      </div>
    );
  }

  const selectedBatchData =
    selectedBatch === "all"
      ? null
      : data.batches.find((b) => b.name === selectedBatch);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Statistics Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of student performance and system metrics
        </p>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <span className="text-3xl font-bold">
                {data.overall.totalBatches}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-3xl font-bold">
                {data.overall.totalStudents}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average CGPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-3xl font-bold">
                {data.overall.averageCGPA.toFixed(4)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total PDFs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <span className="text-3xl font-bold">
                {data.overall.totalPDFs}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Selector */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Batch</CardTitle>
            <CardDescription>
              View detailed statistics for a specific batch or all batches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {data.batches.map((batch) => (
                  <SelectItem key={batch.name} value={batch.name}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Batch Overview or Selected Batch Details */}
      {selectedBatch === "all" ? (
        <>
          {/* All Batches Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">All Batches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.batches.map((batch) => (
                <BatchStatsCard
                  key={batch.name}
                  name={batch.name}
                  studentCount={batch.studentCount}
                  averageCGPA={batch.averageCGPA}
                  topGPA={batch.topGPA}
                  degrees={batch.degrees}
                  onClick={() => setSelectedBatch(batch.name)}
                />
              ))}
            </div>
          </div>

          {/* Top Students Global */}
          <Card>
            <CardHeader>
              <CardTitle>Top Students (Global)</CardTitle>
              <CardDescription>
                Top 10 students across all batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopStudentsTable students={data.topStudentsGlobal} />
            </CardContent>
          </Card>
        </>
      ) : selectedBatchData ? (
        <>
          {/* Selected Batch Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Students for Batch */}
            <Card>
              <CardHeader>
                <CardTitle>Top Students - {selectedBatchData.name}</CardTitle>
                <CardDescription>Top 3 students in this batch</CardDescription>
              </CardHeader>
              <CardContent>
                <TopStudentsTable students={selectedBatchData.topStudents} />
              </CardContent>
            </Card>

            {/* Batch Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Batch Summary</CardTitle>
                <CardDescription>
                  Key metrics for {selectedBatchData.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Students</span>
                  <span className="font-semibold text-lg">
                    {selectedBatchData.studentCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average CGPA</span>
                  <span className="font-semibold text-lg">
                    {selectedBatchData.averageCGPA.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Top CGPA</span>
                  <span className="font-semibold text-lg text-green-600">
                    {selectedBatchData.topGPA.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Degrees</span>
                  <span className="font-semibold text-lg">
                    {selectedBatchData.degrees}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <GradeDistributionChart
            distribution={selectedBatchData.gradeDistribution}
            title={`Grade Distribution - ${selectedBatchData.name}`}
            description={`Distribution of grades across all modules in ${selectedBatchData.name}`}
          />
        </>
      ) : null}
    </div>
  );
}
