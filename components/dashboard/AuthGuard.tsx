"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/Skeleton";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function verify() {
      const isSessionLoggedIn =
        typeof window !== "undefined"
          ? sessionStorage.getItem("andima_logged_in")
          : null;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isSessionLoggedIn && !session) {
        router.replace("/login");
      } else {
        setAuthorized(true);
      }
    }
    verify();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 p-6" aria-busy="true">
        <Skeleton className="mb-4 h-10 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
