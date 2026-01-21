import { useQuery } from "@tanstack/react-query";
import { type ModuleGrade } from "@/lib/gpa-calculator";

export interface SemesterData {
  year: string;
  semester: string;
  sgpa: number;
  credits: number;
  modules: ModuleGrade[];
}

export interface StudentDetails {
  indexNumber: string;
  rank: number;
  name: string | null;
  photoUrl: string | null;
  cgpa: number;
  totalCredits: number;
  semesters: SemesterData[];
  modules: ModuleGrade[];
}

interface StudentResponse {
  success: boolean;
  student: StudentDetails;
  error?: string;
}

export function useStudent(id: string, batch?: string, degree?: string) {
  return useQuery({
    queryKey: ["student", id, batch, degree],
    queryFn: async () => {
      let url = `/api/students/${id}`;
      const params = new URLSearchParams();
      if (batch) params.append("batch", batch);
      if (degree) params.append("degree", degree);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch student details");
      }
      const data: StudentResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch student details");
      }
      return data.student;
    },
    enabled: !!id,
  });
}

interface StudentSummary {
  id: string; // Added id for navigation
  indexNumber: string;
  rank: number;
  name: string | null;
  photoUrl: string | null;
  cgpa: number;
  totalCredits: number;
  moduleCount: number;
  lastUpdated: string;
}

interface StudentsResponse {
  success: boolean;
  students: StudentSummary[];
  error?: string;
}

export function useStudents(batch?: string, degree?: string) {
  return useQuery({
    queryKey: ["students", batch, degree],
    queryFn: async () => {
      let url =
        batch && degree
          ? `/api/${encodeURIComponent(batch)}/${encodeURIComponent(degree)}/students`
          : "/api/admin/students";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const data: StudentsResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch students");
      }
      return data.students;
    },
  });
}

interface StudentWithId {
  id: string;
  indexNumber: string;
  name: string | null;
  cgpa: number;
}

export function useStudentsWithCGPA(batch?: string, degree?: string) {
  return useQuery<StudentWithId[]>({
    queryKey: ["students-with-id", batch, degree],
    queryFn: async () => {
      if (!batch || !degree) return [];
      const url = `/api/admin/students?batch=${encodeURIComponent(batch)}&degree=${encodeURIComponent(degree)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await response.json();
      return data.students || data;
    },
    enabled: !!batch && !!degree,
  });
}

export function useAdminStudent(id: string) {
  return useQuery({
    queryKey: ["admin-student", id],
    queryFn: async () => {
      const url = `/api/admin/students/${id}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch student details");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch student details");
      }
      return data.student;
    },
    enabled: !!id,
  });
}
