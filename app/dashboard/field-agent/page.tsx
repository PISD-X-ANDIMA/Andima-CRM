import { Suspense } from "react";
import { redirect } from "next/navigation";
import FieldAgentApp from "@/components/field-agent/FieldAgentApp";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function FieldAgentPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/login");

  const scope = await getCurrentUserScope(supabase);
  if (!scope) redirect("/login");
  if (scope.role !== "field_agent") redirect("/dashboard");

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="p-6">
            <DashboardSkeleton />
          </div>
        }
      >
        <FieldAgentApp currentUser={{ id: scope.user.id, name: scope.name }} />
      </Suspense>
    </div>
  );
}
