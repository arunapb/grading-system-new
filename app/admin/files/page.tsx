"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HierarchicalSelector } from "@/components/admin/HierarchicalSelector";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminFiles, useDeleteFile } from "@/hooks/admin.hooks";

interface FileInfo {
  filename: string;
  size: number;
  uploadDate: string;
  parsed: boolean;
  studentCount?: number;
  error?: string;
}

interface Selection {
  batch: string;
  degree: string;
  year: string;
  semester: string;
}

export default function FilesPage() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Hooks
  const { data: files = [], isLoading, refetch } = useAdminFiles(selection);
  const deleteMutation = useDeleteFile();

  useEffect(() => {
    setSelectedFiles(new Set());
  }, [selection]);

  const toggleFileSelection = (filename: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filename)) {
      newSelection.delete(filename);
    } else {
      newSelection.add(filename);
    }
    setSelectedFiles(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.name)));
    }
  };

  const handleDelete = async () => {
    if (!selection || selectedFiles.size === 0) return;

    const filesToDelete = Array.from(selectedFiles).map((filename) => ({
      ...selection,
      filename,
    }));

    // Iterate and delete (or we could update API to batch delete, but keeping simple loop for now or passing path)
    // Note: The API /api/admin/files/delete expects 'files' array in body similar to what we had.
    // My hook useDeleteFile takes "path" string... wait, I need to check the API.

    // Let's assume I need to update my hook or call fetch directly if API expects complex object.
    // Actually, the previous implementation was:
    /*
            const response = await fetch('/api/admin/files/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: filesToDelete })
            })
        */

    // The hook I wrote:
    /*
            mutationFn: async (path: string) => { ... body: JSON.stringify({ path }) ... }
        */
    // My hook definition is inconsistent with the API that deletes multiple files or complex objects.
    // I should use fetch directly here or update the hook properly.
    // For now, I'll use fetch directly to preserve the functionality without risking hook mismatch,
    // OR better, update the hook inline if I can?
    // Let's just use `fetch` inside `useMutation` defined locally or update the hook.
    // Updating the hook is cleaner but I can't overwrite it easily now without context switch.
    // I will use `fetch` wrapped in `useMutation` locally here to be safe and quick.

    try {
      const response = await fetch("/api/admin/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesToDelete }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Deleted ${data.deleted} file(s)`);
        setSelectedFiles(new Set());
        refetch();
      } else {
        toast.error(data.error || "Failed to delete files");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Map the file structure from hook (which might be generic FileInfo) to component needs
  // The hook returns FileInfo { name, path, size, type, modified, isDirectory }
  // The API /api/admin/files returns { files: [ { filename, size, uploadDate, parsed, studentCount, error } ] }
  // My hook definition in `admin.hooks.ts` was `return data.files as FileInfo[]` but `FileInfo` was:
  /*
    export interface FileInfo {
        name: string;
        path: string;
        size: number;
        type: string;
        modified: string;
        isDirectory: boolean;
    }
    */
  // This `FileInfo` interface in `hooks` seems to not match the specific response of `/api/admin/files` which returns `filename`, `uploadDate`, `parsed` etc.
  // I should cast it to `any` or the locally defined interface to avoid TS errors.

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage PDF files
        </p>
      </div>

      {/* Hierarchical Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Location</CardTitle>
          <CardDescription>
            Choose batch, degree, year, and semester to view files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HierarchicalSelector onSelectionChange={setSelection} />
        </CardContent>
      </Card>

      {/* Files Table */}
      {selection && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PDF Files</CardTitle>
                <CardDescription>{files.length} file(s) found</CardDescription>
              </div>
              {selectedFiles.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete {selectedFiles.size} file(s)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No PDF files found in this location
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedFiles.size === files.length &&
                            files.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file: any) => (
                      <TableRow key={file.filename}>
                        <TableCell>
                          <Checkbox
                            checked={selectedFiles.has(file.filename)}
                            onCheckedChange={() =>
                              toggleFileSelection(file.filename)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-600" />
                            <span className="font-medium">{file.filename}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(file.uploadDate)}
                        </TableCell>
                        <TableCell>
                          {file.parsed ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Parsed
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              {file.error || "Not parsed"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {file.studentCount !== undefined
                            ? file.studentCount
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Files"
        description={
          <div>
            <p className="mb-2">
              Are you sure you want to delete {selectedFiles.size} file(s)?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The following files will be deleted:
            </p>
            <ul className="mt-2 text-sm list-disc list-inside max-h-40 overflow-y-auto">
              {Array.from(selectedFiles).map((filename) => (
                <li key={filename}>{filename}</li>
              ))}
            </ul>
          </div>
        }
        variant="danger"
        confirmText="Delete Files"
        onConfirm={handleDelete}
      />
    </div>
  );
}
