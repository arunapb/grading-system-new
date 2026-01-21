"use client";

import { use } from "react";
import { useParams } from "next/navigation";
import { PDFTable } from "@/components/PDFTable";
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
import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePDFs } from "@/hooks/pdf.hooks";

export default function ParserPage() {
  const params = useParams();
  const batch = decodeURIComponent(params.batch as string);
  const degree = decodeURIComponent(params.degree as string);

  const { data: pdfs = [], isLoading, error, refetch } = usePDFs(batch, degree);

  const batchNumber = batch.replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: `Batch ${batchNumber}`, href: `/${batch}` },
            { label: degree, href: `/${batch}/${degree}/parser` },
            { label: "Parser" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  PDF Parser
                </h1>
                <p className="text-muted-foreground mt-1">
                  Batch {batchNumber} • {degree} • Parse student result PDFs
                </p>
              </div>
            </div>
            <Link href={`/${batch}/${degree}/students`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:text-primary"
              >
                View Students
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Main Content */}
        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle>Result Sheet Management</CardTitle>
            <CardDescription>
              View all PDF files, check their parsing status, and manage
              conversions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-muted-foreground">Loading PDFs...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive font-medium">
                  Error:{" "}
                  {error instanceof Error
                    ? error.message
                    : "Failed to load PDFs"}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <PDFTable
                pdfs={pdfs}
                onRefresh={refetch}
                batch={batch}
                degree={degree}
              />
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
