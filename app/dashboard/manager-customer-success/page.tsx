import { ManagerCustomerSuccessDashboard } from "@/components/dashboard/ManagerCustomerSuccessDashboard";
import { getCustomers } from "@/lib/services/customer-service";
import { getSalesExecutiveMetrics } from "@/lib/services/sales-executive-metrics";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ManagerCustomerSuccessDashboardPage() {
  let customers: Awaited<ReturnType<typeof getCustomers>>["customers"] = [];
  let customerCount: number | null = null;
  let initialDataError: string | undefined;
  const salesExecutives: { id: string; name: string }[] = [];

  const supabase = await createServerSupabaseClient();

  // 1. Fetch available Sales Executives from existing company owners and registered users
  if (supabase) {
    try {
      const { data: owners } = await (supabase as any)
        .from("a1_company_list")
        .select("created_by")
        .not("created_by", "is", null);

      const uniqueOwners = Array.from(new Set((owners || []).map((o: any) => o.created_by))).filter(Boolean);
      for (const owner of uniqueOwners) {
        salesExecutives.push({ id: String(owner), name: String(owner) });
      }

      const { data: registers } = await (supabase as any)
        .from("b2_register")
        .select("full_name")
        .not("full_name", "is", null);

      for (const r of registers || []) {
        if (r.full_name && !salesExecutives.some((se) => se.name === r.full_name)) {
          salesExecutives.push({ id: r.full_name, name: r.full_name });
        }
      }

      salesExecutives.sort((a, b) => a.name.localeCompare(b.name));
    } catch {}
  }

  // 2. Fetch all customers (forceAll: true) for aggregate managerial view
  try {
    const result = await getCustomers({ perPage: 100, forceAll: true });
    customers = result.customers;
    customerCount = result.total;
  } catch (error) {
    initialDataError = error instanceof Error ? error.message : "Unable to load customer data from Supabase.";
  }

  // 3. Fetch aggregate KPI metrics
  const metrics = await getSalesExecutiveMetrics();
  if (customerCount !== null) metrics.totalCustomers = customerCount;

  return (
    <ManagerCustomerSuccessDashboard
      initialCustomers={customers}
      metrics={metrics}
      salesExecutives={salesExecutives}
      initialDataError={initialDataError}
    />
  );
}
