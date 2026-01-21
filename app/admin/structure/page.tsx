"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderTree,
  FolderOpen,
  Calendar,
  FileText,
  Plus,
  Loader2,
} from "lucide-react";
import { AddDegreeDialog } from "@/components/admin/AddDegreeDialog";
import { AddYearDialog } from "@/components/admin/AddYearDialog";
import { AddSemesterDialog } from "@/components/admin/AddSemesterDialog";
import { Badge } from "@/components/ui/badge";
import { useBatches } from "@/hooks/batch.hooks";
import { useStructure } from "@/hooks/structure.hooks";

export default function StructurePage() {
  const { data: batches = [] } = useBatches();
  const [selectedBatch, setSelectedBatch] = useState("");

  // Only fetch structure if a batch is selected
  const {
    data: structure,
    isLoading: isStructureLoading,
    refetch: refetchStructure,
  } = useStructure(selectedBatch || null);

  // Dialog states
  const [degreeDialog, setDegreeDialog] = useState(false);
  const [yearDialog, setYearDialog] = useState<{
    open: boolean;
    degree: string;
  }>({ open: false, degree: "" });
  const [semesterDialog, setSemesterDialog] = useState<{
    open: boolean;
    degree: string;
    year: string;
  }>({ open: false, degree: "", year: "" });

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Batch Structure</h1>
        <p className="text-muted-foreground mt-1">
          View and manage the hierarchical structure of batches
        </p>
      </div>

      {/* Batch Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Batch</CardTitle>
          <CardDescription>
            Choose a batch to view its structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.name} value={batch.name}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Structure View */}
      {selectedBatch && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Structure for {selectedBatch}</CardTitle>
                <CardDescription>Degrees, years, and semesters</CardDescription>
              </div>
              <Button onClick={() => setDegreeDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Degree
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isStructureLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : structure && structure.degrees.length > 0 ? (
              <div className="space-y-4">
                {structure.degrees.map((degree) => (
                  <div key={degree.name} className="border rounded-lg p-4">
                    {/* Degree Level */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-lg">
                          {degree.name}
                        </span>
                        <Badge variant="secondary">
                          {degree.years.length} years
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setYearDialog({ open: true, degree: degree.name })
                        }
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Add Year
                      </Button>
                    </div>

                    {/* Years */}
                    {degree.years.length > 0 ? (
                      <div className="ml-6 space-y-3">
                        {degree.years.map((year) => (
                          <div
                            key={year.name}
                            className="border-l-2 border-muted pl-4"
                          >
                            {/* Year Level */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{year.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {year.semesters.length} semesters
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setSemesterDialog({
                                    open: true,
                                    degree: degree.name,
                                    year: year.name,
                                  })
                                }
                                className="gap-2 h-8"
                              >
                                <Plus className="h-3 w-3" />
                                Add Semester
                              </Button>
                            </div>

                            {/* Semesters */}
                            {year.semesters.length > 0 && (
                              <div className="ml-6 space-y-1">
                                {year.semesters.map((semester) => (
                                  <div
                                    key={semester.name}
                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span>{semester.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="ml-6 text-sm text-muted-foreground">
                        No years added yet
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderTree className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No degrees found. Click "Add Degree" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddDegreeDialog
        open={degreeDialog}
        onOpenChange={setDegreeDialog}
        batch={selectedBatch}
        onSuccess={() => refetchStructure()}
      />

      <AddYearDialog
        open={yearDialog.open}
        onOpenChange={(open) => setYearDialog({ ...yearDialog, open })}
        batch={selectedBatch}
        degree={yearDialog.degree}
        onSuccess={() => refetchStructure()}
      />

      <AddSemesterDialog
        open={semesterDialog.open}
        onOpenChange={(open) => setSemesterDialog({ ...semesterDialog, open })}
        batch={selectedBatch}
        degree={semesterDialog.degree}
        year={semesterDialog.year}
        onSuccess={() => refetchStructure()}
      />
    </div>
  );
}
