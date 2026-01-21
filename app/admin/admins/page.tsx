"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Trash2,
  UserPlus,
  Loader2,
  Copy,
  Check,
  KeyRound,
  Pencil,
  Ban,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
  useGenerateResetCode,
  AdminUser,
} from "@/hooks/admin.hooks";

import { useSession } from "next-auth/react";

export default function AdminsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  const { data: admins, isLoading } = useAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const generateResetCode = useGenerateResetCode();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetCodeDialog, setShowResetCodeDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [createData, setCreateData] = useState({
    name: "",
    username: "",
    password: "",
  });

  const [editData, setEditData] = useState({
    name: "",
    username: "",
    password: "",
  });

  const [resetCodeData, setResetCodeData] = useState<{
    code: string;
    expiresAt: string;
    adminName: string;
  } | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdmin.mutateAsync(createData);
      toast.success("Admin created successfully");
      setShowCreateDialog(false);
      setCreateData({ name: "", username: "", password: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    const payload: any = { id: selectedAdmin.id };
    if (editData.name && editData.name !== selectedAdmin.name)
      payload.name = editData.name;
    if (editData.username && editData.username !== selectedAdmin.username)
      payload.username = editData.username;
    if (editData.password) payload.password = editData.password;

    try {
      await updateAdmin.mutateAsync(payload);
      toast.success("Admin updated successfully");
      setShowEditDialog(false);
      setSelectedAdmin(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    try {
      await deleteAdmin.mutateAsync(id);
      toast.success("Admin deleted successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (
    admin: AdminUser,
    newStatus: "APPROVED" | "BLOCKED",
  ) => {
    try {
      await updateAdmin.mutateAsync({ id: admin.id, status: newStatus });
      toast.success(`Admin ${newStatus.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleGenerateResetCode = async (admin: AdminUser) => {
    try {
      const result = await generateResetCode.mutateAsync({
        adminId: admin.id,
        expiresInMinutes: 30,
      });
      setResetCodeData({
        code: result.resetCode,
        expiresAt: result.expiresAt,
        adminName: result.adminName,
      });
      setShowResetCodeDialog(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Reset code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openEditDialog = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditData({
      name: admin.name,
      username: admin.username,
      password: "",
    });
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "BLOCKED":
        return (
          <Badge variant="destructive">
            <Ban className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and control administrator accounts
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            Create Admin
          </Button>
        )}
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administrators
          </CardTitle>
          <CardDescription>
            All registered admin accounts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}
          {!isLoading && (!admins || admins.length === 0) && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No admins found</p>
            </div>
          )}
          {!isLoading && admins && admins.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reset Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {admin.username}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            admin.role === "SUPER_ADMIN"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {admin.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : "Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(admin.status)}</TableCell>
                      <TableCell>
                        {admin.resetCode ? (
                          <div className="flex items-center gap-2">
                            <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                              {admin.resetCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(admin.resetCode!)}
                            >
                              {copiedCode === admin.resetCode ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSuperAdmin && admin.role !== "SUPER_ADMIN" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(admin)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleGenerateResetCode(admin)}
                              title="Generate Reset Code"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            {admin.status === "APPROVED" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleStatusChange(admin, "BLOCKED")
                                }
                                title="Block"
                                className="text-orange-500 hover:text-orange-600"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleStatusChange(admin, "APPROVED")
                                }
                                title="Approve"
                                className="text-green-500 hover:text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              title="Delete"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Add a new administrator to the system. They will be able to log in
              immediately after creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  placeholder="John Doe"
                  value={createData.name}
                  onChange={(e) =>
                    setCreateData({ ...createData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-username">Username</Label>
                <Input
                  id="create-username"
                  placeholder="johndoe"
                  value={createData.username}
                  onChange={(e) =>
                    setCreateData({ ...createData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="••••••••"
                  value={createData.password}
                  onChange={(e) =>
                    setCreateData({ ...createData, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createAdmin.isPending}>
                {createAdmin.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update administrator details. Leave password blank to keep
              unchanged.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAdmin}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editData.username}
                  onChange={(e) =>
                    setEditData({ ...editData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">
                  New Password (leave blank to keep current)
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="••••••••"
                  value={editData.password}
                  onChange={(e) =>
                    setEditData({ ...editData, password: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateAdmin.isPending}>
                {updateAdmin.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Code Dialog */}
      <Dialog open={showResetCodeDialog} onOpenChange={setShowResetCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Code Generated</DialogTitle>
            <DialogDescription>
              Share this code with {resetCodeData?.adminName}. It will expire in
              30 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-muted p-6 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Reset Code</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-4xl font-bold tracking-widest text-primary">
                  {resetCodeData?.code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    resetCodeData && copyToClipboard(resetCodeData.code)
                  }
                >
                  {copiedCode === resetCodeData?.code ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Expires:{" "}
                {resetCodeData &&
                  new Date(resetCodeData.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowResetCodeDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
