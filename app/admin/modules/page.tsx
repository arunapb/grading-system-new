"use client";

import { useState, useCallback } from "react";
import { HierarchicalSelector } from "@/components/admin/HierarchicalSelector";
import {
  useModules,
  useDeleteModule,
  useCreateModule,
  Module,
} from "@/hooks/module.hooks";
import { EditModuleDialog } from "@/components/admin/EditModuleDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ModulesPage() {
  const [selection, setSelection] = useState<{
    batch: string;
    degree: string;
    year: string;
    semester: string;
    semesterId?: string;
  }>({
    batch: "",
    degree: "",
    year: "",
    semester: "",
  });

  const handleSelectionChange = useCallback(
    (sel: {
      batch: string;
      degree: string;
      year: string;
      semester: string;
      semesterId?: string;
    }) => {
      setSelection(sel);
    },
    [],
  );

  const { data: modules = [], isLoading } = useModules(
    selection.semesterId || null,
  );
  const deleteModule = useDeleteModule();
  const createModule = useCreateModule();

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newModule, setNewModule] = useState({
    code: "",
    name: "",
    credits: "3",
  });

  const handleDelete = async () => {
    if (deletingModule) {
      await deleteModule.mutateAsync(deletingModule.id);
      setDeletingModule(null);
    }
  };

  const handleCreate = async () => {
    if (!selection.semesterId || !newModule.code || !newModule.name) return;
    await createModule.mutateAsync({
      code: newModule.code,
      name: newModule.name,
      credits: Number(newModule.credits) || 3,
      semesterId: selection.semesterId,
    });
    setNewModule({ code: "", name: "", credits: "3" });
    setIsAddDialogOpen(false);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manage Modules</h1>
        <p className="text-muted-foreground mt-1">
          View, edit credits, or delete modules for a specific semester
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Select Semester</h2>
        <HierarchicalSelector onSelectionChange={handleSelectionChange} />
      </div>

      {selection.semesterId && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Modules for {selection.degree} - {selection.year} -{" "}
              {selection.semester}
            </h2>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No modules found for this semester.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-mono font-medium">
                      {module.code}
                    </TableCell>
                    <TableCell>{module.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {module.credits}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingModule(module)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingModule(module)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <EditModuleDialog
        module={editingModule}
        open={!!editingModule}
        onOpenChange={(open) => !open && setEditingModule(null)}
      />

      <AlertDialog
        open={!!deletingModule}
        onOpenChange={(open) => !open && setDeletingModule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete module{" "}
              <span className="font-semibold">{deletingModule?.code}</span>?
              This action cannot be undone and will delete all associated
              grades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteModule.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>
              Add a new module to {selection.degree} - {selection.year} -{" "}
              {selection.semester}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={newModule.code}
                onChange={(e) =>
                  setNewModule({ ...newModule, code: e.target.value })
                }
                className="col-span-3"
                placeholder="e.g. CM 2110"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newModule.name}
                onChange={(e) =>
                  setNewModule({ ...newModule, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Module Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credits" className="text-right">
                Credits
              </Label>
              <Input
                id="credits"
                type="number"
                value={newModule.credits}
                onChange={(e) =>
                  setNewModule({ ...newModule, credits: e.target.value })
                }
                className="col-span-3"
                min="1"
                step="0.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createModule.isPending}>
              {createModule.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
