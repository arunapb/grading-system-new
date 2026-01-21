import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  totalBatches: number;
  totalStudents: number;
  averageCGPA: number;
  totalPDFs: number;
  lastUpdated?: string;
}

export interface BatchStats {
  name: string;
  studentCount: number;
  averageCGPA: number;
  topGPA: number;
  degrees: number;
  gradeDistribution: { [grade: string]: number };
  topStudents: Array<{
    indexNumber: string;
    name: string | null;
    cgpa: number;
  }>;
}

export interface TopStudent {
  indexNumber: string;
  name: string | null;
  cgpa: number;
  totalCredits: number;
  moduleCount: number;
}

export interface StatisticsData {
  success: boolean;
  overall: DashboardStats;
  batches: BatchStats[];
  topStudentsGlobal: TopStudent[];
  error?: string;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/statistics");
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data: StatisticsData = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch statistics");
      }
      return data;
    },
  });
}
