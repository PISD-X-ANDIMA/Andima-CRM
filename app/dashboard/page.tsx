'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserInfo {
  name: string;
  role: string;
  email: string;
}

export default function DashboardRoute() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const isSessionLoggedIn = typeof window !== 'undefined' ? sessionStorage.getItem('andima_logged_in') : null;
      const { data: { session } } = await supabase.auth.getSession();

      if (!isSessionLoggedIn && !session) {
        router.replace('/login');
        return;
      }

      // Ambil data user dari localStorage (disimpan saat login)
      try {
        const stored = localStorage.getItem('andima_user');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser({
            name: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'CRM Staff',
            role: 'CRM Staff',
            email: session?.user?.email || '',
          });
        }
      } catch {
        setUser({
          name: session?.user?.email?.split('@')[0] || 'CRM Staff',
          role: 'CRM Staff',
          email: session?.user?.email || '',
        });
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.name || 'User'} 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Role: <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.role}</span> — {user?.email}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Customers', value: '—', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/50' },
          { label: 'Active Meetings', value: '—', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50' },
          { label: 'Pending Tasks', value: '—', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50' },
          { label: 'Conversations', value: '—', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/50' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color} border`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Use the sidebar navigation to access <strong>Sales Executive</strong> features like Company List, Meeting Schedule, Record Conversation, and more.
        </p>
      </div>
    </div>
  );
}

