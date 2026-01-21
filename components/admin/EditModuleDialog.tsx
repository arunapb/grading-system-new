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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Module, useUpdateModule } from "@/hooks/module.hooks";

interface EditModuleDialogProps {
  module: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditModuleDialog({
  module,
  open,
  onOpenChange,
}: EditModuleDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState<number | string>("");
  const updateModule = useUpdateModule();

  useEffect(() => {
    if (module) {
      setCode(module.code);
      setName(module.name);
      setCredits(module.credits);
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module) return;

    await updateModule.mutateAsync({
      id: module.id,
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        credits: Number(credits),
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Module Details</DialogTitle>
          <DialogDescription>
            Update the information for this module.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Module Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. IN3410"
                disabled={updateModule.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Module Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Module Name"
                disabled={updateModule.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                step="0.1"
                min="0"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                disabled={updateModule.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateModule.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateModule.isPending}>
              {updateModule.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
