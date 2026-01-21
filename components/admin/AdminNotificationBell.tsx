"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  useAdminNotifications,
  Notification,
} from "@/hooks/notification.hooks";

export function AdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Use hook
  const { data: notifications = [] } = useAdminNotifications();

  useEffect(() => {
    // Load read IDs from localStorage
    const stored = localStorage.getItem("adminReadNotifications");
    if (stored) {
      setReadIds(new Set(JSON.parse(stored)));
    }
  }, []);

  const markAsRead = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    setReadIds(newReadIds);
    localStorage.setItem(
      "adminReadNotifications",
      JSON.stringify(Array.from(newReadIds)),
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to parser
    router.push("/admin/parser");
    setIsOpen(false);
  };

  // Filter to show only unread notifications
  const unreadNotifications = notifications.filter((n) => !readIds.has(n.id));
  const totalCount = unreadNotifications.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Admin Notifications</span>
          {totalCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {totalCount} unparsed PDF{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unreadNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No unparsed PDFs
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {unreadNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start p-3 cursor-pointer group"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => markAsRead(notification.id, e)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
