"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  User,
  Shield,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const USER_TYPES = [
  { value: "all", label: "All Users" },
  { value: "student", label: "Students" },
  { value: "admin", label: "Admins" },
  { value: "lecturer", label: "Lecturers" },
];

const SUCCESS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "true", label: "Success Only" },
  { value: "false", label: "Failed Only" },
];

export default function ActivityPage() {
  const [action, setAction] = useState("all");
  const [userType, setUserType] = useState("all");
  const [success, setSuccess] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null); // For dialog details
  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "admin",
      "activity",
      action,
      userType,
      success,
      search,
      startDate,
      endDate,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (action !== "all") params.set("action", action);
      if (userType !== "all") params.set("userType", userType);
      if (success !== "all") params.set("success", success);
      if (search) params.set("search", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const response = await fetch(`/api/admin/activity?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json();
    },
    // Keep standard refetch interval or remove if pagination is aggressive
    refetchInterval: 60000,
  });

  const logs = data?.logs || [];
  const actions = data?.actions || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const resetFilters = () => {
    setAction("all");
    setUserType("all");
    setSuccess("all");
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getUserIcon = (type: string) => {
    switch (type) {
      case "student":
        return <GraduationCap className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes("LOGIN"))
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
    if (actionType.includes("LOGOUT"))
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
    if (actionType.includes("UPLOAD") || actionType.includes("CREATE"))
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
    if (actionType.includes("DELETE"))
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    if (actionType.includes("UPDATE"))
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
    return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system actions and events
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in details..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <Select
              value={action}
              onValueChange={(v) => {
                setAction(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((a: string) => (
                  <SelectItem key={a} value={a}>
                    {a.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User Type Filter */}
            <Select
              value={userType}
              onValueChange={(v) => {
                setUserType(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Success Filter */}
            <Select
              value={success}
              onValueChange={(v) => {
                setSuccess(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {SUCCESS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Button */}
            <Button variant="outline" onClick={resetFilters} className="w-full">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Events
            <Badge variant="secondary" className="ml-2">
              {pagination.total} {pagination.total === 1 ? "event" : "events"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Filtered system events and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity logs found matching the filters
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead className="w-[150px]">Action</TableHead>
                      <TableHead className="w-[150px]">User</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => {
                      const details = log.details || {};
                      const logUserType =
                        details.userType || details.type || "unknown";
                      const userName =
                        details.userName ||
                        details.name ||
                        details.studentName ||
                        "-"; // Fallback to studentName if old log
                      const role = details.role;

                      return (
                        <TableRow
                          key={log.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`font-mono text-[10px] uppercase border px-2 py-0.5 whitespace-nowrap ${getActionColor(log.action)}`}
                            >
                              {log.action.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getUserIcon(logUserType)}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium leading-none truncate max-w-[120px]">
                                  {userName}
                                </span>
                                {role && role !== logUserType && (
                                  <span className="text-[10px] text-muted-foreground uppercase">
                                    {role}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {JSON.stringify(details)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {log.success ? (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="bg-red-50 text-red-700 border-red-200"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, pagination.total)} of{" "}
                  {pagination.total} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage(Math.min(pagination.totalPages, page + 1))
                    }
                    disabled={page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity Details
            </DialogTitle>
            <DialogDescription>
              Full event information and payload
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground block">
                    Action
                  </span>
                  <span>{selectedLog.action}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block">
                    Time
                  </span>
                  <span>
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block">
                    User
                  </span>
                  <span>
                    {selectedLog.details?.userName ||
                      selectedLog.details?.name ||
                      "-"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block">
                    Status
                  </span>
                  <span
                    className={
                      selectedLog.success
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {selectedLog.success ? "Success" : "Failed"}
                  </span>
                </div>
              </div>

              <div className="border rounded-md bg-muted p-4 overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
