"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== "/login") {
      router.push("/login");
    }
    if (user && pathname === "/login") {
      router.push("/");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin inline-block w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full" />
          <p className="text-sm text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== "/login") return null;
  if (user && pathname === "/login") return null;

  return <>{children}</>;
}
