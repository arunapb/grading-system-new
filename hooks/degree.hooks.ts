import { useQuery } from "@tanstack/react-query";

export interface DegreeInfo {
  name: string;
  students: number;
  hasData: boolean;
}

interface DegreesResponse {
  success: boolean;
  batch: string;
  count: number;
  degrees: DegreeInfo[];
  error?: string;
}

export function useDegrees(batch: string) {
  return useQuery({
    queryKey: ["degrees", batch],
    queryFn: async () => {
      const response = await fetch(
        `/api/degrees?batch=${encodeURIComponent(batch)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch degrees");
      }
      const data: DegreesResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch degrees");
      }
      return data.degrees;
    },
    enabled: !!batch,
  });
}
