"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface PDFInfo {
  pdfPath: string;
  moduleCode: string;
  moduleName: string;
  credits: number | null;
}

interface BatchParseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pdfs: PDFInfo[];
  onConfirm: (
    pdfsWithMetadata: Array<{
      pdfPath: string;
      moduleCode: string;
      moduleName: string;
      credits: number;
    }>,
    onProgress: (current: number, total: number) => void,
  ) => Promise<void>;
}

export function BatchParseDialog({
  isOpen,
  onOpenChange,
  pdfs,
  onConfirm,
}: BatchParseDialogProps) {
  const [editedPdfs, setEditedPdfs] = useState<
    Map<string, { moduleCode: string; moduleName: string; credits: string }>
  >(new Map());
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Initialize edited PDFs when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      const initialData = new Map<
        string,
        { moduleCode: string; moduleName: string; credits: string }
      >();
      pdfs.forEach((pdf: PDFInfo) => {
        initialData.set(pdf.pdfPath, {
          moduleCode: pdf.moduleCode,
          moduleName: pdf.moduleName,
          credits: pdf.credits?.toString() || "3",
        });
      });
      setEditedPdfs(initialData);
      setProgress({ current: 0, total: 0 });
    }
    onOpenChange(open);
  };

  const updatePdf = (
    pdfPath: string,
    field: "moduleCode" | "moduleName" | "credits",
    value: string,
  ) => {
    setEditedPdfs((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(pdfPath) || {
        moduleCode: "",
        moduleName: "",
        credits: "3",
      };
      newMap.set(pdfPath, { ...current, [field]: value });
      return newMap;
    });
  };

  const handleConfirm = async () => {
    // Validate all entries
    const pdfsWithMetadata: Array<{
      pdfPath: string;
      moduleCode: string;
      moduleName: string;
      credits: number;
    }> = [];

    for (const pdf of pdfs) {
      const edited = editedPdfs.get(pdf.pdfPath);
      if (!edited) continue;

      const credits = parseFloat(edited.credits);
      if (isNaN(credits) || credits <= 0) {
        alert(
          `Invalid credits for ${pdf.pdfPath}. Please enter a valid number.`,
        );
        return;
      }

      if (!edited.moduleCode.trim() || !edited.moduleName.trim()) {
        alert(`Module code and name are required for ${pdf.pdfPath}`);
        return;
      }

      pdfsWithMetadata.push({
        pdfPath: pdf.pdfPath,
        moduleCode: edited.moduleCode.trim(),
        moduleName: edited.moduleName.trim(),
        credits,
      });
    }

    setIsParsing(true);
    setProgress({ current: 0, total: pdfsWithMetadata.length });

    // Pass progress updater callback
    await onConfirm(pdfsWithMetadata, (current, total) => {
      setProgress({ current, total });
    });

    setIsParsing(false);
    onOpenChange(false);
  };

  const progressPercentage =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Batch Parse PDFs</DialogTitle>
          <DialogDescription>
            Review and edit module information for {pdfs.length} PDF
            {pdfs.length !== 1 ? "s" : ""} before parsing
          </DialogDescription>
        </DialogHeader>

        {isParsing && (
          <div className="space-y-2 px-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Parsing PDFs... {progress.current} of {progress.total}
              </span>
              <span className="font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">File</TableHead>
                <TableHead className="w-[120px]">Module Code</TableHead>
                <TableHead className="w-[200px]">Module Name</TableHead>
                <TableHead className="w-[100px]">Credits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdfs.map((pdf: PDFInfo) => {
                const edited = editedPdfs.get(pdf.pdfPath) || {
                  moduleCode: "",
                  moduleName: "",
                  credits: "3",
                };
                return (
                  <TableRow key={pdf.pdfPath}>
                    <TableCell className="font-medium text-sm">
                      {pdf.pdfPath.split("/").pop()}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={edited.moduleCode}
                        onChange={(e) =>
                          updatePdf(pdf.pdfPath, "moduleCode", e.target.value)
                        }
                        className="h-8"
                        placeholder="e.g., IN1311"
                        disabled={isParsing}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={edited.moduleName}
                        onChange={(e) =>
                          updatePdf(pdf.pdfPath, "moduleName", e.target.value)
                        }
                        className="h-8"
                        placeholder="e.g., Digital Systems"
                        disabled={isParsing}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.5"
                        value={edited.credits}
                        onChange={(e) =>
                          updatePdf(pdf.pdfPath, "credits", e.target.value)
                        }
                        className="h-8 w-20"
                        placeholder="3"
                        disabled={isParsing}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isParsing}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isParsing}>
            {isParsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing {progress.current}/{progress.total}...
              </>
            ) : (
              `Parse ${pdfs.length} PDF${pdfs.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
