import { useQuery } from "@tanstack/react-query";

export interface DegreeInfo {
  id: string;
  name: string;
  batchName: string;
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

export function useDegrees(batch?: string) {
  const queryKey = batch ? ["degrees", batch] : ["degrees", "all"];
  const url = batch
    ? `/api/degrees?batch=${encodeURIComponent(batch)}`
    : "/api/degrees";

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch degrees");
      }
      const data: DegreesResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch degrees");
      }
      return data.degrees;
    },
  });
}
