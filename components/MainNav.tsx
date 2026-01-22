"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Users,
  GraduationCap,
  Settings,
  LogOut,
  Book,
  Menu,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function MainNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Hide navbar in admin panel and login page
  if (pathname?.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  // Get user type from session
  const userType = (session?.user as any)?.type;

  // Determine which navigation items to show based on user type
  const showStudentsButton = userType === "lecturer" || userType === "admin";
  const showAdminButton = userType === "admin";

  const NavItems = () => (
    <>
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold text-lg md:hidden mb-8"
        onClick={() => setOpen(false)}
      >
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <span>Grading System</span>
      </Link>

      {showStudentsButton && (
        <Link
          href="/students"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm font-medium"
          onClick={() => setOpen(false)}
        >
          <Users className="h-4 w-4" />
          <span>Students</span>
        </Link>
      )}
      {showStudentsButton && (
        <Link
          href="/modules"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm font-medium"
          onClick={() => setOpen(false)}
        >
          <Book className="h-4 w-4" />
          <span>Modules</span>
        </Link>
      )}
      {showAdminButton && (
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm font-medium"
          onClick={() => setOpen(false)}
        >
          <Settings className="h-4 w-4" />
          <span>Admin</span>
        </Link>
      )}
    </>
  );

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
              <span className="hidden md:inline">Grading System</span>
              <span className="md:hidden">Grading</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <NavItems />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Desktop Logout */}
            {session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="hidden md:flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  <NavItems />

                  {session && (
                    <>
                      <div className="h-px bg-border my-2" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center justify-start gap-2 px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
