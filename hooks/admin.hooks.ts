import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
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
  filename?: string;
  uploadDate?: string;
  parsed?: boolean;
  studentCount?: number;
  error?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN";
  status: "PENDING" | "APPROVED" | "BLOCKED";
  resetCode?: string | null;
  resetCodeExpiresAt?: string | null;
  createdAt: string;
  // Granular Permissions - View/Edit pairs
  canViewStructure?: boolean;
  canEditStructure?: boolean;
  canViewStudents?: boolean;
  canEditStudents?: boolean;
  canViewModules?: boolean;
  canEditModules?: boolean;
  canViewInvitations?: boolean;
  canEditInvitations?: boolean;
  canScrape?: boolean;
  canParsePDF?: boolean;
  canManageAdmins?: boolean;
  canAssignModules?: boolean;
}

// Hooks

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

// Admin Management Hooks

export function useAdmins() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/admins");
      if (!response.ok) throw new Error("Failed to fetch admins");
      const data = await response.json();
      return data as AdminUser[];
    },
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      username: string;
      password: string;
      canViewStructure?: boolean;
      canEditStructure?: boolean;
      canViewStudents?: boolean;
      canEditStudents?: boolean;
      canViewModules?: boolean;
      canEditModules?: boolean;
      canViewInvitations?: boolean;
      canEditInvitations?: boolean;
      canScrape?: boolean;
      canParsePDF?: boolean;
      canManageAdmins?: boolean;
    }) => {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to create admin");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      username?: string;
      password?: string;
      status?: "PENDING" | "APPROVED" | "BLOCKED";
      canViewStructure?: boolean;
      canEditStructure?: boolean;
      canViewStudents?: boolean;
      canEditStudents?: boolean;
      canViewModules?: boolean;
      canEditModules?: boolean;
      canViewInvitations?: boolean;
      canEditInvitations?: boolean;
      canScrape?: boolean;
      canParsePDF?: boolean;
      canManageAdmins?: boolean;
    }) => {
      const response = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to update admin");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/admins?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to delete admin");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useGenerateResetCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      adminId: string;
      expiresInMinutes?: number;
    }) => {
      const response = await fetch("/api/admin/admins/reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to generate reset code");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useClearResetCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adminId: string) => {
      const response = await fetch(
        `/api/admin/admins/reset-code?adminId=${adminId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to clear reset code");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
