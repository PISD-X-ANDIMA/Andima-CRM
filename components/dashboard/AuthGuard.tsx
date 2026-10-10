"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
