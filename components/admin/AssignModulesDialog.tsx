"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Users, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  indexNumber: string;
  name: string | null;
  existingModuleIds: string[];
}

interface Module {
  id: string;
  code: string;
  name: string;
}

interface AssignModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
  semesterId: string;
  onSuccess?: () => void;
}

export function AssignModulesDialog({
  open,
  onOpenChange,
  module,
  semesterId,
  onSuccess,
}: AssignModulesDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch students when dialog opens
  useEffect(() => {
    if (open && module && semesterId) {
      fetchStudents();
    }
  }, [open, module, semesterId]);

  const fetchStudents = async () => {
    if (!module) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/assign-modules?semesterId=${semesterId}&moduleIds=${module.id}`,
      );
      const data = await response.json();
      if (data.success) {
        // Filter out students who already have this module
        const availableStudents = data.students.filter(
          (s: Student) => !s.existingModuleIds.includes(module.id),
        );
        setStudents(availableStudents);
        setSelectedStudentIds(new Set());
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleSubmit = async () => {
    if (!module || selectedStudentIds.size === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/assign-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleIds: [module.id],
          studentIds: Array.from(selectedStudentIds),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Module ${module.code} assigned to ${data.assignedCount} student(s)`,
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || "Failed to assign module");
      }
    } catch (error) {
      console.error("Failed to assign module:", error);
      toast.error("Failed to assign module");
    } finally {
      setSubmitting(false);
    }
  };

  const allSelected =
    students.length > 0 && selectedStudentIds.size === students.length;
  const someSelected =
    selectedStudentIds.size > 0 && selectedStudentIds.size < students.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Module to Students
          </DialogTitle>
          <DialogDescription>
            {module && (
              <>
                Assign <span className="font-semibold">{module.code}</span> -{" "}
                {module.name} to selected students. Students will be able to
                submit their grade once.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students available for assignment.
              <br />
              <span className="text-sm">
                All students may already have this module assigned.
              </span>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between border-b pb-2">
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
                  {students.length} students)
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedStudentIds.size} selected
                </span>
              </div>

              {/* Student List */}
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {students.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedStudentIds.has(student.id)}
                        onCheckedChange={() => handleToggleStudent(student.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm font-medium">
                          {student.indexNumber}
                        </div>
                        {student.name && (
                          <div className="text-sm text-muted-foreground truncate">
                            {student.name}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedStudentIds.size === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign to {selectedStudentIds.size} Student
            {selectedStudentIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
