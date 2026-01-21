"use client";

import { useRouter, useParams } from "next/navigation";
import { DegreeCard } from "@/components/DegreeCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { GraduationCap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDegrees } from "@/hooks/degree.hooks";

export default function BatchPage() {
  const router = useRouter();
  const params = useParams();
  const batch = decodeURIComponent(params.batch as string);

  const { data: degrees, isLoading, error, refetch } = useDegrees(batch);

  const handleDegreeClick = (degreeName: string) => {
    router.push(
      `/${encodeURIComponent(batch)}/${encodeURIComponent(degreeName)}/students`,
    );
  };

  // Extract batch number for display
  const batchNumber = batch.replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: `Batch ${batchNumber}` },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Batch {batchNumber}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Select a degree program to continue
                </p>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Batches
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Main Content */}
        <Card className="shadow-xl border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Degree Programs</CardTitle>
            <CardDescription>
              Choose a degree program to view students and manage results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner size="lg" />
                <p className="mt-4 text-muted-foreground">Loading degrees...</p>
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
            ) : !degrees || degrees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">
                  No degree programs found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add degree folders (IT, ITM, AI) in data/input/{batch}/
                  directory
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {degrees.map((degree) => (
                  <DegreeCard
                    key={degree.name}
                    degree={degree.name}
                    studentCount={degree.students}
                    hasData={degree.hasData}
                    onClick={() => handleDegreeClick(degree.name)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>University of Moratuwa • IT Faculty Student Results System</p>
        </div>
      </div>
    </div>
  );
}
