import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl p-8" role="alert">
        Supabase configuration is missing. Set the public Supabase URL and key, then restart the application.
      </main>
    );
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return <DashboardShell><DashboardHeader />{children}</DashboardShell>;
}
