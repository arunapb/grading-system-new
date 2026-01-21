"use client";

import { useState } from "react";
import { PDFTable } from "@/components/PDFTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatches } from "@/hooks/batch.hooks";
import { useStructure } from "@/hooks/structure.hooks";
import { usePDFs } from "@/hooks/pdf.hooks";

export default function AdminParserPage() {
  // 1. Fetch batches
  const { data: batches = [] } = useBatches();

  // 2. Selection states
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");

  // 3. Fetch structure for degrees when batch is selected
  const { data: structure } = useStructure(selectedBatch || null);

  // 4. Fetch PDFs when both batch and degree are selected
  const {
    data: pdfs = [],
    isLoading: isPDFsLoading,
    error: pdfsError,
    refetch: refetchPDFs,
  } = usePDFs(selectedBatch || null, selectedDegree || null);

  const degrees = structure?.degrees.map((d) => d.name) || [];

  // Reset degree when batch changes
  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    setSelectedDegree("");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Result Sheet Parser
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and parse student result PDFs
            </p>
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Batch and Degree Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Batch and Degree</CardTitle>
          <CardDescription>
            Choose batch and degree to view all PDFs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batch Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch</label>
              <Select value={selectedBatch} onValueChange={handleBatchChange}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">Degree</label>
              <Select
                value={selectedDegree}
                onValueChange={setSelectedDegree}
                disabled={!selectedBatch}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  {degrees.map((degree) => (
                    <SelectItem key={degree} value={degree}>
                      {degree}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedBatch && selectedDegree && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Selected location:</p>
              <p className="text-sm text-muted-foreground font-mono">
                {selectedBatch} / {selectedDegree}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Management */}
      {selectedBatch && selectedDegree && (
        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle>Result Sheet Management</CardTitle>
            <CardDescription>
              All PDF files in {selectedBatch}/{selectedDegree} (all years and
              semesters)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPDFsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-muted-foreground">Loading PDFs...</p>
              </div>
            ) : pdfsError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive font-medium">
                  Error: Failed to fetch PDFs
                </p>
                <button
                  onClick={() => refetchPDFs()}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : pdfs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No PDFs found in {selectedBatch}/{selectedDegree}
              </div>
            ) : (
              <PDFTable
                pdfs={pdfs}
                onRefresh={refetchPDFs}
                batch={selectedBatch}
                degree={selectedDegree}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
