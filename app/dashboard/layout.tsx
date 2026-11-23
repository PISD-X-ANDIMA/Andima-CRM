import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";
import { canAccessPath, roleHome } from "@/lib/auth/route-access";
import { headers } from "next/headers";
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

  const scope = await getCurrentUserScope(supabase);
  if (!scope) redirect("/login");

  const pathname = (await headers()).get("x-pathname");
  if (pathname && !canAccessPath(scope.role, pathname)) {
    redirect(roleHome(scope.role));
  }

  return <DashboardShell><DashboardHeader isManager={Boolean(scope.isManager)} />{children}</DashboardShell>;
}
