import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";
import { roleHome } from "@/lib/auth/route-access";

export const dynamic = "force-dynamic";

export default async function DashboardRoute() {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const scope = await getCurrentUserScope(supabase);
    if (scope) {
      redirect(roleHome(scope.role));
    }
  }
  redirect("/dashboard/sales-executive");
}
