"use client";

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
import { Activity, Clock, CheckCircle, XCircle } from "lucide-react";

export default function ActivityPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: async () => {
      const response = await fetch("/api/admin/activity");
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json();
    },
    refetchInterval: 10000,
  });

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">
          Monitor system actions and events
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            The last 100 system events across all modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity logs found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[150px]">Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
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
                          className="font-mono text-[10px] uppercase"
                        >
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[500px] truncate group relative">
                          <span className="text-sm">
                            {typeof log.details === "string"
                              ? log.details
                              : JSON.stringify(log.details)}
                          </span>
                          <div className="hidden group-hover:block absolute z-50 bg-popover text-popover-foreground p-2 rounded shadow-lg border mt-1 max-w-lg whitespace-pre-wrap break-all text-xs">
                            {JSON.stringify(log.details, null, 2)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
