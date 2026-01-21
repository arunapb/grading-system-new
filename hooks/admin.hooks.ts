import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface SystemHealth {
  diskSpace: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  files: {
    totalPDFs: number;
    totalJSON: number;
    totalSize: number;
  };
  parsing: {
    totalParsed: number;
    totalFailed: number;
    successRate: number;
  };
  recentErrors: Array<{
    timestamp: string;
    action: string;
    error: string;
  }>;
  recentActivity: Array<{
    timestamp: string;
    action: string;
    details: any;
  }>;
}

interface ScrapedBatch {
  batch: string;
  degree: string;
  studentCount: number;
  scrapedAt: string;
}

interface ScrapeResult {
  success: boolean;
  count: number;
  students: any[];
  error?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  modified: string;
  isDirectory: boolean;
  // Additional fields from API
  filename?: string;
  uploadDate?: string;
  parsed?: boolean;
  studentCount?: number;
  error?: string;
}

// Hooks
export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await fetch("/api/admin/health");
      if (!response.ok) throw new Error("Failed to fetch health status");
      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || "Failed to fetch health status");
      return data.health as SystemHealth;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useScrapedBatches() {
  return useQuery({
    queryKey: ["admin", "scraped-batches"],
    queryFn: async () => {
      const response = await fetch("/api/admin/scraped-batches");
      if (!response.ok) throw new Error("Failed to fetch scraped batches");
      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || "Failed to fetch scraped batches");
      return data.scraped as ScrapedBatch[];
    },
  });
}

export function useScrapeStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { degree: string; batchNumber: string }) => {
      const response = await fetch("/api/admin/scrape-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || "Failed to scrape students");
      return data as ScrapeResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "scraped-batches"] });
    },
  });
}

export function useUploadPDFs() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      return data;
    },
  });
}

export function useAdminFiles(
  params?: {
    batch: string;
    degree: string;
    year: string;
    semester: string;
  } | null,
) {
  return useQuery({
    queryKey: ["admin", "files", params],
    queryFn: async () => {
      if (!params) return [];
      const queryParams = new URLSearchParams({
        batch: params.batch,
        degree: params.degree,
        year: params.year,
        semester: params.semester,
      });
      const response = await fetch(`/api/admin/files?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch files");
      return data.files as FileInfo[];
    },
    enabled: !!params,
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch("/api/admin/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to delete file");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "files"] });
    },
  });
}
