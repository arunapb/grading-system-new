import { useQuery } from "@tanstack/react-query";

export interface BatchInfo {
  name: string;
  degrees: number;
  studentCount: number;
  topGPA: number;
  top3Students: Array<{
    indexNumber: string;
    name: string;
    cgpa: number;
  }>;
}

export interface PublicBatchInfo {
  name: string;
  degrees: number;
  students: number;
}

interface BatchesResponse {
  success: boolean;
  batches: BatchInfo[];
  error?: string;
}

interface PublicBatchesResponse {
  success: boolean;
  count: number;
  batches: PublicBatchInfo[];
  error?: string;
}

export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const response = await fetch("/api/admin/batches");
      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }
      const data: BatchesResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch batches");
      }
      return data.batches;
    },
  });
}

export function usePublicBatches() {
  return useQuery({
    queryKey: ["public-batches"],
    queryFn: async () => {
      const response = await fetch("/api/batches");
      if (!response.ok) {
        throw new Error("Failed to fetch public batches");
      }
      const data: PublicBatchesResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch public batches");
      }
      return data.batches;
    },
  });
}
