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
import { Plus, FolderTree, Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddBatchDialog } from "@/components/admin/AddBatchDialog";
import { useBatches } from "@/hooks/batch.hooks";
import { formatGPA } from "@/lib/gpa-calculator";
import { useSession } from "next-auth/react";

export default function BatchesPage() {
  const { data: batches, isLoading, refetch } = useBatches();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as any;
  const canEditStructure =
    user?.role === "SUPER_ADMIN" || user?.canEditStructure;

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Batch Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage batches, degrees, and view statistics
          </p>
        </div>
        </div>
        {canEditStructure && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Batch
          </Button>
        )}
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>
            View and manage all batches in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !batches || batches.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No batches found</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Batch
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Batch</TableHead>
                    <TableHead className="font-semibold">Degrees</TableHead>
                    <TableHead className="font-semibold">Students</TableHead>
                    <TableHead className="font-semibold">Top GPA</TableHead>
                    <TableHead className="font-semibold">
                      Top 3 Students
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.name} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {batch.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {batch.degrees} degrees
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {batch.studentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {batch.topGPA > 0 ? (
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <span className="font-semibold text-blue-600">
                              {formatGPA(batch.topGPA)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {batch.top3Students.length > 0 ? (
                          <div className="space-y-1">
                            {batch.top3Students.map((student, idx) => (
                              <div
                                key={student.indexNumber}
                                className="text-sm"
                              >
                                <span className="font-medium">
                                  {idx + 1}. {student.name}
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  ({formatGPA(student.cgpa)})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No students
                          </span>
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

      {/* Add Batch Dialog */}
      <AddBatchDialog
        isOpen={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
