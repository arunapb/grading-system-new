import { useQuery } from "@tanstack/react-query";

export interface Semester {
  id: string;
  name: string;
}

export interface Year {
  id: string;
  name: string;
  semesters: Semester[];
}

export interface Degree {
  id: string;
  name: string;
  years: Year[];
}

export interface BatchStructure {
  batch: string;
  degrees: Degree[];
}

interface StructureResponse {
  success: boolean;
  structure: BatchStructure;
  error?: string;
}

export function useStructure(batch: string | null) {
  return useQuery({
    queryKey: ["structure", batch],
    queryFn: async () => {
      if (!batch) return null;
      const response = await fetch(
        `/api/admin/structure?batch=${encodeURIComponent(batch)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch structure");
      }
      const data: StructureResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch structure");
      }
      return data.structure;
    },
    enabled: !!batch,
  });
}
