import { useQuery } from "@tanstack/react-query";

// Types
export interface Notification {
  id: string;
  type: "new_result" | "unparsed_pdf";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    batch?: string;
    degree?: string;
    moduleCode?: string;
    moduleName?: string;
    studentCount?: number;
    count?: number;
  };
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  error?: string;
}

// Hooks

// Public/Student Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data: NotificationsResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch notifications");
      }
      return data.notifications;
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}

// Admin Notifications
export function useAdminNotifications() {
  return useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const response = await fetch("/api/admin/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch admin notifications");
      }
      const data: NotificationsResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch admin notifications");
      }
      return data.notifications;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
