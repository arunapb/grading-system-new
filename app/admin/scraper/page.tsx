"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  Database,
  Search,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  FileUp,
  X,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useScrapedBatches } from "@/hooks/admin.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useRequireScrapePermission } from "@/hooks/useRequirePermission";
import { AccessDenied } from "@/components/AccessDenied";
import { parsePrefixMappingEntries } from "@/lib/degree-mapping";

interface ProgressState {
  step: string;
  message: string;
  progress?: number;
  count?: number;
  uploaded?: number;
  total?: number;
  students?: any[];
  totalCount?: number;
  photosUploaded?: number;
  dbSaved?: number;
}

export default function ScraperPage() {
  // Permission check - redirects if unauthorized
  const { isLoading: isCheckingAuth, hasPermission } =
    useRequireScrapePermission();

  const [degree, setDegree] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState | null>(
    null,
  );

  // Edit State
  const [editingStudent, setEditingStudent] = useState<{
    index: number;
    indexNumber: string;
    name: string;
  } | null>(null);
  const [editForm, setEditForm] = useState({ indexNumber: "", name: "" });
  const [result, setResult] = useState<{
    count: number;
    students: any[];
    photosUploaded?: number;
  } | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  // PDF Upload states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDegree, setPdfDegree] = useState("");
  const [pdfBatchNumber, setPdfBatchNumber] = useState("");
  const [pdfParsedStudents, setPdfParsedStudents] = useState<any[]>([]);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isPdfSaving, setIsPdfSaving] = useState(false);
  const [pdfResult, setPdfResult] = useState<{
    count: number;
    students: any[];
    skippedCount?: number;
  } | null>(null);
  const [showPdfConfirm, setShowPdfConfirm] = useState(false);

  // Prefix mapping state
  const [prefixMappings, setPrefixMappings] = useState<
    Array<{ prefixes: string; degree: string }>
  >([{ prefixes: "", degree: "" }]);

  // Degree assignment state for unmatched students
  const [selectedStudentIndices, setSelectedStudentIndices] = useState<
    Set<number>
  >(new Set());
  const [assignDegreeName, setAssignDegreeName] = useState("");
  const [manualDegreeAssignments, setManualDegreeAssignments] = useState<
    Record<string, { degreeName: string; batchName: string }>
  >({});
  const [existingDegrees, setExistingDegrees] = useState<
    Array<{ id: string; name: string; batchName: string }>
  >([]);

  const queryClient = useQueryClient();
  const { data: scrapedBatches = [], isLoading: isLoadingBatches } =
    useScrapedBatches();

  const checkIfAlreadyScraped = () => {
    if (!degree || !batchNumber) return false;
    const batchName = `batch ${batchNumber}`;
    return scrapedBatches.some(
      (s) =>
        s.batch === batchName &&
        s.degree.toLowerCase() === degree.toLowerCase(),
    );
  };

  const handleScrapeClick = () => {
    if (!degree || !batchNumber) {
      toast.error("Please select degree and enter batch number");
      return;
    }

    if (checkIfAlreadyScraped()) {
      setShowWarning(true);
    } else {
      handleScrape();
    }
  };

  const handleScrape = useCallback(async () => {
    setShowWarning(false);
    setResult(null);
    setProgressState(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/scrape-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ degree, batchNumber }),
      });

      if (!response.ok) {
        throw new Error("Failed to start scraping");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgressState(data);

              if (data.step === "complete") {
                setResult({
                  count: data.totalCount,
                  students: data.students || [],
                  photosUploaded: data.photosUploaded,
                });
                toast.success(data.message);
                // Invalidate cached data
                queryClient.invalidateQueries({
                  queryKey: ["admin", "scraped-batches"],
                });
              } else if (data.step === "error") {
                toast.error(data.message);
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to scrape students",
      );
    } finally {
      setIsLoading(false);
    }
  }, [degree, batchNumber, queryClient]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case "scraping":
        return <Search className="h-4 w-4 animate-pulse" />;
      case "scraped":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "setup":
      case "saving":
        return <Database className="h-4 w-4 animate-pulse" />;
      case "saved":
        return <Database className="h-4 w-4 text-green-600" />;
      case "uploading":
        return <Cloud className="h-4 w-4 animate-pulse" />;
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStepColor = (step: string) => {
    if (step === "complete")
      return "bg-green-100 text-green-800 border-green-200";
    if (step === "error") return "bg-red-100 text-red-800 border-red-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  // Prefix mapping handlers
  const addPrefixMapping = () => {
    setPrefixMappings((prev) => [...prev, { prefixes: "", degree: "" }]);
  };

  const removePrefixMapping = (index: number) => {
    setPrefixMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePrefixMapping = (
    index: number,
    field: "prefixes" | "degree",
    value: string,
  ) => {
    setPrefixMappings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Build prefix map from UI entries
  const buildPrefixMap = () => {
    return parsePrefixMappingEntries(prefixMappings);
  };

  // Fetch existing degrees for a batch
  const fetchExistingDegrees = async (batchName: string) => {
    try {
      const response = await fetch(
        `/api/degrees?batch=${encodeURIComponent(batchName)}`,
      );
      const data = await response.json();
      if (data.success && data.degrees) {
        setExistingDegrees(data.degrees);
      }
    } catch (error) {
      console.error("Error fetching degrees:", error);
    }
  };

  // Handle student checkbox selection
  const toggleStudentSelection = (index: number) => {
    setSelectedStudentIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAllUnmatched = () => {
    const unmatchedIndices = pdfParsedStudents
      .map((s, i) => ({ s, i }))
      .filter(
        ({ s }) => !s.inferredDegree && !manualDegreeAssignments[s.indexNumber],
      )
      .map(({ i }) => i);

    const allSelected = unmatchedIndices.every((i) =>
      selectedStudentIndices.has(i),
    );

    if (allSelected) {
      setSelectedStudentIndices((prev) => {
        const next = new Set(prev);
        unmatchedIndices.forEach((i) => next.delete(i));
        return next;
      });
    } else {
      setSelectedStudentIndices((prev) => {
        const next = new Set(prev);
        unmatchedIndices.forEach((i) => next.add(i));
        return next;
      });
    }
  };

  // Assign degree to selected students
  const handleAssignDegree = () => {
    if (!assignDegreeName.trim()) {
      toast.error("Please enter or select a degree name");
      return;
    }
    if (selectedStudentIndices.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    const newAssignments = { ...manualDegreeAssignments };
    selectedStudentIndices.forEach((idx) => {
      const student = pdfParsedStudents[idx];
      if (student) {
        // Use student's inferred batch or global batch
        const batchName =
          student.inferredBatch ||
          (pdfBatchNumber
            ? pdfBatchNumber.toLowerCase().startsWith("batch")
              ? pdfBatchNumber
              : `Batch ${pdfBatchNumber}`
            : "");
        newAssignments[student.indexNumber] = {
          degreeName: assignDegreeName.trim().toUpperCase(),
          batchName,
        };
      }
    });

    setManualDegreeAssignments(newAssignments);
    setSelectedStudentIndices(new Set());
    toast.success(
      `Assigned ${assignDegreeName.trim().toUpperCase()} to ${selectedStudentIndices.size} student(s)`,
    );
  };

  // Remove manual assignment
  const removeManualAssignment = (indexNumber: string) => {
    setManualDegreeAssignments((prev) => {
      const next = { ...prev };
      delete next[indexNumber];
      return next;
    });
  };

  // PDF Upload handler
  const handlePDFUpload = async (action: "preview" | "save") => {
    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    const prefixMap = buildPrefixMap();

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("action", action);
    if (pdfDegree) formData.append("degree", pdfDegree);
    if (pdfBatchNumber) formData.append("batch", pdfBatchNumber);
    if (Object.keys(prefixMap).length > 0) {
      formData.append("degreePrefixMap", JSON.stringify(prefixMap));
    }
    if (action === "save" && Object.keys(manualDegreeAssignments).length > 0) {
      formData.append(
        "manualDegreeAssignments",
        JSON.stringify(manualDegreeAssignments),
      );
    }

    try {
      if (action === "preview") {
        setIsPdfLoading(true);
      } else {
        setIsPdfSaving(true);
      }

      const response = await fetch("/api/admin/upload-students-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process PDF");
      }

      if (action === "preview") {
        setPdfParsedStudents(data.students);
        setSelectedStudentIndices(new Set());
        setManualDegreeAssignments({});
        toast.success(`Found ${data.count} students in PDF`);

        // Fetch existing degrees for relevant batches
        const batches = new Set<string>();
        data.students.forEach((s: any) => {
          if (s.inferredBatch) batches.add(s.inferredBatch);
        });
        if (pdfBatchNumber) {
          const bn = pdfBatchNumber.toLowerCase().startsWith("batch")
            ? pdfBatchNumber
            : `Batch ${pdfBatchNumber}`;
          batches.add(bn);
        }
        // Fetch degrees for first batch only (they usually belong to same batch)
        const firstBatch = [...batches][0];
        if (firstBatch) {
          fetchExistingDegrees(firstBatch);
        }
      } else {
        setPdfResult({
          count: data.count,
          students: data.students,
          skippedCount: data.skippedCount || 0,
        });
        setPdfParsedStudents([]);
        setPdfFile(null);
        setShowPdfConfirm(false);
        setManualDegreeAssignments({});
        setSelectedStudentIndices(new Set());
        toast.success(data.message);
        // Invalidate cached data
        queryClient.invalidateQueries({
          queryKey: ["admin", "scraped-batches"],
        });
      }
    } catch (error) {
      console.error("PDF upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process PDF",
      );
    } finally {
      setIsPdfLoading(false);
      setIsPdfSaving(false);
    }
  };

  const clearPDFSelection = () => {
    setPdfFile(null);
    setPdfParsedStudents([]);
    setPdfResult(null);
    setSelectedStudentIndices(new Set());
    setManualDegreeAssignments({});
  };

  const handleEditClick = (index: number, student: any) => {
    setEditingStudent({
      index,
      indexNumber: student.indexNumber,
      name: student.name,
    });
    setEditForm({ indexNumber: student.indexNumber, name: student.name });
  };

  const handleSaveEdit = () => {
    if (!editingStudent) return;

    // Update the students array
    const updatedStudents = [...pdfParsedStudents];
    updatedStudents[editingStudent.index] = {
      ...updatedStudents[editingStudent.index],
      indexNumber: editForm.indexNumber,
      name: editForm.name,
    };

    setPdfParsedStudents(updatedStudents);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (index: number) => {
    const updatedStudents = [...pdfParsedStudents];
    updatedStudents.splice(index, 1);
    setPdfParsedStudents(updatedStudents);
  };

  // Show loading while checking permissions
  if (isCheckingAuth) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show Access Denied if no permission
  if (!hasPermission) {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Student Profile Scraper
        </h1>
        <p className="text-muted-foreground mt-1">
          Fetch student data from UOM website
        </p>
      </div>

      {/* Already Scraped Batches */}
      {scrapedBatches.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Already Scraped Batches</CardTitle>
            <CardDescription>
              These batches have already been scraped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Batch</TableHead>
                    <TableHead className="font-semibold">Degree</TableHead>
                    <TableHead className="font-semibold">Students</TableHead>
                    <TableHead className="font-semibold">Scraped At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scrapedBatches.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {item.batch}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.degree}</Badge>
                      </TableCell>
                      <TableCell>{item.studentCount} students</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.scrapedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scraper Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scrape Student Profiles</CardTitle>
          <CardDescription>
            Enter batch and degree to fetch student information from uom.lk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Select
                value={degree}
                onValueChange={setDegree}
                disabled={isLoading}
              >
                <SelectTrigger id="degree">
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="itm">ITM</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                placeholder="e.g., 21, 22"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleScrapeClick}
                disabled={isLoading || !degree || !batchNumber}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Scrape Students
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>URL Pattern:</strong> https://uom.lk/student/{degree}
              -batch-{batchNumber}.php
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Saves to:</strong> Database + Cloudinary
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PDF Upload Section */}
      <Card className="mb-6 border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Upload Student List PDF
          </CardTitle>
          <CardDescription>
            Alternative method: Upload an Academic Advisor List PDF to add
            students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-xs text-muted-foreground p-2 bg-muted/50 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Batch is auto-detected from index number (e.g. 240xxx → Batch 24).
              Define prefix-to-degree mappings below, or assign degrees manually
              after preview.
            </span>
          </div>

          {/* Row 1: Batch + File */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="pdfBatchNumber">
                Batch Number{" "}
                <span className="text-muted-foreground font-normal">
                  (Optional — auto-detected from index)
                </span>
              </Label>
              <Input
                id="pdfBatchNumber"
                placeholder="Auto-detect (e.g. 24)"
                value={pdfBatchNumber}
                onChange={(e) => setPdfBatchNumber(e.target.value)}
                disabled={isPdfLoading || isPdfSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfFile">PDF File</Label>
              <div className="flex gap-2">
                <Input
                  id="pdfFile"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfFile(file);
                      setPdfParsedStudents([]);
                      setPdfResult(null);
                    }
                  }}
                  disabled={isPdfLoading || isPdfSaving}
                  className="flex-1"
                />
                {pdfFile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearPDFSelection}
                    disabled={isPdfLoading || isPdfSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Global Degree Override (Optional) */}
          <div className="mb-4">
            <div className="space-y-2">
              <Label htmlFor="pdfDegree">
                Global Degree Override{" "}
                <span className="text-muted-foreground font-normal">
                  (Optional — applies same degree to ALL students, overrides
                  prefix mapping)
                </span>
              </Label>
              <div className="max-w-xs">
                <Select
                  value={pdfDegree}
                  onValueChange={setPdfDegree}
                  disabled={isPdfLoading || isPdfSaving}
                >
                  <SelectTrigger id="pdfDegree">
                    <SelectValue placeholder="Use prefix mapping instead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      — None (use prefix mapping) —
                    </SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="itm">ITM</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Row 3: Degree Prefix Mapping (Optional) */}
          {(!pdfDegree || pdfDegree === "none") && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">
                  Degree Prefix Mapping{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPrefixMapping}
                  disabled={isPdfLoading || isPdfSaving}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Row
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Map 3-digit index prefixes to degree names. E.g., prefixes "240,
                241, 242" → degree "IT"
              </p>
              <div className="space-y-2">
                {prefixMappings.map((mapping, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Prefixes (e.g. 240, 241, 242)"
                      value={mapping.prefixes}
                      onChange={(e) =>
                        updatePrefixMapping(idx, "prefixes", e.target.value)
                      }
                      disabled={isPdfLoading || isPdfSaving}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">→</span>
                    <Input
                      placeholder="Degree (e.g. IT)"
                      value={mapping.degree}
                      onChange={(e) =>
                        updatePrefixMapping(idx, "degree", e.target.value)
                      }
                      disabled={isPdfLoading || isPdfSaving}
                      className="w-32"
                    />
                    {prefixMappings.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removePrefixMapping(idx)}
                        disabled={isPdfLoading || isPdfSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pdfFile && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => handlePDFUpload("preview")}
                disabled={isPdfLoading || isPdfSaving}
                variant="outline"
                className="gap-2"
              >
                {isPdfLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Preview Students
                  </>
                )}
              </Button>

              {pdfParsedStudents.length > 0 && (
                <Button
                  onClick={() => setShowPdfConfirm(true)}
                  disabled={isPdfSaving}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Save {pdfParsedStudents.length} Students
                </Button>
              )}
            </div>
          )}

          {/* Preview Table - Shows ALL students with inferred degree/batch */}
          {pdfParsedStudents.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Found {pdfParsedStudents.length} students:
                </p>
                {pdfParsedStudents.some(
                  (s) =>
                    !s.inferredDegree &&
                    !manualDegreeAssignments[s.indexNumber],
                ) && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-300"
                  >
                    {
                      pdfParsedStudents.filter(
                        (s) =>
                          !s.inferredDegree &&
                          !manualDegreeAssignments[s.indexNumber],
                      ).length
                    }{" "}
                    unmatched
                  </Badge>
                )}
              </div>
              <div className="rounded-lg border max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 sticky top-0">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            pdfParsedStudents.some(
                              (s) =>
                                !s.inferredDegree &&
                                !manualDegreeAssignments[s.indexNumber],
                            ) &&
                            pdfParsedStudents
                              .map((s, i) => ({ s, i }))
                              .filter(
                                ({ s }) =>
                                  !s.inferredDegree &&
                                  !manualDegreeAssignments[s.indexNumber],
                              )
                              .every(({ i }) => selectedStudentIndices.has(i))
                          }
                          onCheckedChange={() => toggleAllUnmatched()}
                        />
                      </TableHead>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Reg. No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Degree</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pdfParsedStudents.map((student, idx) => {
                      const manualAssignment =
                        manualDegreeAssignments[student.indexNumber];
                      const hasDegree =
                        student.inferredDegree || manualAssignment;
                      const displayDegree = manualAssignment
                        ? manualAssignment.degreeName
                        : student.inferredDegree;

                      return (
                        <TableRow
                          key={student.indexNumber}
                          className={!hasDegree ? "bg-orange-50" : ""}
                        >
                          <TableCell>
                            {!hasDegree ? (
                              <Checkbox
                                checked={selectedStudentIndices.has(idx)}
                                onCheckedChange={() =>
                                  toggleStudentSelection(idx)
                                }
                              />
                            ) : manualAssignment ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  removeManualAssignment(student.indexNumber)
                                }
                                title="Remove assignment"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {student.indexNumber}
                          </TableCell>
                          <TableCell>{student.name || "—"}</TableCell>
                          <TableCell>
                            {student.inferredBatch ? (
                              <Badge variant="secondary" className="text-xs">
                                {student.inferredBatch}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {displayDegree ? (
                              <Badge
                                variant={
                                  manualAssignment ? "default" : "secondary"
                                }
                                className={`text-xs ${
                                  manualAssignment
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : ""
                                }`}
                              >
                                {displayDegree}
                                {manualAssignment && " ✎"}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-orange-600 border-orange-300"
                              >
                                No Match
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditClick(idx, student)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteStudent(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Degree Assignment Section - for unmatched students */}
              {pdfParsedStudents.some(
                (s) =>
                  !s.inferredDegree && !manualDegreeAssignments[s.indexNumber],
              ) && (
                <div className="mt-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <p className="text-sm font-semibold mb-3 text-orange-800">
                    Assign Degree to Unmatched Students
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select students using the checkboxes above, then choose or
                    create a degree to assign.
                  </p>
                  <div className="flex items-end gap-3">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Degree Name</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter degree name (e.g. IT, ITM, AI)"
                          value={assignDegreeName}
                          onChange={(e) => setAssignDegreeName(e.target.value)}
                          className="flex-1"
                        />
                        {existingDegrees.length > 0 && (
                          <Select
                            value=""
                            onValueChange={(val) => setAssignDegreeName(val)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Or pick existing" />
                            </SelectTrigger>
                            <SelectContent>
                              {existingDegrees.map((d) => (
                                <SelectItem key={d.id} value={d.name}>
                                  {d.name} ({d.batchName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleAssignDegree}
                      disabled={
                        selectedStudentIndices.size === 0 ||
                        !assignDegreeName.trim()
                      }
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Assign to {selectedStudentIndices.size} Student
                      {selectedStudentIndices.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF Upload Result */}
          {pdfResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Successfully added {pdfResult.count} students
                  </p>
                  {pdfResult.skippedCount && pdfResult.skippedCount > 0 && (
                    <p className="text-sm text-green-700">
                      {pdfResult.skippedCount} students were skipped (already
                      exist)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Accepted Format:</strong> Academic Advisor List PDF with
              REG. NO and NAME columns
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Saves to:</strong> Database only (no photos)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      {isLoading && progressState && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getStepIcon(progressState.step)}
              Processing...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Step */}
            <div className="flex items-center gap-2">
              <Badge className={getStepColor(progressState.step)}>
                {progressState.step.toUpperCase()}
              </Badge>
              <span className="text-sm">{progressState.message}</span>
            </div>

            {/* Progress Bar for uploads */}
            {progressState.step === "uploading" &&
              progressState.progress !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Uploading photos to Cloudinary
                    </span>
                    <span>{progressState.progress}%</span>
                  </div>
                  <Progress value={progressState.progress} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploaded: {progressState.uploaded || 0}</span>
                    <span>Total: {progressState.total || 0}</span>
                  </div>
                </div>
              )}

            {/* Steps Summary */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <div
                className={`text-center p-2 rounded ${
                  ["scraped", "saved", "uploading", "complete"].includes(
                    progressState.step,
                  )
                    ? "bg-green-100"
                    : progressState.step === "scraping"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                }`}
              >
                <Search className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">Scrape</span>
              </div>
              <div
                className={`text-center p-2 rounded ${
                  ["saved", "uploading", "complete"].includes(
                    progressState.step,
                  )
                    ? "bg-green-100"
                    : ["setup", "saving"].includes(progressState.step)
                      ? "bg-blue-100"
                      : "bg-gray-100"
                }`}
              >
                <Database className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">Save DB</span>
              </div>
              <div
                className={`text-center p-2 rounded ${
                  progressState.step === "complete"
                    ? "bg-green-100"
                    : progressState.step === "uploading"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                }`}
              >
                <Cloud className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">Upload</span>
              </div>
              <div
                className={`text-center p-2 rounded ${
                  progressState.step === "complete"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">Done</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Scraping Complete</CardTitle>
            </div>
            <CardDescription>
              Successfully scraped {result.count} student profiles
              {result.photosUploaded !== undefined && (
                <span className="ml-2">
                  • {result.photosUploaded} photos uploaded
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{result.count}</p>
                  <p className="text-sm text-muted-foreground">
                    Students Found
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{result.count}</p>
                  <p className="text-sm text-muted-foreground">Saved to DB</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {result.photosUploaded ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Photos Uploaded
                  </p>
                </div>
              </div>

              {/* Sample Students */}
              <div>
                <p className="text-sm font-medium mb-2">Sample Students:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(result.students || []).slice(0, 6).map((student) => (
                    <div
                      key={student.indexNumber}
                      className="p-3 border rounded-lg"
                    >
                      <p className="font-mono text-sm font-medium">
                        {student.indexNumber}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {student.name}
                      </p>
                    </div>
                  ))}
                </div>
                {result.count > 6 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ...and {result.count - 6} more students
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertDialogTitle>Already Scraped</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This batch and degree combination has already been scraped.
              Scraping again will update the existing data.
              <br />
              <br />
              <strong>Batch:</strong> batch {batchNumber}
              <br />
              <strong>Degree:</strong> {degree.toUpperCase()}
              <br />
              <br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleScrape}>
              Yes, Scrape Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Upload Confirmation Dialog */}
      <AlertDialog open={showPdfConfirm} onOpenChange={setShowPdfConfirm}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <AlertDialogTitle>Confirm Add Students</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">
                  You are about to add{" "}
                  <strong>{pdfParsedStudents.length} students</strong> to the
                  database.
                </p>
                <div className="p-3 bg-muted rounded-lg mb-4 space-y-1 text-sm">
                  {(() => {
                    // Calculate degree breakdown
                    const degreeBreakdown: Record<string, number> = {};
                    let nullCount = 0;
                    pdfParsedStudents.forEach((s) => {
                      const manual = manualDegreeAssignments[s.indexNumber];
                      const deg = manual ? manual.degreeName : s.inferredDegree;
                      if (deg) {
                        degreeBreakdown[deg] = (degreeBreakdown[deg] || 0) + 1;
                      } else {
                        nullCount++;
                      }
                    });
                    return (
                      <>
                        {Object.entries(degreeBreakdown).map(([deg, count]) => (
                          <p key={deg}>
                            <strong>{deg}:</strong> {count} student
                            {count !== 1 ? "s" : ""}
                          </p>
                        ))}
                        {nullCount > 0 && (
                          <p className="text-orange-600">
                            <strong>Unassigned:</strong> {nullCount} student
                            {nullCount !== 1 ? "s" : ""} (will be saved without
                            degree)
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Students with registration numbers that already exist in the
                  database will be skipped automatically.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPdfSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handlePDFUpload("save")}
              disabled={isPdfSaving}
            >
              {isPdfSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>Yes, Add Students</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Student Dialog */}
      <Dialog
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Modify the details for this student record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-indexNumber">Registration Number</Label>
              <Input
                id="edit-indexNumber"
                value={editForm.indexNumber}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    indexNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Student Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. S.K. PERERA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
