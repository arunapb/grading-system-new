import { useQuery } from "@tanstack/react-query";

export interface PDFInfo {
  pdfPath: string;
  outputPath: string;
  hasOutput: boolean;
  year: string;
  semester: string;
  filename: string;
  moduleCode: string;
  moduleName: string;
  credits: number | null;
}

interface PDFListResponse {
  success: boolean;
  pdfs: PDFInfo[];
  error?: string;
}

export function usePDFs(batch: string | null, degree: string | null) {
  return useQuery({
    queryKey: ["pdfs", batch, degree],
    queryFn: async () => {
      if (!batch || !degree) return [];
      const response = await fetch(
        `/api/list-pdfs?batch=${encodeURIComponent(batch)}&degree=${encodeURIComponent(degree)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch PDFs");
      }
      const data: PDFListResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch PDFs");
      }
      return data.pdfs;
    },
    enabled: !!batch && !!degree,
  });
}
