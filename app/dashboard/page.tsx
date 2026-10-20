import { redirect } from 'next/navigation';

export default function DashboardRoute() {
  redirect('/dashboard/field-agent?tab=field-agent');
}

