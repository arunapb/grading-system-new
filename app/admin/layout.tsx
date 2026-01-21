"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  BarChart3,
  Upload,
  Settings,
  Users,
  Download,
  FileText,
  Activity,
  Home,
  Book,
  Link2,
  GraduationCap,
  Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/batches", label: "Batches", icon: FolderTree },
  { href: "/admin/structure", label: "Structure", icon: Settings },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/modules", label: "Modules", icon: Book },
  { href: "/admin/grades", label: "Grades", icon: GraduationCap },
  { href: "/admin/invitations", label: "Invitations", icon: Link2 },
  { href: "/admin/admins", label: "Admins", icon: Shield },
  { href: "/admin/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/scraper", label: "Scraper", icon: Download },
  { href: "/admin/upload", label: "Upload PDFs", icon: Upload },
  { href: "/admin/parser", label: "Parser", icon: FileText },
  { href: "/admin/files", label: "Files", icon: FileText },
  { href: "/admin/activity", label: "Activity Log", icon: Activity },
];

function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Settings className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Admin Panel</span>
                  <span className="text-xs text-muted-foreground">
                    Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => {
                  const isSuperAdminOnly =
                    item.href === "/admin/invitations" ||
                    item.href === "/admin/admins" ||
                    item.href === "/admin/activity";
                  return isSuperAdminOnly ? userRole === "SUPER_ADMIN" : true;
                })
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Home">
              <Link href="/">
                <Home />
                <span>Back to Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Header with toggle */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Admin Panel</h1>
            </div>
            <div className="ml-auto">
              <AdminNotificationBell />
            </div>
          </header>
          {/* Content */}
          <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
