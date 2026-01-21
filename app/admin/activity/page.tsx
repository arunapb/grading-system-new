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
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (action !== "all") params.set("action", action);
      if (userType !== "all") params.set("userType", userType);
      if (success !== "all") params.set("success", success);
      if (search) params.set("search", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/admin/activity?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const logs = data?.logs || [];
  const actions = data?.actions || [];

  const resetFilters = () => {
    setAction("all");
    setUserType("all");
    setSuccess("all");
    setSearch("");
    setStartDate("");
    setEndDate("");
  };

  const getUserIcon = (type: string) => {
    switch (type) {
      case "student":
        return <GraduationCap className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes("LOGIN"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (actionType.includes("LOGOUT"))
      return "bg-gray-100 text-gray-800 border-gray-200";
    if (actionType.includes("UPLOAD") || actionType.includes("CREATE"))
      return "bg-green-100 text-green-800 border-green-200";
    if (actionType.includes("DELETE"))
      return "bg-red-100 text-red-800 border-red-200";
    if (actionType.includes("UPDATE"))
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-purple-100 text-purple-800 border-purple-200";
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
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <Select value={action} onValueChange={setAction}>
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
            <Select value={userType} onValueChange={setUserType}>
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
            <Select value={success} onValueChange={setSuccess}>
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

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label
                htmlFor="startDate"
                className="text-sm text-muted-foreground mb-1 block"
              >
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="text-sm text-muted-foreground mb-1 block"
              >
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
              {logs.length} {logs.length === 1 ? "event" : "events"}
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
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[150px]">Action</TableHead>
                    <TableHead className="w-[120px]">User</TableHead>
                    <TableHead>Details</TableHead>
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
                    const userName = details.userName || details.name || "-";
                    const role = details.role;

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] uppercase ${getActionColor(log.action)}`}
                          >
                            {log.action.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {getUserIcon(logUserType)}
                              <span className="text-sm font-medium">
                                {userName}
                              </span>
                            </div>
                            {role && role !== logUserType && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {role}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[400px] truncate group relative">
                            <span className="text-sm text-muted-foreground">
                              {/* Custom display for Login/Logout events to show time explicitly */}
                              {(log.action === "USER_LOGIN" ||
                                log.action === "USER_LOGOUT") &&
                              details.timestamp ? (
                                <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">
                                  {new Date(
                                    details.timestamp,
                                  ).toLocaleTimeString()}
                                </span>
                              ) : null}

                              {typeof details === "string"
                                ? details
                                : Object.entries(details)
                                    .filter(
                                      ([key]) =>
                                        ![
                                          "userName",
                                          "userType",
                                          "role",
                                          "timestamp", // We show timestamp separately or rely on log.createdAt
                                          "iat",
                                          "exp",
                                          "jti",
                                        ].includes(key),
                                    )
                                    .map(([key, val]) => `${key}: ${val}`)
                                    .join(", ") ||
                                  (log.action.includes("LOGIN")
                                    ? "Session active"
                                    : "-")}
                            </span>
                            <div className="hidden group-hover:block absolute z-50 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border mt-1 max-w-lg whitespace-pre-wrap break-all text-xs left-0">
                              <pre>{JSON.stringify(details, null, 2)}</pre>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {log.success ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800 border-green-200"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="bg-red-100 text-red-800 border-red-200"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
