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
import { HierarchicalSelector } from "@/components/admin/HierarchicalSelector";
import { FileUploader } from "@/components/admin/FileUploader";
import { UploadProgress } from "@/components/admin/UploadProgress";
import { Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUploadPDFs } from "@/hooks/admin.hooks";

interface Selection {
  batch: string;
  degree: string;
  year: string;
  semester: string;
}

interface UploadResult {
  filename: string;
  success: boolean;
  error?: string;
  parsed?: boolean;
  studentCount?: number;
}

export default function UploadPage() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);

  const uploadMutation = useUploadPDFs();
  const { isPending: isUploading } = uploadMutation;

  const handleUpload = async () => {
    if (!selection) {
      toast.error("Please select batch, degree, year, and semester");
      return;
    }

    if (files.length === 0) {
      toast.error("Please select at least one PDF file");
      return;
    }

    setProgress(0);
    setResults([]);

    const formData = new FormData();
    formData.append("batch", selection.batch);
    formData.append("degree", selection.degree);
    formData.append("year", selection.year);
    formData.append("semester", selection.semester);

    files.forEach((file) => {
      formData.append("files", file);
    });

    // Simulate progress for UI feedback
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    uploadMutation.mutate(formData, {
      onSuccess: (data) => {
        clearInterval(progressInterval);
        setProgress(100);
        setResults(data.results);
        toast.success(`Uploaded ${data.uploaded} file(s) successfully!`);
        setFiles([]);
      },
      onError: (error) => {
        clearInterval(progressInterval);
        toast.error(error.message || "Upload failed");
      },
    });
  };

  const isReadyToUpload =
    selection !== null && files.length > 0 && !isUploading;

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload PDFs</h1>
        <p className="text-muted-foreground mt-1">
          Upload result PDFs and automatically parse student grades
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          PDFs will be automatically parsed after upload. Maximum 5MB per file,
          up to 10 files at once.
        </AlertDescription>
      </Alert>

      {/* Hierarchical Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Destination</CardTitle>
          <CardDescription>
            Choose where to upload the PDF files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HierarchicalSelector onSelectionChange={setSelection} />

          {selection && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Upload destination:</p>
              <p className="text-sm text-muted-foreground font-mono">
                data/input/{selection.batch}/{selection.degree}/{selection.year}
                /{selection.semester}/
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Uploader */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>
            Drag and drop PDF files or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader
            files={files}
            onFilesChange={setFiles}
            maxFiles={10}
            maxSize={5 * 1024 * 1024}
          />
        </CardContent>
      </Card>

      {/* Upload Button */}
      <div className="mb-6">
        <Button
          onClick={handleUpload}
          disabled={!isReadyToUpload}
          size="lg"
          className="w-full md:w-auto gap-2"
        >
          <Upload className="h-5 w-5" />
          {isUploading
            ? "Uploading & Parsing..."
            : `Upload & Parse ${files.length} File(s)`}
        </Button>
      </div>

      {/* Upload Progress */}
      <UploadProgress
        isUploading={isUploading}
        progress={progress}
        results={results}
      />
    </div>
  );
}
