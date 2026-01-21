"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useBatches } from "@/hooks/batch.hooks";
import { useStructure } from "@/hooks/structure.hooks";

interface HierarchicalSelectorProps {
  onSelectionChange: (selection: {
    batch: string;
    degree: string;
    year: string;
    semester: string;
    semesterId?: string;
  }) => void;
}

export function HierarchicalSelector({
  onSelectionChange,
}: HierarchicalSelectorProps) {
  const { data: batches = [] } = useBatches();
  const [selectedBatch, setSelectedBatch] = useState("");

  // Only fetch structure if a batch is selected
  const { data: structure, isLoading: isStructureLoading } = useStructure(
    selectedBatch || null,
  );

  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  // Reset downstream selections when batch changes
  useEffect(() => {
    setSelectedDegree("");
    setSelectedYear("");
    setSelectedSemester("");
  }, [selectedBatch]);

  // Reset downstream selections when degree changes
  useEffect(() => {
    setSelectedYear("");
    setSelectedSemester("");
  }, [selectedDegree]);

  useEffect(() => {
    setSelectedSemester("");
  }, [selectedYear]);

  // Notify parent of selection changes
  useEffect(() => {
    if (selectedBatch && selectedDegree && selectedYear && selectedSemester) {
      // Find the semester ID
      const degreeObj = structure?.degrees.find(
        (d) => d.name === selectedDegree,
      );
      const yearObj = degreeObj?.years.find((y) => y.name === selectedYear);
      const semesterObj = yearObj?.semesters.find(
        (s) => s.name === selectedSemester,
      );

      onSelectionChange({
        batch: selectedBatch,
        degree: selectedDegree,
        year: selectedYear,
        semester: selectedSemester,
        semesterId: semesterObj?.id,
      });
    }
  }, [
    selectedBatch,
    selectedDegree,
    selectedYear,
    selectedSemester,
    onSelectionChange,
  ]);

  const degrees = structure?.degrees || [];
  const years = degrees.find((d) => d.name === selectedDegree)?.years || [];
  const semesters = years.find((y) => y.name === selectedYear)?.semesters || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Batch Selector */}
      <div className="space-y-2">
        <Label htmlFor="batch">Batch</Label>
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger id="batch">
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            {batches.map((batch) => (
              <SelectItem key={batch.name} value={batch.name}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Degree Selector */}
      <div className="space-y-2">
        <Label htmlFor="degree">Degree</Label>
        <Select
          value={selectedDegree}
          onValueChange={setSelectedDegree}
          disabled={!selectedBatch || isStructureLoading}
        >
          <SelectTrigger id="degree">
            <SelectValue placeholder="Select degree" />
          </SelectTrigger>
          <SelectContent>
            {isStructureLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              degrees.map((degree) => (
                <SelectItem key={degree.name} value={degree.name}>
                  {degree.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Year Selector */}
      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Select
          value={selectedYear}
          onValueChange={setSelectedYear}
          disabled={!selectedDegree}
        >
          <SelectTrigger id="year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year.name} value={year.name}>
                {year.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Semester Selector */}
      <div className="space-y-2">
        <Label htmlFor="semester">Semester</Label>
        <Select
          value={selectedSemester}
          onValueChange={setSelectedSemester}
          disabled={!selectedYear}
        >
          <SelectTrigger id="semester">
            <SelectValue placeholder="Select semester" />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((semester) => (
              <SelectItem key={semester.name} value={semester.name}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
