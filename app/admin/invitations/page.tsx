"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy,
  Link2,
  Plus,
  Trash2,
  Clock,
  Users,
  Monitor,
  Globe,
} from "lucide-react";
import { useStudentsWithCGPA } from "@/hooks/student.hooks";
import { usePublicBatches } from "@/hooks/batch.hooks";
import { useDegrees } from "@/hooks/degree.hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchableStudentSelect } from "@/components/admin/SearchableStudentSelect";

interface Invitation {
  id: string;
  code: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  accessedAt: string | null;
  createdAt: string;
  lastIpAddress: string | null;
  lastUserAgent: string | null;
  lastDevice: string | null;
  lastOs: string | null;
  lastBrowser: string | null;
  student: {
    indexNumber: string;
    name: string | null;
    degree: {
      name: string;
      batch: { name: string };
    };
  };
}

export default function InvitationsPage() {
  // Using sonner toast
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [expiresInMinutes, setExpiresInMinutes] = useState("60");
  const [maxUses, setMaxUses] = useState("1");

  const { data: session } = useSession();
  const user = session?.user as any;
  const canEditInvitations =
    user?.role === "SUPER_ADMIN" || user?.canEditInvitations;

  // Fetch batches, degrees, and students
  const { data: batches = [] } = usePublicBatches();
  const { data: degrees = [] } = useDegrees(selectedBatch);
  const { data: students = [] } = useStudentsWithCGPA(
    selectedBatch,
    selectedDegree,
  );

  // Fetch invitations
  const { data: invitations = [], isLoading } = useQuery<Invitation[]>({
    queryKey: ["invitations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/invitations");
      if (!res.ok) throw new Error("Failed to fetch invitations");
      return res.json();
    },
  });

  // Create invitation mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      expiresInMinutes: number;
      maxUses: number;
    }) => {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create invitation");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setIsDialogOpen(false);
      resetForm();

      const link = `${globalThis.location.origin}/student-access?code=${data.code}`;
      navigator.clipboard.writeText(link);

      toast.success(`Invitation Created - Code: ${data.code}`, {
        description: "Link copied to clipboard!",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to create invitation",
      });
    },
  });

  // Delete invitation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/invitations?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invitation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation Deleted", {
        description: "The invitation has been removed",
      });
    },
  });

  const resetForm = () => {
    setSelectedBatch("");
    setSelectedDegree("");
    setSelectedStudent("");
    setExpiresInMinutes("60");
    setMaxUses("1");
  };

  const handleCreate = () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    createMutation.mutate({
      studentId: selectedStudent,
      expiresInMinutes: Number.parseInt(expiresInMinutes, 10),
      maxUses: Number.parseInt(maxUses, 10),
    });
  };

  const copyLink = (code: string) => {
    const link = `${globalThis.location.origin}/student-access?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const isExhausted = (invitation: Invitation) =>
    invitation.useCount >= invitation.maxUses;

  const getStatus = (invitation: Invitation) => {
    if (isExpired(invitation.expiresAt)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isExhausted(invitation)) {
      return <Badge variant="secondary">Used</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Invitations</h1>
          <p className="text-muted-foreground">
            Create and manage student access links
          </p>
        </div>

        {canEditInvitations && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Student Invitation</DialogTitle>
                <DialogDescription>
                  Generate a time-limited access link for a student
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Select
                    value={selectedBatch}
                    onValueChange={(v) => {
                      setSelectedBatch(v);
                      setSelectedDegree("");
                      setSelectedStudent("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b: any) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Select
                    value={selectedDegree}
                    onValueChange={(v) => {
                      setSelectedDegree(v);
                      setSelectedStudent("");
                    }}
                    disabled={!selectedBatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((d: any) => (
                        <SelectItem key={d.name} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Student</Label>
                  <SearchableStudentSelect
                    students={students}
                    selectedStudentId={selectedStudent}
                    onSelect={setSelectedStudent}
                    disabled={!selectedDegree}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expires In</Label>
                    <Select
                      value={expiresInMinutes}
                      onValueChange={setExpiresInMinutes}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Uses</Label>
                    <Select value={maxUses} onValueChange={setMaxUses}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 use</SelectItem>
                        <SelectItem value="2">2 uses</SelectItem>
                        <SelectItem value="3">3 uses</SelectItem>
                        <SelectItem value="5">5 uses</SelectItem>
                        <SelectItem value="10">10 uses</SelectItem>
                        <SelectItem value="1000">Unlimited (1000)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !selectedStudent}
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create & Copy Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Active Invitations
          </CardTitle>
          <CardDescription>
            Manage student access links and track usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Device Info</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {inv.student.indexNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {inv.student.name || "No name"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded">
                        {inv.code}
                      </code>
                    </TableCell>
                    <TableCell>{getStatus(inv)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {inv.useCount}/{inv.maxUses}
                      </span>
                    </TableCell>
                    <TableCell>
                      {inv.useCount > 0 ? (
                        inv.lastIpAddress ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer">
                                  <Monitor className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">
                                    {inv.lastDevice || "Unknown"} /{" "}
                                    {inv.lastOs || "Unknown"}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    <span className="font-semibold">
                                      IP:
                                    </span>{" "}
                                    {inv.lastIpAddress}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Browser:
                                    </span>{" "}
                                    {inv.lastBrowser || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Device:
                                    </span>{" "}
                                    {inv.lastDevice || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-semibold">OS:</span>{" "}
                                    {inv.lastOs || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Accessed:
                                    </span>{" "}
                                    {inv.accessedAt
                                      ? new Date(
                                          inv.accessedAt,
                                        ).toLocaleString()
                                      : "N/A"}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-sm text-yellow-600">
                            Used (No IP)
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Not accessed
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(inv.expiresAt).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(inv.code)}
                          disabled={
                            isExpired(inv.expiresAt) || isExhausted(inv)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {canEditInvitations && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(inv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
