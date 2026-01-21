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
import { Loader2, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useScrapedBatches, useScrapeStudents } from "@/hooks/admin.hooks";

export default function ScraperPage() {
  const [degree, setDegree] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [result, setResult] = useState<{
    count: number;
    students: any[];
  } | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  // Hooks
  const { data: scrapedBatches = [], isLoading: isLoadingBatches } =
    useScrapedBatches();
  const scrapeMutation = useScrapeStudents();
  const { isPending: isLoading } = scrapeMutation;

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

    // Check if already scraped
    if (checkIfAlreadyScraped()) {
      setShowWarning(true);
    } else {
      handleScrape();
    }
  };

  const handleScrape = async () => {
    setShowWarning(false);
    setResult(null);

    scrapeMutation.mutate(
      { degree, batchNumber },
      {
        onSuccess: (data) => {
          toast.success(`Successfully scraped ${data.count} students!`);
          setResult({ count: data.count, students: data.students });
        },
        onError: (error) => {
          toast.error(error.message || "Failed to scrape students");
        },
      },
    );
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
              <Select value={degree} onValueChange={setDegree}>
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
                    Scraping...
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
              <strong>Saves to:</strong> data/Students/batch {batchNumber}/
              {degree.toUpperCase()}/
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Scraping Complete</CardTitle>
            </div>
            <CardDescription>
              Successfully scraped {result.count} student profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Sample Students:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.students.slice(0, 6).map((student) => (
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
                <p className="text-sm text-muted-foreground">
                  ...and {result.count - 6} more students
                </p>
              )}
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
              Scraping again will overwrite the existing data.
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
