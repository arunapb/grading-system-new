import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
  semesterId: string;
}

interface ModulesResponse {
  success: boolean;
  modules: Module[];
  error?: string;
}

export function useModules(semesterId: string | null) {
  return useQuery({
    queryKey: ["modules", semesterId],
    queryFn: async () => {
      if (!semesterId) return [];

      const response = await fetch(
        `/api/admin/modules?semesterId=${semesterId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }
      const data: ModulesResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch modules");
      }
      return data.modules;
    },
    enabled: !!semesterId,
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { code?: string; name?: string; credits?: number };
    }) => {
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update module");
      }
      return result.module;
    },
    onSuccess: (updatedModule) => {
      toast.success(`Module ${updatedModule.code} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update module",
      );
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to delete module");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Module deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete module",
      );
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      credits: number;
      semesterId: string;
    }) => {
      const response = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create module");
      }
      return result.module;
    },
    onSuccess: (newModule) => {
      toast.success(`Module ${newModule.code} created successfully`);
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create module",
      );
    },
  });
}
