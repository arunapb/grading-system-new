"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  HardDrive,
  FileText,
  CheckCircle2,
  XCircle,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useSystemHealth } from "@/hooks/admin.hooks";

export default function HealthPage() {
  const { data: health, isLoading } = useSystemHealth();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleString();
  };

  const getHealthStatus = () => {
    if (!health) return { color: "gray", text: "Unknown" };

    const hasErrors = health.recentErrors.length > 0;
    const lowSuccessRate = health.parsing.successRate < 80;
    const highDiskUsage = health.diskSpace.percentage > 80;

    if (hasErrors || lowSuccessRate || highDiskUsage) {
      return { color: "yellow", text: "Warning" };
    }

    return { color: "green", text: "Healthy" };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-8 text-muted-foreground">
          Failed to load system health
        </div>
      </div>
    );
  }

  const status = getHealthStatus();

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
            <p className="text-muted-foreground mt-1">
              Monitor system status and performance
            </p>
          </div>
          <Badge
            variant={status.color === "green" ? "default" : "secondary"}
            className={`text-lg px-4 py-2 ${status.color === "green" ? "bg-green-600" : "bg-yellow-600"}`}
          >
            <Activity className="h-4 w-4 mr-2" />
            {status.text}
          </Badge>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Disk Space */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {health.diskSpace.percentage.toFixed(1)}%
              </div>
              <Progress value={health.diskSpace.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatBytes(health.diskSpace.used)} /{" "}
                {formatBytes(health.diskSpace.total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total PDFs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total PDFs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.files.totalPDFs}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes(health.files.totalSize)} total
            </p>
          </CardContent>
        </Card>

        {/* Parse Success Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Parse Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {health.parsing.successRate.toFixed(1)}%
              </div>
              <Progress value={health.parsing.successRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {health.parsing.totalParsed} / {health.files.totalPDFs} parsed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Failed Parses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Parse Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {health.parsing.totalFailed}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {health.recentErrors.length} recent errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 10 successful admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            {health.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {health.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                      {activity.details?.filename && (
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.details.filename}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Recent Errors
            </CardTitle>
            <CardDescription>Last 10 failed operations</CardDescription>
          </CardHeader>
          <CardContent>
            {health.recentErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent errors
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {health.recentErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg"
                  >
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{error.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(error.timestamp)}
                      </p>
                      <p className="text-xs text-red-600 mt-1">{error.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
