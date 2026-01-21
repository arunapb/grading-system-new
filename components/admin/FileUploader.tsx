"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

export function FileUploader({
  files,
  onFilesChange,
  maxFiles = MAX_FILES,
  maxSize = MAX_FILE_SIZE,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter out files that exceed size limit
      const validFiles = acceptedFiles.filter((file: File) => {
        if (file.size > maxSize) {
          alert(
            `${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
          );
          return false;
        }
        return true;
      });

      // Limit total number of files
      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, onFilesChange, maxFiles, maxSize],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_: File, i: number) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400",
              files.length >= maxFiles && "opacity-50 cursor-not-allowed",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop PDFs here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-1">
                  {files.length >= maxFiles
                    ? `Maximum ${maxFiles} files reached`
                    : "Drag & drop PDF files here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse • Max {maxSize / 1024 / 1024}MB per file •
                  Up to {maxFiles} files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  Selected Files ({files.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilesChange([])}
                >
                  Clear All
                </Button>
              </div>
              {files.map((file: File, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
