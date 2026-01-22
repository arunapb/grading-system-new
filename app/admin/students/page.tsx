"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Search,
  Loader2,
  User,
  Award,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { useBatches } from "@/hooks/batch.hooks";
import { useStudents } from "@/hooks/student.hooks";

import { useRouter } from "next/navigation";
import { formatGPA } from "@/lib/gpa-calculator";

export default function StudentsPage() {
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"cgpa" | "name" | "credits">("cgpa");

  // Use hooks
  const { data: batches = [] } = useBatches();

  // Fetch students based on selected batch
  // If "all" is selected, pass undefined to fetch all
  const batchArg = selectedBatch === "all" ? undefined : selectedBatch;
  const { data: students = [], isLoading, refetch } = useStudents(batchArg);

  // Filter and sort
  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.indexNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (student.name &&
            student.name.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "cgpa":
          return b.cgpa - a.cgpa;
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "credits":
          return b.totalCredits - a.totalCredits;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredStudents = filterAndSortStudents();

  const getClassPrediction = (cgpa: number) => {
    if (cgpa >= 3.7) return { class: "First Class", color: "bg-green-600" };
    if (cgpa >= 3.3) return { class: "Second Upper", color: "bg-blue-600" };
    if (cgpa >= 3.0) return { class: "Second Lower", color: "bg-yellow-600" };
    if (cgpa >= 2.0) return { class: "Pass", color: "bg-orange-600" };
    return { class: "Fail", color: "bg-red-600" };
  };

  const stats = {
    total: filteredStudents.length,
    avgCGPA:
      filteredStudents.length > 0
        ? filteredStudents.reduce((sum, s) => sum + s.cgpa, 0) /
          filteredStudents.length
        : 0,
    firstClass: filteredStudents.filter((s) => s.cgpa >= 3.7).length,
    avgCredits:
      filteredStudents.length > 0
        ? filteredStudents.reduce((sum, s) => sum + s.totalCredits, 0) /
          filteredStudents.length
        : 0,
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Student Management
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage student records
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average CGPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatGPA(stats.avgCGPA)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              First Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.firstClass}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0
                ? ((stats.firstClass / stats.total) * 100).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Avg Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgCredits.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">out of 135</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Batch Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.name} value={batch.name}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cgpa">CGPA (High to Low)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="credits">Credits (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Index or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {filteredStudents.length} student(s) found
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students found
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Index Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">CGPA</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Modules</TableHead>
                    <TableHead>Predicted Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const prediction = getClassPrediction(student.cgpa);
                    return (
                      <TableRow
                        key={student.indexNumber}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          router.push(`/admin/students/${student.id}`)
                        }
                      >
                        <TableCell className="font-mono text-sm">
                          {student.indexNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name || (
                            <span className="text-muted-foreground italic">
                              Unknown
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              student.cgpa >= 3.7 ? "default" : "secondary"
                            }
                            className={
                              student.cgpa >= 3.7 ? "bg-green-600" : ""
                            }
                          >
                            {formatGPA(student.cgpa)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {student.totalCredits} / 135
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {student.moduleCount}
                        </TableCell>
                        <TableCell>
                          <Badge className={prediction.color}>
                            {prediction.class}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
