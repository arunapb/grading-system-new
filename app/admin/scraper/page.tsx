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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  Database,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useScrapedBatches } from "@/hooks/admin.hooks";
import { useQueryClient } from "@tanstack/react-query";

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
  const [degree, setDegree] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState | null>(
    null,
  );
  const [result, setResult] = useState<{
    count: number;
    students: any[];
    photosUploaded?: number;
  } | null>(null);
  const [showWarning, setShowWarning] = useState(false);

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
    </div>
  );
}
