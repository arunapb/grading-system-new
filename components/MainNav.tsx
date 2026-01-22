"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Users, GraduationCap, Settings, LogOut, Book } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";

export function MainNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide navbar in admin panel and login page
  if (pathname?.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  // Get user type from session
  const userType = (session?.user as any)?.type;

  // Determine which navigation items to show based on user type
  const showStudentsButton = userType === "lecturer" || userType === "admin";
  const showAdminButton = userType === "admin";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-lg"
            >
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <span>Grading System</span>
            </Link>
            <div className="flex items-center gap-1">
              {showStudentsButton && (
                <Link
                  href="/students"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                >
                  <Users className="h-4 w-4" />
                  <span>Students</span>
                </Link>
              )}
              {showStudentsButton && (
                <Link
                  href="/modules"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                >
                  <Book className="h-4 w-4" />
                  <span>Modules</span>
                </Link>
              )}
              {showAdminButton && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
