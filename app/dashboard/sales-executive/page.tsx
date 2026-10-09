import { SalesExecutiveDashboard } from "@/components/dashboard/SalesExecutiveDashboard";
import { getCustomers } from "@/lib/services/customer-service";
import { getSalesExecutiveMetrics } from "@/lib/services/sales-executive-metrics";

export default async function SalesExecutiveDashboardPage() {
  let customers: Awaited<ReturnType<typeof getCustomers>>["customers"] = [];
  let customerCount: number | null = null;
  let initialDataError: string | undefined;

  try {
    const result = await getCustomers({ perPage: 100 });
    customers = result.customers;
    customerCount = result.total;
  } catch (error) {
    initialDataError = error instanceof Error ? error.message : "Unable to load customer data from Supabase.";
  }

  const metrics = await getSalesExecutiveMetrics();
  if (customerCount !== null) metrics.totalCustomers = customerCount;
  return <SalesExecutiveDashboard initialCustomers={customers} metrics={metrics} initialDataError={initialDataError} />;
}
