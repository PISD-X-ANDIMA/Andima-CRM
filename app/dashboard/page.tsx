import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function DashboardRoute() {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const scope = await getCurrentUserScope(supabase);
    if (scope?.isManager) {
      redirect("/dashboard/manager-customer-success");
    }
  }
  redirect("/dashboard/sales-executive");
}
