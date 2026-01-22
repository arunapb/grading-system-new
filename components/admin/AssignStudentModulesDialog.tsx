"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, BookOpen, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: {
    id: string;
    name: string;
    year: {
      name: string;
    };
  };
}

interface AssignStudentModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Support both single and multiple modes
  studentId?: string;
  studentIds?: string[];
  batch: string;
  degree: string;
  existingModuleIds?: string[]; // Optional for bulk mode (we might not know intersection easily without extra fetch)
  onSuccess?: () => void;
}

export function AssignStudentModulesDialog({
  open,
  onOpenChange,
  studentId,
  studentIds,
  batch,
  degree,
  existingModuleIds = [],
  onSuccess,
}: AssignStudentModulesDialogProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch modules when dialog opens
  useEffect(() => {
    if (open && batch && degree) {
      fetchModules();
    }
  }, [open, batch, degree]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      // Fetch all modules for this batch/degree
      const response = await fetch(
        `/api/admin/modules?batch=${encodeURIComponent(
          batch,
        )}&degree=${encodeURIComponent(degree)}`,
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        // Filter out modules the student already has
        const available = data.filter(
          (m: Module) => !existingModuleIds.includes(m.id),
        );
        setModules(available);
        setSelectedModuleIds(new Set());
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedModuleIds.size === modules.length) {
      setSelectedModuleIds(new Set());
    } else {
      setSelectedModuleIds(new Set(modules.map((m) => m.id)));
    }
  };

  const handleToggleModule = (moduleId: string) => {
    const newSet = new Set(selectedModuleIds);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setSelectedModuleIds(newSet);
  };

  const handleSubmit = async () => {
    if (selectedModuleIds.size === 0) return;

    const targetStudentIds = studentIds || (studentId ? [studentId] : []);
    if (targetStudentIds.length === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/assign-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleIds: Array.from(selectedModuleIds),
          studentIds: targetStudentIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Successfully assigned ${selectedModuleIds.size} module(s) to ${targetStudentIds.length} student(s)`,
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || "Failed to assign modules");
      }
    } catch (error) {
      console.error("Failed to assign modules:", error);
      toast.error("Failed to assign modules");
    } finally {
      setSubmitting(false);
    }
  };

  // Group modules by semester for better display
  const groupedModules = useMemo(() => {
    const groups: Record<string, Module[]> = {};
    modules.forEach((m) => {
      const key = `${m.semester.year.name} - ${m.semester.name}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [modules]);

  const allSelected =
    modules.length > 0 && selectedModuleIds.size === modules.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Enroll Modules
          </DialogTitle>
          <DialogDescription>
            Assign new modules to this student. Initial grade will be PENDING.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No new modules available to assign.
              <br />
              <span className="text-sm">
                Student is already enrolled in all available modules for their
                degree.
              </span>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Select All */}
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-2"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {allSelected ? "Deselect All" : "Select All"} (
                  {modules.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedModuleIds.size} selected
                </span>
              </div>

              {/* Module List */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 pb-4">
                  {Object.entries(groupedModules).map(
                    ([semesterName, groupModules]) => (
                      <div key={semesterName} className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground bg-muted/30 p-1 rounded px-2">
                          {semesterName}
                        </h4>
                        <div className="grid gap-2">
                          {groupModules.map((module) => (
                            <label
                              key={module.id}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-colors"
                            >
                              <Checkbox
                                checked={selectedModuleIds.has(module.id)}
                                onCheckedChange={() =>
                                  handleToggleModule(module.id)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-sm font-medium">
                                    {module.code}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-5"
                                  >
                                    {module.credits} Credits
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {module.name}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedModuleIds.size === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enroll in {selectedModuleIds.size} Module
            {selectedModuleIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
