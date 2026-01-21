"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BatchCard } from "@/components/BatchCard";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { GraduationCap } from "lucide-react";
import { usePublicBatches } from "@/hooks/batch.hooks";

export default function Home() {
  const router = useRouter();
  const { data: batches, isLoading, error, refetch } = usePublicBatches();

  const handleBatchClick = (batchName: string) => {
    router.push(`/${encodeURIComponent(batchName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            IT Faculty Student Results System
          </h1>
          <p className="text-xl text-muted-foreground">
            University of Moratuwa • Faculty of Information Technology
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Main Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading batches...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive font-medium">
              Error: {error.message}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : !batches || batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No batches found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add batch folders in data/input/ directory
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {batches.map((batch) => (
              <BatchCard
                key={batch.name}
                batch={batch.name}
                degreeCount={batch.degrees}
                studentCount={batch.students}
                onClick={() => handleBatchClick(batch.name)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>University of Moratuwa • IT Faculty Student Results System</p>
        </div>
      </div>
    </div>
  );
}
