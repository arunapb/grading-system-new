"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function SessionWatcher() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const signoutCalled = useRef(false);

  useEffect(() => {
    // Public paths that don't require authentication session management
    const publicPaths = ["/login", "/student-access", "/admin/reset-password"];
    const isPublicPath = publicPaths.some((path) => pathname?.startsWith(path));

    // If we have a session but it has the AdminSessionExpired error
    const sessionError = (session as any)?.error;

    if (
      status === "unauthenticated" ||
      sessionError === "AdminSessionExpired"
    ) {
      if (!isPublicPath && !signoutCalled.current) {
        signoutCalled.current = true;
        console.log("Session expired or invalid, logging out...");
        signOut({ callbackUrl: "/login?expired=true", redirect: true });
      }
    } else if (status === "authenticated") {
      // Reset the flag if user becomes authenticated again (re-login)
      signoutCalled.current = false;
    }
  }, [status, session, pathname]);

  return null;
}
