"use client";

import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  message?: string;
}

export function AccessDenied({ message }: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <ShieldX className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          {message ||
            "You don't have permission to access this page. Please contact your administrator if you believe this is an error."}
        </p>
        <Button onClick={() => router.push("/admin")} variant="outline">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
