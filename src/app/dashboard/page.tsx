"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { roleHome } from "@/lib/access-control";

export default function DashboardRouter() {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (userData?.role) {
        router.push(roleHome(userData.role));
      } else {
        router.push("/auth");
      }
    }
  }, [userData, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
    </div>
  );
}
